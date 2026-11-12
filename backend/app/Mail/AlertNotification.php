<?php

namespace App\Mail;

use App\Models\Alert;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AlertNotification extends Mailable
{
    use Queueable, SerializesModels;

    public Alert $alert;

    public function __construct(Alert $alert)
    {
        $this->alert = $alert;
    }

    public function build()
    {
        $sensorName = $this->alert->sensor
            ? ucwords(str_replace(['_', '-'], ' ', $this->alert->sensor))
            : 'System';

        $recommendedAction = match ($this->alert->sensor ?? '') {
            'ph' => 'Adjust the water chemistry and verify pH stabilizers, aeration, and nutrient dosing.',
            'ammonia' => 'Perform a partial water change and verify filtration, biofilter efficiency, and feed rates.',
            'waterTemp' => 'Check the water heater, aeration, and circulation to stabilize water temperature.',
            'waterPercent', 'waterLevel' => 'Inspect the reservoir level, refill as needed, and confirm the pump and float controls are functioning.',
            'battery' => 'Recharge or replace the battery and inspect the power system for stable charging.',
            'batteryVoltage' => 'Recharge or replace the battery and inspect the power system for stable charging.',
            'dissolvedOxygen' => 'Increase aeration and inspect the air pump, diffusers, and water circulation.',
            default => 'Inspect the system, verify the sensor readings, and perform the recommended maintenance checks immediately.',
        };

        $safeRange = 'Check system configuration';
        if (preg_match(
            '/Configured (?:safe range|minimum|maximum):\s*(.+)$/i',
            $this->alert->message,
            $matches
        )) {
            $safeRange = rtrim(trim($matches[1]), '.');
        }

        $generatedAt = $this->alert->created_at
            ? $this->alert->created_at->setTimezone('Asia/Manila')->format('F j, Y \a\t H:i')
            : now('Asia/Manila')->format('F j, Y \a\t H:i');

        return $this->subject('Aquaponics Alert: ' . $this->alert->title)
            ->view('emails.alert-notification', [
                'sensorName' => $sensorName,
                'recommendedAction' => $recommendedAction,
                'safeRange' => $safeRange,
                'generatedAt' => $generatedAt,
            ]);
    }
}
