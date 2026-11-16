<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportsApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('reports');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('remember_token')->nullable();
            $table->timestamps();
        });

        Schema::create('reports', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('name');
            $table->string('date_label');
            $table->string('size')->default('0 MB');
            $table->string('type')->default('PDF');
            $table->string('file_path')->nullable();
            $table->timestamps();
        });
    }

    public function test_report_metadata_requires_a_real_period_and_is_scoped_to_the_owner(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/reports', [
            'name' => 'Sensor report',
            'type' => 'CSV',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('date_label');

        $created = $this->postJson('/api/reports', [
            'name' => 'Sensor report',
            'date_label' => 'Nov 6, 2026 - Nov 12, 2026',
            'type' => 'CSV',
        ])->assertCreated()
            ->assertJsonPath('date_label', 'Nov 6, 2026 - Nov 12, 2026')
            ->assertJsonPath('size', '0 MB');

        $otherUser->reports()->create([
            'name' => 'Private report',
            'date_label' => 'Nov 12, 2026',
        ]);

        $this->getJson('/api/reports')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $created->json('id'));
    }
}
