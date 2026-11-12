<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'group',
        'key',
        'value',
    ];

    /**
     * Get all settings grouped by their group name.
     */
    public static function allGrouped(): array
    {
        $settings = static::all();
        $grouped = [];

        foreach ($settings as $setting) {
            $grouped[$setting->group][$setting->key] = $setting->value;
        }

        return $grouped;
    }

    /**
     * Set a setting value (upsert).
     */
    public static function set(string $group, string $key, ?string $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['group' => $group, 'value' => $value]
        );
    }
}
