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
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('organization_type_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('organizations')
                ->nullOnDelete();

            $table->foreignId('kota_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('kecamatan_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('kelurahan_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('rw_id')
                ->nullable()
                ->constrained('rws')
                ->nullOnDelete();

            $table->string('nama');

            $table->string('slug')
                ->unique();

            $table->text('alamat')
                ->nullable();

            $table->string('telepon')
                ->nullable();

            $table->string('email')
                ->nullable();

            $table->string('logo')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
