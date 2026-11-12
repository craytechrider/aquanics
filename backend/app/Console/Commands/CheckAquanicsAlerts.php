<?php

namespace App\Console\Commands;

use App\Services\AquanicsAlertService;
use Illuminate\Console\Command;

class CheckAquanicsAlerts extends Command
{
    protected $signature = 'aquanics:check-alerts';

    protected $description =
    'Check Aquanics sensor values and create alerts';

    public function handle(
        AquanicsAlertService $alerts
    ): int {
        $results = $alerts->check();

        if (empty($results)) {
            $this->info(
                'Aquanics check completed. No new alerts.'
            );

            return self::SUCCESS;
        }

        foreach ($results as $alert) {
            $this->warn(
                "{$alert->title}: {$alert->value} {$alert->unit}"
            );
        }

        $this->info(
            count($results) .
                ' new alert(s) created.'
        );

        return self::SUCCESS;
    }
}
