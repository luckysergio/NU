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
                ->cascadeOnDelete();

            $table->string('nomor', 5);

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->unique([
                'kelurahan_id',
                'nomor'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rws');
    }
};