<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_attendances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('activity_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('anggota_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->boolean('is_present')
                ->default(false);

            $table->timestamp('checked_in_at')
                ->nullable();

            $table->text('kritik')
                ->nullable();

            $table->text('saran')
                ->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'activity_attendances'
        );
    }
};
