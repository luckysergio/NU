<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_categories', function (Blueprint $table) {
            $table->id();

            $table->string('nama');
            $table->string('slug')->unique();
            $table->text('deskripsi')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('is_active');
            $table->index('nama');
            $table->index(['is_active', 'nama']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_categories');
    }
};