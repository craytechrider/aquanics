<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemDevice extends Model
{
    protected $fillable = ['user_id', 'name', 'key', 'is_on', 'mode', 'schedule', 'last_fed', 'next_feed'];

    protected $casts = [
        'is_on' => 'boolean',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
