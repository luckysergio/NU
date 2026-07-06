<?php
// database/migrations/0001_01_01_000009_create_users_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
       Schema::create('users', function (Blueprint $table) {
    $table->id();

    $table->foreignId('role_id')
        ->constrained('roles')
        ->cascadeOnDelete();

    $table->foreignId('organization_id')
        ->nullable()
        ->constrained('organizations')
        ->nullOnDelete();

    $table->string('name', 200);
    $table->string('email', 100)->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->string('phone', 20)->nullable();
    $table->string('foto')->nullable();

    $table->boolean('is_active')->default(true);
    $table->boolean('is_blocked')->default(false);
    $table->boolean('can_login')->default(true);
    $table->timestamp('blocked_at')->nullable();
    $table->timestamp('last_login_at')->nullable();
    $table->ipAddress('last_login_ip')->nullable();

    $table->rememberToken();
    $table->softDeletes();
    $table->timestamps();

    // Strategi index autentikasi & otorisasi scope organisasi
    $table->index(['organization_id', 'role_id', 'is_active'], 'user_org_role_status');
    $table->index(['is_active', 'is_blocked']);
});
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};