<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kecamatans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kota_id')
                ->constrained('kotas')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('nama', 100);
            $table->string('kode', 20)->nullable()->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('kota_id');
            $table->index('nama');
            $table->index('is_active');
            $table->index(['kota_id', 'is_active']);
            $table->index(['nama', 'kota_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kecamatans');
    }
};