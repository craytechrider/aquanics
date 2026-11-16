<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AquanicsPasswordResetNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $query = http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
        $resetUrl = rtrim(config('services.frontend_url'), '/')
            . '/reset-password?'
            . $query;
        $expireMinutes = config('auth.passwords.users.expire');

        return (new MailMessage())
            ->subject('Reset Your Aquanics Password')
            ->view('emails.password-reset', compact('resetUrl', 'expireMinutes'))
            ->text('emails.password-reset-text', compact('resetUrl', 'expireMinutes'));
    }
}
