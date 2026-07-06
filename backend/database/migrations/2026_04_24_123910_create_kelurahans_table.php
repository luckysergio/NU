<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kelurahans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kecamatan_id')
                ->constrained('kecamatans')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('nama', 100);
            $table->string('kode', 20)->nullable()->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['kecamatan_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kelurahans');
    }
};
