<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('member_certificates', function (Blueprint $table) {

            $table->id();

            $table->foreignId('anggota_id')
                ->constrained('anggotas')
                ->cascadeOnDelete();

            $table->foreignId('certificate_category_id')
                ->constrained('certificate_categories')
                ->restrictOnDelete();

            $table->string('nama');

            $table->string('nomor_sertifikat')->nullable();

            $table->date('tanggal_terbit')->nullable();

            $table->date('tanggal_expired')->nullable();

            $table->string('file');

            $table->unsignedBigInteger('size')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_certificates');
    }
};
