<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anggotas', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('organization_id')
                ->constrained()
                ->cascadeOnDelete();
            
            $table->foreignId('jabatan_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            
            $table->string('no_anggota', 50)->unique();
            $table->string('nama', 200);
            $table->string('no_hp', 20)->nullable();
            $table->text('alamat')->nullable();
            $table->string('foto')->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            $table->softDeletes();

            $table->index('organization_id');
            $table->index('jabatan_id');
            $table->index('no_anggota');
            $table->index('nama');
            $table->index('is_active');
            $table->index('created_at');
            
            $table->index(['organization_id', 'is_active']);
            $table->index(['organization_id', 'nama']);
            $table->index(['jabatan_id', 'is_active']);
            $table->index(['no_anggota', 'is_active']);
            $table->index(['nama', 'is_active']);
            $table->index(['organization_id', 'jabatan_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anggotas');
    }
};