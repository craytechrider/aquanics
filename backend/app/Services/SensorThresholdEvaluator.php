<?php

namespace App\Services;

class SensorThresholdEvaluator
{
    private const WARNING_BAND_RATIO = 0.1;

    /**
     * The live Firebase configuration currently provides low/high bounds only.
     * Values outside those bounds are critical; the inner 10% at either edge
     * is the warning band, matching the React dashboard.
     */
    public function classify(mixed $reading, array $configuration): string
    {
        $value = $this->toFiniteNumber($reading);

        if ($value === null) {
            return 'no_data';
        }

        $low = $this->toFiniteNumber($configuration['low'] ?? null);
        $high = $this->toFiniteNumber($configuration['high'] ?? null);

        if ($low === null && $high === null) {
            return 'unconfigured';
        }

        if ($low !== null && $high !== null && $low >= $high) {
            return 'unconfigured';
        }

        if (($low !== null && $value < $low) || ($high !== null && $value > $high)) {
            return 'critical';
        }

        $range = $low !== null && $high !== null
            ? $high - $low
            : abs($low ?? $high ?? 0);
        $warningMargin = $range * self::WARNING_BAND_RATIO;

        if (
            $warningMargin > 0 &&
            (($low !== null && $value <= $low + $warningMargin) ||
                ($high !== null && $value >= $high - $warningMargin))
        ) {
            return 'warning';
        }

        return 'normal';
    }

    private function toFiniteNumber(mixed $value): ?float
    {
        if (!is_numeric($value)) {
            return null;
        }

        $number = (float) $value;

        return is_finite($number) ? $number : null;
    }
}
