<?php

namespace App\Services;

use App\Models\User;

class DefaultUserDataSeeder
{
    public function seed(User $user): void
    {
        $sensors = [
            ['key' => 'ph', 'name' => 'pH Level', 'value' => 7.2, 'unit' => 'pH', 'status' => 'safe', 'trend' => 'stable', 'history' => [7.0, 7.1, 7.1, 7.2, 7.2, 7.3, 7.2]],
            ['key' => 'do', 'name' => 'Dissolved Oxygen', 'value' => 6.5, 'unit' => 'mg/L', 'status' => 'safe', 'trend' => 'up', 'history' => [6.0, 6.1, 6.2, 6.3, 6.4, 6.4, 6.5]],
            ['key' => 'temp', 'name' => 'Temperature', 'value' => 24.5, 'unit' => '°C', 'status' => 'safe', 'trend' => 'stable', 'history' => [24.0, 24.2, 24.3, 24.5, 24.5, 24.6, 24.5]],
            ['key' => 'ammonia', 'name' => 'Ammonia', 'value' => 0.02, 'unit' => 'mg/L', 'status' => 'safe', 'trend' => 'down', 'history' => [0.05, 0.04, 0.04, 0.03, 0.03, 0.02, 0.02]],
            ['key' => 'waterLevel', 'name' => 'Water Level', 'value' => 85, 'unit' => '%', 'status' => 'safe', 'trend' => 'stable', 'history' => [85, 85, 84, 85, 85, 85, 85]],
        ];
        foreach ($sensors as $sensor) {
            $user->sensors()->create($sensor);
        }

        $devices = [
            ['key' => 'pump', 'name' => 'Water Pump', 'is_on' => true, 'mode' => 'auto'],
            ['key' => 'aerator', 'name' => 'Aerator', 'is_on' => true, 'mode' => 'auto'],
            ['key' => 'lights', 'name' => 'Grow Lights', 'is_on' => false, 'mode' => 'schedule', 'schedule' => '6PM - 6AM'],
            ['key' => 'feeder', 'name' => 'Auto Feeder', 'is_on' => true, 'mode' => 'schedule', 'last_fed' => '10:30 AM', 'next_feed' => '02:00 PM'],
        ];
        foreach ($devices as $device) {
            $user->systemDevices()->create($device);
        }

        $alerts = [
            ['title' => 'Low Oxygen Warning', 'message' => 'Dissolved Oxygen dropped below 5.0 mg/L in Tank 2.', 'severity' => 'warning'],
            ['title' => 'System Online', 'message' => 'All systems are running normally.', 'severity' => 'success'],
            ['title' => 'Feeder Refill Needed', 'message' => 'Main feeder is below 10% capacity.', 'severity' => 'info'],
        ];
        foreach ($alerts as $alert) {
            $user->alerts()->create($alert);
        }

        $rules = [
            ['name' => 'Maintain pH Level', 'condition_text' => 'If pH < 6.5', 'action' => 'Turn on pH Up Pump', 'sensor' => 'pH Level', 'condition_operator' => 'Less than', 'condition_value' => 6.5, 'active' => true],
            ['name' => 'Emergency Aeration', 'condition_text' => 'If DO < 4.0 mg/L', 'action' => 'Turn on Backup Aerator', 'sensor' => 'Dissolved Oxygen', 'condition_operator' => 'Less than', 'condition_value' => 4.0, 'active' => true],
            ['name' => 'Night Cycle Lights', 'condition_text' => 'Time = 18:00', 'action' => 'Turn on Grow Lights', 'sensor' => null, 'condition_operator' => 'Equals', 'condition_value' => null, 'active' => false],
        ];
        foreach ($rules as $rule) {
            $user->automationRules()->create($rule);
        }

        $schedules = [
            ['name' => 'Morning Feed', 'time' => '08:00', 'frequency' => 'daily', 'species' => 'Tilapia', 'fish_age_weeks' => 12, 'active' => true],
            ['name' => 'Afternoon Feed', 'time' => '14:00', 'frequency' => 'daily', 'species' => 'Tilapia', 'fish_age_weeks' => 12, 'active' => true],
        ];
        foreach ($schedules as $schedule) {
            $user->feedingSchedules()->create($schedule);
        }

        $reports = [
            ['name' => 'Monthly Performance Summary', 'date_label' => 'Feb 2026', 'size' => '2.4 MB', 'type' => 'PDF'],
            ['name' => 'Water Quality Compliance', 'date_label' => 'Jan 2026', 'size' => '1.8 MB', 'type' => 'PDF'],
            ['name' => 'Yield & Harvest Report', 'date_label' => 'Q4 2025', 'size' => '4.2 MB', 'type' => 'CSV'],
            ['name' => 'System Maintenance Log', 'date_label' => '2025 Annual', 'size' => '1.1 MB', 'type' => 'PDF'],
            ['name' => 'Sensor Calibration Data', 'date_label' => 'Dec 2025', 'size' => '0.8 MB', 'type' => 'CSV'],
        ];
        foreach ($reports as $report) {
            $user->reports()->create($report);
        }

        $uid = strtoupper(substr(md5($user->id.now()->timestamp), 0, 8));
        $iotDevices = [
            ['name' => 'Main Control Unit (MCU-01)', 'device_id' => substr($uid, 0, 4).'-'.substr($uid, 4, 4).'-'.sprintf('%04d', $user->id), 'status' => 'online', 'last_active' => now()->subMinutes(2)],
            ['name' => 'Sensor Node (Tank 2)', 'device_id' => substr($uid, 0, 4).'-'.substr($uid, 4, 4).'-'.sprintf('%04d', $user->id + 1000), 'status' => 'online', 'last_active' => now()->subMinutes(5)],
        ];
        foreach ($iotDevices as $device) {
            $user->iotDevices()->create($device);
        }

        $predictions = [
            ['day' => 'Mon', 'growth' => 12, 'yield' => 10, 'ideal' => 14],
            ['day' => 'Tue', 'growth' => 14, 'yield' => 12, 'ideal' => 15],
            ['day' => 'Wed', 'growth' => 18, 'yield' => 15, 'ideal' => 18],
            ['day' => 'Thu', 'growth' => 22, 'yield' => 18, 'ideal' => 22],
            ['day' => 'Fri', 'growth' => 24, 'yield' => 22, 'ideal' => 25],
            ['day' => 'Sat', 'growth' => 28, 'yield' => 26, 'ideal' => 29],
            ['day' => 'Sun', 'growth' => 32, 'yield' => 30, 'ideal' => 33],
        ];
        foreach ($predictions as $data) {
            $user->predictiveData()->create($data);
        }
    }
}
