<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rws', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelurahan_id')
                ->constrained('kelurahans')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('nomor', 10);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['kelurahan_id', 'nomor']);

            $table->index('kelurahan_id');
            $table->index('nomor');
            $table->index('is_active');
            $table->index(['kelurahan_id', 'is_active']);
            $table->index(['nomor', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rws');
    }
};