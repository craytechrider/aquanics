<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class Alert extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'severity',
        'title',
        'message',
        'sensor',
        'value',
        'unit',
        'route',
        'is_read',
        'email_sent',
        'sms_sent',
        'push_sent',
        'resolved_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'email_sent' => 'boolean',
        'sms_sent' => 'boolean',
        'push_sent' => 'boolean',
        'value' => 'float',
        'resolved_at' => 'datetime',
    ];

    /**
     * Get the user associated with this alert.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
