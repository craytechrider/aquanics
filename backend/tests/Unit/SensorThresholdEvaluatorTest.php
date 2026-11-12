<?php

namespace Tests\Unit;

use App\Services\SensorThresholdEvaluator;
use PHPUnit\Framework\TestCase;

class SensorThresholdEvaluatorTest extends TestCase
{
    private SensorThresholdEvaluator $evaluator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->evaluator = new SensorThresholdEvaluator();
    }

    public function test_reading_inside_the_safe_range_is_normal(): void
    {
        $this->assertSame(
            'normal',
            $this->evaluator->classify(7, ['low' => 6, 'high' => 8])
        );
    }

    public function test_reading_near_a_configured_limit_is_warning(): void
    {
        $this->assertSame(
            'warning',
            $this->evaluator->classify(6.1, ['low' => 6, 'high' => 8])
        );
        $this->assertSame(
            'warning',
            $this->evaluator->classify(7.9, ['low' => 6, 'high' => 8])
        );
    }

    public function test_reading_outside_either_configured_limit_is_critical(): void
    {
        $this->assertSame(
            'critical',
            $this->evaluator->classify(5.99, ['low' => 6, 'high' => 8])
        );
        $this->assertSame(
            'critical',
            $this->evaluator->classify(8.01, ['low' => 6, 'high' => 8])
        );
    }

    public function test_one_sided_limits_support_low_or_high_danger(): void
    {
        $this->assertSame(
            'critical',
            $this->evaluator->classify(3, ['low' => 5])
        );
        $this->assertSame(
            'critical',
            $this->evaluator->classify(11, ['high' => 10])
        );
        $this->assertSame(
            'normal',
            $this->evaluator->classify(7, ['low' => 5])
        );
    }

    public function test_missing_invalid_or_unconfigured_values_are_not_normal(): void
    {
        $configuration = ['low' => 6, 'high' => 8];

        $this->assertSame('no_data', $this->evaluator->classify(null, $configuration));
        $this->assertSame('no_data', $this->evaluator->classify(NAN, $configuration));
        $this->assertSame('unconfigured', $this->evaluator->classify(7, []));
        $this->assertSame(
            'unconfigured',
            $this->evaluator->classify(7, ['low' => 8, 'high' => 6])
        );
    }
}
