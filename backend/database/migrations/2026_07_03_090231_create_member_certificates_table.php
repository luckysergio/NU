<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_certificates', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('biodata_id')
                ->constrained('biodatas')
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

            $table->index(['biodata_id', 'certificate_category_id'], 'cert_biodata_cat');
            $table->index('tanggal_expired');
            $table->index('biodata_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_certificates');
    }
};