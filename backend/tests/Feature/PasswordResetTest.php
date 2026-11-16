<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\AquanicsPasswordResetNotification;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['services.frontend_url' => 'https://app.example.test']);

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('remember_token')->nullable();
            $table->string('role')->default('Farmer');
            $table->timestamps();
        });
        Schema::create('password_reset_tokens', function (Blueprint $table): void {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
        Schema::create('activity_logs', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('activity');
            $table->string('type')->default('View');
            $table->string('status')->default('Success');
            $table->string('ip_address')->nullable();
            $table->text('details')->nullable();
            $table->timestamps();
        });
        Schema::create('personal_access_tokens', function (Blueprint $table): void {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function test_reset_request_does_not_disclose_whether_the_email_exists(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'farmer@example.test']);

        $registered = $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ]);
        $unregistered = $this->postJson('/api/forgot-password', [
            'email' => 'unknown@example.test',
        ]);

        $registered->assertOk()->assertExactJson($unregistered->json());
        $registered->assertJsonPath(
            'message',
            'If an account exists with this email address, a password reset link has been sent. Please check your inbox.',
        );
        Notification::assertSentTo(
            $user,
            AquanicsPasswordResetNotification::class,
            function (AquanicsPasswordResetNotification $notification) use ($user): bool {
                $mail = $notification->toMail($user);
                $this->assertSame('Reset Your Aquanics Password', $mail->subject);
                $this->assertSame('emails.password-reset', $mail->view['html']);
                $this->assertSame('emails.password-reset-text', $mail->view['text']);

                $query = [];
                parse_str(parse_url($mail->viewData['resetUrl'], PHP_URL_QUERY) ?? '', $query);
                $this->assertSame('https://app.example.test', parse_url($mail->viewData['resetUrl'], PHP_URL_SCHEME) . '://' . parse_url($mail->viewData['resetUrl'], PHP_URL_HOST));
                $this->assertNotEmpty($query['token'] ?? null);
                $this->assertSame($user->email, $query['email'] ?? null);
                $this->assertStringContainsString(
                    'Reset Your Aquanics Password',
                    view($mail->view['html'], $mail->viewData)->render(),
                );

                return true;
            },
        );
    }

    public function test_reset_request_throttle_does_not_disclose_account_existence(): void
    {
        $user = User::factory()->create(['email' => 'throttled@example.test']);
        Password::createToken($user);

        $throttled = $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ]);
        $unregistered = $this->postJson('/api/forgot-password', [
            'email' => 'unknown-throttled@example.test',
        ]);

        $throttled->assertOk()->assertExactJson($unregistered->json());
    }

    public function test_valid_reset_changes_the_password_and_allows_login(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@example.test',
            'password' => 'old-password',
            'role' => 'Admin',
        ]);
        $token = Password::createToken($user);

        $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-secure-password', $user->fresh()->password));
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'new-secure-password',
        ])->assertOk();
        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'old-password',
        ])->assertUnprocessable();

        $farmer = User::factory()->create([
            'email' => 'farmer@example.test',
            'role' => 'Farmer',
        ]);
        $farmerToken = Password::createToken($farmer);
        $this->postJson('/api/reset-password', [
            'email' => $farmer->email,
            'token' => $farmerToken,
            'password' => 'farmer-secure-password',
            'password_confirmation' => 'farmer-secure-password',
        ])->assertOk();
        $this->assertSame('Farmer', $farmer->fresh()->role);
        $this->assertTrue(
            Hash::check('farmer-secure-password', $farmer->fresh()->password),
        );
    }

    public function test_invalid_expired_and_mismatched_reset_requests_are_rejected(): void
    {
        $user = User::factory()->create(['email' => 'user@example.test']);

        $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => 'invalid-token',
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'This password reset link is invalid or has expired.');

        $token = Password::createToken($user);
        $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'new-secure-password',
            'password_confirmation' => 'mismatched-password',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');

        DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->update(['created_at' => now()->subMinutes(61)]);

        $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'This password reset link is invalid or has expired.');
    }
}
