<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FirebaseService
{
    protected $factory;

    protected $database;

    public function __construct()
    {
        $this->factory = (new Factory)
            ->withServiceAccount(
                config('services.firebase.credentials')
            )
            ->withDatabaseUri(
                config('services.firebase.database_url')
            );

        $this->database = $this->factory->createDatabase();
    }

    /**
     * Get any Firebase Realtime Database path.
     */
    public function get(string $path)
    {
        return $this->database
            ->getReference($path)
            ->getValue();
    }

    /**
     * Get the latest ESP32 sensor readings.
     *
     * Firebase:
     * /current
     */
    public function getCurrent(): array
    {
        $data = $this->get('current');

        return is_array($data)
            ? $data
            : [];
    }

    /**
     * Get the sensor limits configured
     * from the Aquanics Configuration modal.
     *
     * Firebase:
     * /configuration/sensors
     */
    public function getConfiguration(): array
    {
        $data = $this->get(
            'configuration/sensors'
        );

        return is_array($data)
            ? $data
            : [];
    }

    /**
     * Get a specific current sensor value.
     *
     * Example:
     * getCurrentValue('ph')
     * getCurrentValue('ammonia')
     * getCurrentValue('waterTemp')
     */
    public function getCurrentValue(
        string $sensor
    ): mixed {
        return $this->get(
            "current/{$sensor}"
        );
    }

    /**
     * Get the configuration for one sensor.
     *
     * Example:
     * getSensorLimit('ph')
     *
     * Returns:
     *
     * [
     *     'low' => 6,
     *     'high' => 8
     * ]
     */
    public function getSensorLimit(
        string $sensor
    ): array {
        $data = $this->get(
            "configuration/sensors/{$sensor}"
        );

        return is_array($data)
            ? $data
            : [];
    }

    /**
     * Send Firebase Cloud Messaging notification
     * to one registered browser/device.
     */
    public function sendPushNotification(
        string $token,
        string $title,
        string $body,
        array $data = []
    ): bool {
        try {
            $messaging = $this->factory->createMessaging();

            /*
             * FCM data values must be strings.
             */
            $stringData = [];

            foreach ($data as $key => $value) {
                $stringData[$key] = (string) $value;
            }

            /*
             * Create the FCM message using the
             * registration token as the target.
             */
            $message = CloudMessage::withTarget(
                'token',
                $token
            )
                ->withNotification(
                    Notification::create(
                        $title,
                        $body
                    )
                )
                ->withData($stringData);

            /*
             * Send the notification.
             */
            $messaging->send($message);

            return true;
        } catch (\Throwable $e) {
            Log::error(
                'Aquanics FCM push notification failed.',
                [
                    'token' => substr($token, 0, 20) . '...',
                    'error' => $e->getMessage(),
                ]
            );

            return false;
        }
    }
}
