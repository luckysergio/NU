<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biodatas', function (Blueprint $table) {
            $table->id();
            $table->string('no_anggota', 50)->unique();
            $table->string('nama', 200);
            $table->string('tempat_lahir', 100)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->enum('jenis_kelamin', ['laki-laki', 'perempuan'])->nullable();
            $table->enum('status_perkawinan', ['menikah', 'belum menikah', 'cerai'])->nullable();
            $table->enum('pendidikan', ['sd', 'smp', 'sma/smk', 'd1', 'd2', 'd3', 's1', 's2', 's3'])->nullable();
            $table->string('no_hp', 20)->nullable();
            $table->text('alamat')->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('foto')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active']);
            $table->index(['nama', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biodatas');
    }
};