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
            $table->enum('jenis_kelamin', ['laki-laki', 'perempuan'])->nullable();
            $table->enum('status_perkawinan', ['menikah', 'belum menikah', 'cerai'])->nullable();
            $table->enum('pendidikan', ['sd', 'smp', 'sma/smk', 'd1', 'd2', 'd3', 's1', 's2', 's3'])->nullable();
            $table->text('deskripsi')->nullable();
            $table->text('alamat')->nullable();
            $table->string('foto')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['organization_id', 'is_active']);
            $table->index(['jabatan_id', 'is_active']);
            $table->index(['organization_id', 'jabatan_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anggotas');
    }
};
