<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('alerts', 'active_key')) {
            Schema::table('alerts', function (Blueprint $table): void {
                $table->string('active_key')->nullable()->unique();
            });
        }

        if (!Schema::hasTable('alert_recipients')) {
            Schema::create('alert_recipients', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('alert_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->boolean('is_read')->default(false);
                $table->boolean('email_sent')->default(false);
                $table->boolean('sms_sent')->default(false);
                $table->boolean('push_sent')->default(false);
                $table->timestamps();
                $table->unique(['alert_id', 'user_id']);
                $table->index(['user_id', 'is_read']);
            });
        }

        DB::table('alerts')
            ->whereNotNull('user_id')
            ->orderBy('id')
            ->chunkById(500, function ($alerts): void {
                $now = now();
                $recipients = $alerts->map(fn ($alert): array => [
                    'alert_id' => $alert->id,
                    'user_id' => $alert->user_id,
                    'is_read' => $alert->is_read,
                    'email_sent' => $alert->email_sent,
                    'sms_sent' => $alert->sms_sent,
                    'push_sent' => $alert->push_sent,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])->all();

                DB::table('alert_recipients')->insertOrIgnore($recipients);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_recipients');

        if (Schema::hasColumn('alerts', 'active_key')) {
            Schema::table('alerts', function (Blueprint $table): void {
                $table->dropUnique(['active_key']);
                $table->dropColumn('active_key');
            });
        }
    }
};
