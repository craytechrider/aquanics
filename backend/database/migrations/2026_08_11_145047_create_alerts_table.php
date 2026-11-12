<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

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
            $table->boolean('push_sent')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
