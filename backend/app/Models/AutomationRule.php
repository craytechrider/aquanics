<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutomationRule extends Model
{
    protected $fillable = ['user_id', 'name', 'sensor', 'condition_operator', 'condition_value', 'condition_text', 'action', 'active'];

    protected $casts = [
        'active' => 'boolean',
        'condition_value' => 'float',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
