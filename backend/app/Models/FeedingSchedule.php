<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedingSchedule extends Model
{
    protected $fillable = ['user_id', 'name', 'time', 'frequency', 'species', 'fish_age_weeks', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
