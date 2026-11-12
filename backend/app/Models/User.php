<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'google_id',
        'role',
        'phone',
        'avatar',
        'email_alerts',
        'sms_alerts',
        'weekly_reports',
        'can_manage_users'
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
    ];


    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'email_alerts' => 'boolean',
            'sms_alerts' => 'boolean',
            'weekly_reports' => 'boolean',
            'can_manage_users' => 'boolean',
            'is_active' => 'boolean',
        ];
    }


    public function sensors()
    {
        return $this->hasMany(Sensor::class);
    }
    public function systemDevices()
    {
        return $this->hasMany(SystemDevice::class);
    }
    public function alerts()
    {
        return $this->hasMany(Alert::class);
    }
    public function automationRules()
    {
        return $this->hasMany(AutomationRule::class);
    }
    public function feedingSchedules()
    {
        return $this->hasMany(FeedingSchedule::class);
    }
    public function reports()
    {
        return $this->hasMany(Report::class);
    }
    public function iotDevices()
    {
        return $this->hasMany(IotDevice::class);
    }
    public function predictiveData()
    {
        return $this->hasMany(PredictiveData::class);
    }
    public function pushTokens()
    {
        return $this->hasMany(UserPushToken::class);
    }
}
