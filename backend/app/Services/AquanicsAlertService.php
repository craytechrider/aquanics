<?php

namespace App\Services;

use App\Mail\AlertNotification;
use App\Models\Alert;
use App\Models\AlertRecipient;
use App\Models\User;
use App\Models\UserPushToken;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AquanicsAlertService
{
    public function __construct(
        protected FirebaseService $firebase,
        protected SensorThresholdEvaluator $thresholds,
    ) {}

    /**
     * Check all configured Aquanics sensors.
     */
    public function check(): array
    {
        $current = $this->firebase->getCurrent();

        $configuration = $this->firebase->getConfiguration();

        if ($this->isDeviceOffline($current)) {
            $alert = $this->createAlertIfNeeded(
                'device',
                null,
                '',
                'Monitoring Device Offline',
                'The monitoring device has not reported for more than five minutes.',
                null,
                null,
                'device',
                'device:' . env('AQUANICS_DEVICE_ID', '8823-AF92-1102')
            );

            return $alert ? [$alert] : [];
        }

        $this->resetActiveAlert('device');
        $results = [];

        foreach ($configuration as $sensor => $limit) {
            if (!is_array($limit)) {
                continue;
            }

            $value = $current[$sensor] ?? null;
            if (!is_numeric($value) || !is_finite((float) $value)) {
                continue;
            }

            $results[] = $this->checkSensor(
                (string) $sensor,
                (float) $value,
                $limit,
                is_string($limit['unit'] ?? null) ? $limit['unit'] : '',
            );
        }

        return array_values(
            array_filter($results)
        );
    }

    private function isDeviceOffline(array $current): bool
    {
        $timestamps = [];

        foreach (['lastUpdated', 'lastUpdate'] as $key) {
            $timestamp = $this->parseDeviceTimestamp($current[$key] ?? null);
            if ($timestamp !== null) {
                $timestamps[] = $timestamp;
            }
        }

        if (
            empty($timestamps) &&
            isset($current['date'], $current['time'])
        ) {
            $timestamp = $this->parseDeviceTimestamp(
                $current['date'] . ' ' . $current['time']
            );
            if ($timestamp !== null) {
                $timestamps[] = $timestamp;
            }
        }

        if (empty($timestamps)) {
            return false;
        }

        return now('Asia/Manila')->getTimestamp() - max($timestamps) > 300;
    }

    private function parseDeviceTimestamp(mixed $value): ?int
    {
        if (is_numeric($value)) {
            $timestamp = (int) $value;
            return $timestamp > 1_000_000_000_000
                ? (int) floor($timestamp / 1000)
                : $timestamp;
        }

        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            if (preg_match('/^\d{4}-\d{2}-\d{2}[ T]\d{2}[-:]\d{2}[-:]\d{2}$/', $value)) {
                $normalized = str_replace('-', ':', substr($value, 11));
                $value = substr($value, 0, 10) . ' ' . $normalized;

                return (new DateTimeImmutable(
                    $value,
                    new DateTimeZone('Asia/Manila')
                ))->getTimestamp();
            }

            return (new DateTimeImmutable(
                $value,
                new DateTimeZone('Asia/Manila')
            ))->getTimestamp();
        } catch (\Exception) {
            return null;
        }
    }

    /**
     * Check a sensor against its configured safe range.
     */
    protected function checkSensor(
        string $sensor,
        float $value,
        array $limit,
        string $unit
    ): ?Alert {
        $status = $this->thresholds->classify($value, $limit);

        if ($status === 'normal') {
            $this->resetActiveAlert($sensor);
            return null;
        }

        if ($status !== 'critical') {
            return null;
        }

        $low = is_numeric($limit['low'] ?? null)
            ? (float) $limit['low']
            : null;
        $high = is_numeric($limit['high'] ?? null)
            ? (float) $limit['high']
            : null;
        $sensorName = $this->sensorName($sensor);

        return $this->createAlertIfNeeded(
            $sensor,
            $value,
            $unit,
            "Abnormal {$sensorName}",
            "The {$sensorName} reading is outside its configured safe range.",
            $low,
            $high
        );
    }

    private function sensorName(string $sensor): string
    {
        $labels = [
            'ph' => 'pH',
            'ammonia' => 'Ammonia',
            'dissolvedOxygen' => 'Dissolved Oxygen',
            'waterTemp' => 'Water Temperature',
            'waterPercent' => 'Water Level',
            'waterLevel' => 'Water Level Distance',
            'batteryVoltage' => 'Battery',
            'currentDraw' => 'Current Draw',
            'distance' => 'Distance',
        ];

        return $labels[$sensor]
            ?? ucwords(preg_replace('/([a-z])([A-Z])/', '$1 $2', $sensor));
    }

    /**
     * Create or distribute one active alert event for the sensor.
     */
    protected function createAlertIfNeeded(
        string $sensor,
        ?float $value,
        string $unit,
        string $title,
        string $message,
        ?float $low,
        ?float $high,
        string $type = 'sensor',
        ?string $activeKey = null
    ): ?Alert {
        $activeKey ??= "sensor:{$sensor}";
        $existing = Alert::query()
            ->where('sensor', $sensor)
            ->where('severity', 'critical')
            ->whereNull('resolved_at')
            ->latest()
            ->first();

        if ($existing) {
            $this->distributeAlert($existing);
            return null;
        }

        $rangeMessage = '';

        if ($low !== null && $high !== null) {
            $rangeMessage =
                " Configured safe range: {$low}–{$high} {$unit}.";
        } elseif ($low !== null) {
            $rangeMessage =
                " Configured minimum: {$low} {$unit}.";
        } elseif ($high !== null) {
            $rangeMessage =
                " Configured maximum: {$high} {$unit}.";
        }

        try {
            $alert = Alert::create([
                'user_id' => null,
                'type' => $type,

                'severity' => 'critical',

                'title' => $title,

                'message' =>
                    $message .
                    ($value !== null ? " Current value: {$value} {$unit}." : '') .
                    $rangeMessage,

                'sensor' => $sensor,

                'value' => $value,

                'unit' => $unit,

                'route' => '/alerts',

                'is_read' => false,

                'email_sent' => false,

                'sms_sent' => false,

                'push_sent' => false,
                'active_key' => $activeKey,
            ]);
        } catch (QueryException $exception) {
            $existing = Alert::query()
                ->where('active_key', $activeKey)
                ->first();

            if (!$existing) {
                throw $exception;
            }

            $this->distributeAlert($existing);

            return null;
        }

        $this->distributeAlert($alert);

        return $alert;
    }

    private function distributeAlert(Alert $alert): void
    {
        User::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->chunkById(100, function ($users) use ($alert): void {
                foreach ($users as $user) {
                    $recipientIdentity = [
                        'alert_id' => $alert->id,
                        'user_id' => $user->id,
                    ];

                    try {
                        $recipient = AlertRecipient::firstOrCreate(
                            $recipientIdentity,
                            [
                                'is_read' => false,
                                'email_sent' => false,
                                'sms_sent' => false,
                                'push_sent' => false,
                            ]
                        );
                    } catch (QueryException $exception) {
                        $recipient = AlertRecipient::query()
                            ->where($recipientIdentity)
                            ->first();

                        if (!$recipient) {
                            throw $exception;
                        }
                    }

                    if (!$recipient->wasRecentlyCreated) {
                        continue;
                    }

                    if ($user->email_alerts && $user->email) {
                        try {
                            Mail::to($user->email)->send(
                                new AlertNotification($alert)
                            );
                            $recipient->update(['email_sent' => true]);
                            $alert->update(['email_sent' => true]);
                        } catch (\Throwable $e) {
                            Log::error('Aquanics email alert failed.', [
                                'alert_id' => $alert->id,
                                'user_id' => $user->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }

                    if ($user->sms_alerts && $user->phone) {
                        Log::info('Aquanics SMS notification pending provider setup.', [
                            'alert_id' => $alert->id,
                            'user_id' => $user->id,
                        ]);
                    }

                    $this->sendPushNotifications($user->id, $alert, $recipient);
                }
            });
    }

    /**
     * Send FCM push notifications to every registered
     * browser/device belonging to the user.
     */
    protected function sendPushNotifications(
        int $userId,
        Alert $alert,
        AlertRecipient $recipient
    ): void {
        // ========================================================
        // FIND USER TOKENS
        // ========================================================

        $tokens = UserPushToken::query()
            ->where('user_id', $userId)
            ->get();

        if ($tokens->isEmpty()) {
            Log::info(
                'Aquanics push notification skipped: no FCM tokens.',
                [
                    'alert_id' => $alert->id,
                    'user_id' => $userId,
                ]
            );

            return;
        }

        // ========================================================
        // SEND TO EVERY REGISTERED DEVICE
        // ========================================================

        $sent = false;

        foreach ($tokens as $pushToken) {
            try {
                $success =
                    $this->firebase->sendPushNotification(
                        $pushToken->token,

                        'Aquanics Alert',

                        $alert->title .
                            ': ' .
                            $alert->message,

                        [
                            'type' => 'alert',

                            'alert_id' =>
                            $alert->id,

                            'sensor' =>
                            $alert->sensor ?? '',

                            'value' =>
                            $alert->value ?? '',

                            'unit' =>
                            $alert->unit ?? '',

                            'severity' =>
                            $alert->severity,

                            'route' =>
                            $alert->route ??
                                '/alerts',
                        ]
                    );

                if ($success) {
                    $sent = true;

                    Log::info(
                        'Aquanics push notification sent.',
                        [
                            'alert_id' => $alert->id,
                            'user_id' => $userId,
                            'token_id' => $pushToken->id,
                            'sensor' => $alert->sensor,
                        ]
                    );
                }
            } catch (\Throwable $e) {
                Log::error(
                    'Aquanics push notification failed.',
                    [
                        'alert_id' => $alert->id,
                        'user_id' => $userId,
                        'token_id' => $pushToken->id,
                        'error' => $e->getMessage(),
                    ]
                );
            }
        }

        // ========================================================
        // MARK PUSH AS SENT
        // ========================================================

        if ($sent) {
            $recipient->update([
                'push_sent' => true,
            ]);
            $alert->update(['push_sent' => true]);
        }
    }

    /**
     * Resolve active alerts without changing each recipient's read state.
     */
    protected function resetActiveAlert(
        string $sensor
    ): void {
        Alert::query()
            ->where('sensor', $sensor)
            ->where('severity', 'critical')
            ->whereNull('resolved_at')
            ->update([
                'resolved_at' => now(),
                'active_key' => null,
            ]);
    }
}
