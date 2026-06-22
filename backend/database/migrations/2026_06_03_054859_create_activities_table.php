<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (
            Blueprint $table
        ) {
            $table->id();

            $table->foreignId('work_program_id')
                ->constrained('work_programs')
                ->cascadeOnDelete();

            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->cascadeOnDelete();

            $table->foreignId('penanggung_jawab_id')
                ->constrained('anggotas')
                ->restrictOnDelete();

            $table->string('nama_kegiatan');

            $table->date('tanggal_pelaksanaan');

            $table->enum('status', [
                'draft',
                'completed',
                'cancelled'
            ])->default('draft');

            $table->decimal(
                'total_pengeluaran',
                15,
                2
            )->default(0);

            $table->text('catatan')
                ->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'activities'
        );
    }
};
