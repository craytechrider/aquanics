<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('activity');
            $table->string('type')->default('View'); // Login, View, Modified, Security, Export, User Creation
            $table->string('status')->default('Success'); // Success, Denied, Failed
            $table->string('ip_address')->nullable();
            $table->text('details')->nullable();
            $table->timestamps();

            $table->index(['created_at']);
            $table->index(['type']);
            $table->index(['user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
