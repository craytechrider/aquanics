<?php

namespace App\Services;

use App\Mail\AlertNotification;
use App\Models\Alert;
use App\Models\IotDevice;
use App\Models\UserPushToken;
use DateTimeImmutable;
use DateTimeZone;
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
            return [];
        }

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
     * Create an alert if there is no active unread alert
     * for the same sensor/user.
     */
    protected function createAlertIfNeeded(
        string $sensor,
        float $value,
        string $unit,
        string $title,
        string $message,
        ?float $low,
        ?float $high
    ): ?Alert {
        // ========================================================
        // FIND DEVICE OWNER
        // ========================================================

        $deviceId = env(
            'AQUANICS_DEVICE_ID',
            '8823-AF92-1102'
        );

        $device = IotDevice::with('user')
            ->where('device_id', $deviceId)
            ->first();

        if (!$device || !$device->user) {
            Log::error(
                'Aquanics alert could not determine device owner.',
                [
                    'device_id' => $deviceId,
                    'sensor' => $sensor,
                ]
            );

            return null;
        }

        $user = $device->user;

        // ========================================================
        // ANTI-SPAM
        // ========================================================

        $existing = Alert::query()
            ->where('user_id', $user->id)
            ->where('sensor', $sensor)
            ->where('severity', 'critical')
            ->whereNull('resolved_at')
            ->latest()
            ->first();

        if ($existing) {
            return null;
        }

        // ========================================================
        // RANGE MESSAGE
        // ========================================================

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

        // ========================================================
        // CREATE ALERT
        // ========================================================

        $alert = Alert::create([
            'user_id' => $user->id,

            'type' => 'sensor',

            'severity' => 'critical',

            'title' => $title,

            'message' =>
            $message .
                " Current value: {$value} {$unit}." .
                $rangeMessage,

            'sensor' => $sensor,

            'value' => $value,

            'unit' => $unit,

            'route' => '/alerts',

            'is_read' => false,

            'email_sent' => false,

            'sms_sent' => false,

            'push_sent' => false,
        ]);

        // ========================================================
        // EMAIL NOTIFICATION
        // ========================================================

        if (
            $user->email_alerts &&
            !empty($user->email)
        ) {
            try {
                Mail::to($user->email)->send(
                    new AlertNotification($alert)
                );

                $alert->update([
                    'email_sent' => true,
                ]);

                Log::info(
                    'Aquanics email alert sent.',
                    [
                        'alert_id' => $alert->id,
                        'user_id' => $user->id,
                        'email' => $user->email,
                    ]
                );
            } catch (\Throwable $e) {
                Log::error(
                    'Aquanics email alert failed.',
                    [
                        'alert_id' => $alert->id,
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'error' => $e->getMessage(),
                    ]
                );
            }
        }

        // ========================================================
        // SMS
        // ========================================================

        if (
            $user->sms_alerts &&
            !empty($user->phone)
        ) {
            Log::info(
                'Aquanics SMS notification pending provider setup.',
                [
                    'alert_id' => $alert->id,
                    'user_id' => $user->id,
                    'phone' => $user->phone,
                ]
            );
        }

        // ========================================================
        // PUSH NOTIFICATION
        // ========================================================

        $this->sendPushNotifications(
            $user->id,
            $alert
        );

        return $alert;
    }

    /**
     * Send FCM push notifications to every registered
     * browser/device belonging to the user.
     */
    protected function sendPushNotifications(
        int $userId,
        Alert $alert
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
            $alert->update([
                'push_sent' => true,
            ]);
        }
    }

    /**
     * Mark active alert as read when the sensor
     * returns to its normal range.
     */
    protected function resetActiveAlert(
        string $sensor
    ): void {
        $deviceId = env('AQUANICS_DEVICE_ID', '8823-AF92-1102');
        $userId = IotDevice::query()
            ->where('device_id', $deviceId)
            ->value('user_id');

        if (!$userId) {
            return;
        }

        Alert::query()
            ->where('user_id', $userId)
            ->where('sensor', $sensor)
            ->where('severity', 'critical')
            ->whereNull('resolved_at')
            ->update([
                'is_read' => true,
                'resolved_at' => now(),
            ]);
    }
}
