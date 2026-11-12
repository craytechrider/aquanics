<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sensor extends Model
{
    protected $fillable = ['user_id', 'key', 'name', 'value', 'unit', 'status', 'trend', 'history'];

    protected $casts = [
        'history' => 'array',
        'value' => 'float',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function readings() { return $this->hasMany(SensorReading::class); }
}
