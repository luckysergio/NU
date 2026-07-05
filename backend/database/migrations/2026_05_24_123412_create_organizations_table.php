<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organization_level_id')
                ->constrained('organization_levels')
                ->cascadeOnDelete();

            $table->foreignId('organization_type_id')
                ->nullable()
                ->constrained('organization_types')
                ->nullOnDelete();

            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('organizations')
                ->nullOnDelete();

            $table->foreignId('kota_id')
                ->nullable()
                ->constrained('kotas')
                ->nullOnDelete();

            $table->foreignId('kecamatan_id')
                ->nullable()
                ->constrained('kecamatans')
                ->nullOnDelete();

            $table->foreignId('kelurahan_id')
                ->nullable()
                ->constrained('kelurahans')
                ->nullOnDelete();

            $table->foreignId('rw_id')
                ->nullable()
                ->constrained('rws')
                ->nullOnDelete();

            $table->string('nama', 200);
            $table->string('slug', 200)->unique();
            $table->text('alamat')->nullable();
            $table->string('telepon', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('logo')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index('organization_level_id');
            $table->index('organization_type_id');
            $table->index('parent_id');
            $table->index('kota_id');
            $table->index('kecamatan_id');
            $table->index('kelurahan_id');
            $table->index('rw_id');
            $table->index('is_active');
            $table->index('slug');
            $table->index('nama');
            $table->index(['parent_id', 'organization_level_id']);
            $table->index(['organization_level_id', 'is_active']);
            $table->index(['kota_id', 'is_active']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};