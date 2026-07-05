<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('email', 100)->nullable();
            $table->ipAddress('ip_address');
            $table->text('user_agent')->nullable();
            $table->boolean('is_success')->default(false);
            $table->timestamps();

            $table->index('user_id');
            $table->index('email');
            $table->index('ip_address');
            $table->index('is_success');
            $table->index(['user_id', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_logs');
    }
};