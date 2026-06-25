<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_attendances', function (
            Blueprint $table
        ) {

            $table->id();

            $table->foreignId('activity_id')
                ->constrained('activities')
                ->cascadeOnDelete();

            $table->foreignId('anggota_id')
                ->constrained('anggotas')
                ->cascadeOnDelete();

            $table->foreignId('recorded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('catatan')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'activity_id',
                'anggota_id'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'activity_attendances'
        );
    }
};