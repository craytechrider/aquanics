<?php

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\AlertRecipient;
use App\Models\User;
use App\Services\AquanicsAlertService;
use App\Services\FirebaseService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class AlertDistributionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('alert_recipients');
        Schema::dropIfExists('user_push_tokens');
        Schema::dropIfExists('alerts');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('farmer');
            $table->boolean('email_alerts')->default(false);
            $table->boolean('sms_alerts')->default(false);
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('remember_token')->nullable();
            $table->timestamps();
        });

        Schema::create('alerts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable();
            $table->string('type')->default('sensor');
            $table->string('severity')->default('warning');
            $table->string('title');
            $table->text('message');
            $table->string('sensor')->nullable();
            $table->decimal('value', 10, 3)->nullable();
            $table->string('unit')->nullable();
            $table->string('route')->nullable();
            $table->boolean('is_read')->default(false);
            $table->boolean('email_sent')->default(false);
            $table->boolean('sms_sent')->default(false);
            $table->boolean('push_sent')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->string('active_key')->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('alert_recipients', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('alert_id');
            $table->foreignId('user_id');
            $table->boolean('is_read')->default(false);
            $table->boolean('email_sent')->default(false);
            $table->boolean('sms_sent')->default(false);
            $table->boolean('push_sent')->default(false);
            $table->timestamps();
            $table->unique(['alert_id', 'user_id']);
        });

        Schema::create('user_push_tokens', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('token');
            $table->string('device_name')->nullable();
            $table->timestamps();
        });
    }

    public function test_alert_recipient_migration_backfills_existing_user_alerts(): void
    {
        Schema::dropIfExists('alert_recipients');
        Schema::dropIfExists('alerts');
        Schema::create('alerts', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('type')->default('sensor');
            $table->string('severity')->default('warning');
            $table->string('title');
            $table->text('message');
            $table->string('sensor')->nullable();
            $table->decimal('value', 10, 3)->nullable();
            $table->string('unit')->nullable();
            $table->string('route')->nullable();
            $table->boolean('is_read')->default(false);
            $table->boolean('email_sent')->default(false);
            $table->boolean('sms_sent')->default(false);
            $table->boolean('push_sent')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        $user = $this->createUser('legacy@example.test', 'Farmer');
        $alertId = DB::table('alerts')->insertGetId([
            'user_id' => $user->id,
            'type' => 'sensor',
            'severity' => 'critical',
            'title' => 'Existing alert',
            'message' => 'Preserved alert history',
            'is_read' => true,
            'email_sent' => true,
            'sms_sent' => false,
            'push_sent' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require database_path(
            'migrations/2026_11_13_000000_add_alert_recipients_and_active_keys.php'
        );
        $migration->up();

        $this->assertTrue(Schema::hasColumn('alerts', 'active_key'));
        $this->assertDatabaseHas('alert_recipients', [
            'alert_id' => $alertId,
            'user_id' => $user->id,
            'is_read' => true,
            'email_sent' => true,
            'push_sent' => true,
        ]);
    }

    public function test_critical_events_are_shared_with_active_users_with_independent_read_state(): void
    {
        $admin = $this->createUser('admin@example.test', 'Admin');
        $farmer = $this->createUser('farmer@example.test', 'Farmer');
        $inactive = $this->createUser('inactive@example.test', 'Farmer', false);
        $this->mockSensorReadings([['ph' => 9, 'lastUpdated' => now()->toIso8601String()]]);

        $service = app(AquanicsAlertService::class);
        $created = $service->check();

        $this->assertCount(1, $created);
        $this->assertDatabaseCount('alerts', 1);
        $this->assertDatabaseCount('alert_recipients', 2);

        $alert = $created[0];
        Sanctum::actingAs($admin);
        $this->getJson('/api/alerts')
            ->assertOk()
            ->assertJsonPath('alerts.0.id', $alert->id)
            ->assertJsonPath('alerts.0.is_read', false);

        $this->patchJson("/api/alerts/{$alert->id}/read")
            ->assertOk()
            ->assertJsonPath('alert.is_read', true);

        $this->getJson('/api/admin/alerts')
            ->assertOk()
            ->assertJsonPath('0.recipientCount', 2)
            ->assertJsonPath('0.unreadRecipients', 1)
            ->assertJsonPath('0.read', false);

        $lateUser = $this->createUser('late@example.test', 'Farmer');
        Sanctum::actingAs($lateUser);
        $this->patchJson("/api/alerts/{$alert->id}/read")
            ->assertNotFound();

        Sanctum::actingAs($farmer);
        $this->getJson('/api/alerts')
            ->assertOk()
            ->assertJsonPath('alerts.0.is_read', false);

        Sanctum::actingAs($inactive);
        $this->getJson('/api/alerts')->assertOk()->assertJsonCount(0, 'alerts');
    }

    public function test_active_alerts_are_deduplicated_and_resolved_history_stays_unread(): void
    {
        $user = $this->createUser('farmer@example.test', 'Farmer');
        $critical = ['ph' => 9, 'lastUpdated' => now()->toIso8601String()];
        $normal = ['ph' => 7, 'lastUpdated' => now()->toIso8601String()];
        $this->mockSensorReadings([$critical, $critical, $normal, $critical]);

        $service = app(AquanicsAlertService::class);
        $first = $service->check();
        $duplicate = $service->check();

        $this->assertCount(1, $first);
        $this->assertSame([], $duplicate);
        $service->check();

        $firstAlert = Alert::query()->firstOrFail();
        $this->assertNotNull($firstAlert->fresh()->resolved_at);
        $this->assertFalse(
            AlertRecipient::query()
                ->where('alert_id', $firstAlert->id)
                ->where('user_id', $user->id)
                ->value('is_read')
        );

        $second = $service->check();
        $this->assertCount(1, $second);
        $this->assertDatabaseCount('alerts', 2);
    }

    public function test_offline_device_creates_one_alert_and_recovery_resolves_it(): void
    {
        $this->createUser('admin@example.test', 'Admin');
        $this->mockSensorReadings([
            ['lastUpdated' => now()->subMinutes(6)->toIso8601String()],
            ['lastUpdated' => now()->toIso8601String()],
        ]);

        $service = app(AquanicsAlertService::class);
        $offlineAlert = $service->check();

        $this->assertCount(1, $offlineAlert);
        $this->assertSame('device', $offlineAlert[0]->type);

        $service->check();
        $this->assertNotNull($offlineAlert[0]->fresh()->resolved_at);
        $this->assertDatabaseCount('alerts', 1);
    }

    private function createUser(string $email, string $role, bool $active = true): User
    {
        $user = User::create([
            'name' => ucfirst($role),
            'email' => $email,
            'password' => 'password',
            'role' => $role,
            'email_alerts' => false,
            'sms_alerts' => false,
        ]);
        $user->forceFill(['is_active' => $active])->save();

        return $user;
    }

    private function mockSensorReadings(array $readings): void
    {
        $firebase = Mockery::mock(FirebaseService::class);
        $firebase->shouldReceive('getCurrent')
            ->times(count($readings))
            ->andReturn(...$readings);
        $firebase->shouldReceive('getConfiguration')
            ->times(count($readings))
            ->andReturn(['ph' => ['low' => 6, 'high' => 8, 'unit' => 'pH']]);

        $this->app->instance(FirebaseService::class, $firebase);
    }
}
