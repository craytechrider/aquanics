<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.frontend_url' => 'http://localhost:5173',
            'services.google.client_id' => null,
            'services.google.client_secret' => null,
            'services.google.redirect' => null,
        ]);
    }

    public function test_google_redirect_reports_missing_credentials_safely(): void
    {
        $this->get('/auth/google/redirect')
            ->assertRedirect('http://localhost:5173/login?oauth_error=google_config');
    }

    public function test_google_redirect_starts_the_socialite_provider_flow(): void
    {
        config([
            'services.google.client_id' => 'test-client-id',
            'services.google.client_secret' => 'test-client-secret',
            'services.google.redirect' => 'http://localhost:8000/auth/google/callback',
        ]);

        $provider = new class implements Provider
        {
            public function scopes($scopes): self
            {
                return $this;
            }

            public function redirect()
            {
                return redirect()->away('https://accounts.google.com/o/oauth2/auth');
            }

            public function user()
            {
                return null;
            }
        };
        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $this->get('/auth/google/redirect')
            ->assertRedirect('https://accounts.google.com/o/oauth2/auth');
    }

    public function test_google_oauth_cancellation_returns_a_friendly_code(): void
    {
        $this->get('/auth/google/callback?error=access_denied')
            ->assertRedirect('http://localhost:5173/login?oauth_error=google_cancelled');
    }

    public function test_google_exchange_rejects_an_invalid_or_reused_code(): void
    {
        $this->postJson('/api/auth/google/exchange', [
            'code' => str_repeat('x', 64),
        ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This Google sign-in link has expired or was already used. Please try again.');
    }

    public function test_cors_allows_the_configured_frontend_origin(): void
    {
        config(['cors.allowed_origins' => ['https://app.example']]);

        $this->withHeader('Origin', 'https://app.example')
            ->call('OPTIONS', '/api/auth/google/exchange', server: [
                'HTTP_ORIGIN' => 'https://app.example',
                'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            ])
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'https://app.example');
    }

    public function test_google_callback_rejects_an_invalid_oauth_state(): void
    {
        config([
            'services.google.client_id' => 'test-client-id',
            'services.google.client_secret' => 'test-client-secret',
            'services.google.redirect' => 'http://localhost:8000/auth/google/callback',
        ]);

        $provider = \Mockery::mock(Provider::class);
        $provider->shouldReceive('user')
            ->once()
            ->andThrow(new InvalidStateException);
        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $this->get('/auth/google/callback')
            ->assertRedirect('http://localhost:5173/login?oauth_error=google_failed');
    }

    public function test_google_callback_rejects_an_unverified_email(): void
    {
        $this->mockGoogleUser([
            'id' => 'google-unverified',
            'email' => 'person@example.com',
            'verified_email' => false,
        ]);

        $this->get('/auth/google/callback')
            ->assertRedirect('http://localhost:5173/login?oauth_error=google_unverified');
    }

    public function test_google_callback_links_verified_existing_account_without_changing_role(): void
    {
        $this->createUsersTable();
        $account = User::create([
            'name' => 'Existing Administrator',
            'email' => 'person@example.com',
            'password' => 'existing-password',
            'role' => 'Admin',
            'can_manage_users' => true,
            'is_active' => true,
        ]);
        $passwordHash = $account->password;

        $this->mockGoogleUser([
            'id' => 'google-verified',
            'email' => 'PERSON@example.com',
            'name' => 'Google Profile Name',
            'avatar' => 'https://example.com/avatar.png',
            'verified_email' => true,
        ]);

        $response = $this->get('/auth/google/callback');
        $response->assertRedirect();
        $location = (string) $response->headers->get('Location');
        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);
        $this->assertSame('/login', parse_url($location, PHP_URL_PATH));
        $this->assertSame(['oauth_code'], array_keys($query));
        $this->assertSame(64, strlen($query['oauth_code']));

        $account->refresh();
        $this->assertSame('google-verified', $account->google_id);
        $this->assertSame('Admin', $account->role);
        $this->assertTrue($account->can_manage_users);
        $this->assertSame($passwordHash, $account->password);
    }

    public function test_google_sign_in_rejects_an_email_without_an_existing_account(): void
    {
        $this->createUsersTable();
        $this->mockGoogleUser([
            'id' => 'google-new-user',
            'email' => 'new-user@example.com',
            'name' => 'New Google User',
            'verified_email' => true,
        ]);

        $this->get('/auth/google/callback')
            ->assertRedirect('http://localhost:5173/login?oauth_error=google_account_not_found');

        $this->assertDatabaseMissing('users', ['email' => 'new-user@example.com']);
    }

    public function test_google_exchange_issues_a_single_use_sanctum_token(): void
    {
        $this->createAuthTables();
        User::create([
            'name' => 'Linked User',
            'email' => 'linked@example.com',
            'password' => 'existing-password',
            'role' => 'Farmer',
        ]);
        $this->mockGoogleUser([
            'id' => 'google-linked-user',
            'email' => 'linked@example.com',
            'verified_email' => true,
        ]);

        $callback = $this->get('/auth/google/callback');
        $location = (string) $callback->headers->get('Location');
        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

        $exchange = $this->postJson('/api/auth/google/exchange', [
            'code' => $query['oauth_code'],
        ])->assertOk();

        $this->assertNotEmpty($exchange->json('token'));
        $this->assertSame('linked@example.com', $exchange->json('user.email'));
        $this->assertArrayNotHasKey('google_id', $exchange->json('user'));
        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->postJson('/api/auth/google/exchange', [
            'code' => $query['oauth_code'],
        ])->assertUnprocessable();
    }

    public function test_google_callback_rejects_disabled_accounts(): void
    {
        $this->createUsersTable();
        $account = User::create([
            'name' => 'Disabled User',
            'email' => 'person@example.com',
            'password' => 'existing-password',
            'role' => 'Farmer',
            'can_manage_users' => false,
        ]);
        $account->forceFill(['is_active' => false])->save();
        $this->mockGoogleUser([
            'id' => 'google-disabled',
            'email' => 'person@example.com',
            'verified_email' => true,
        ]);

        $this->get('/auth/google/callback')
            ->assertRedirect('http://localhost:5173/login?oauth_error=google_account_disabled');
    }

    public function test_email_password_login_and_logout_still_use_sanctum_tokens(): void
    {
        $this->createAuthTables();
        User::create([
            'name' => 'Password User',
            'email' => 'password@example.com',
            'password' => 'correct-password',
            'role' => 'Farmer',
        ]);

        $this->getJson('/api/user')->assertUnauthorized();

        $login = $this->postJson('/api/login', [
            'email' => 'password@example.com',
            'password' => 'correct-password',
        ])->assertOk();
        $token = $login->json('token');
        $this->assertNotEmpty($token);

        $this->withToken($token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', 'password@example.com');

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    private function mockGoogleUser(array $attributes): void
    {
        config([
            'services.google.client_id' => 'test-client-id',
            'services.google.client_secret' => 'test-client-secret',
            'services.google.redirect' => 'http://localhost:8000/auth/google/callback',
        ]);

        $googleUser = \Laravel\Socialite\Two\User::fake($attributes);
        $provider = \Mockery::mock(Provider::class);
        $provider->shouldReceive('user')->once()->andReturn($googleUser);
        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);
    }

    private function createUsersTable(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('google_id')->nullable()->unique();
            $table->longText('avatar')->nullable();
            $table->string('role')->default('Farmer');
            $table->boolean('can_manage_users')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    private function createAuthTables(): void
    {
        $this->createUsersTable();

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable();
            $table->string('activity');
            $table->string('type')->default('View');
            $table->string('status')->default('Success');
            $table->string('ip_address')->nullable();
            $table->text('details')->nullable();
            $table->timestamps();
        });
    }
}
