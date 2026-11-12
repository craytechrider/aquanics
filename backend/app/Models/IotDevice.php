<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IotDevice extends Model
{
    protected $fillable = ['user_id', 'name', 'device_id', 'status', 'last_active'];

    protected $casts = [
        'last_active' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
