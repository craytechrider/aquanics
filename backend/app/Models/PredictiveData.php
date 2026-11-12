<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PredictiveData extends Model
{
    protected $table = 'predictive_data';
    
    protected $fillable = ['user_id', 'day', 'growth', 'yield', 'ideal'];

    protected $casts = [
        'growth' => 'float',
        'yield' => 'float',
        'ideal' => 'float',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
