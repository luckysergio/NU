<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->cascadeOnDelete();
            $table->foreignId('theme_id')
                ->nullable()
                ->constrained('program_themes')
                ->nullOnDelete();
            $table->foreignId('field_id')
                ->constrained('program_fields')
                ->restrictOnDelete();
            $table->foreignId('target_id')
                ->constrained('program_targets')
                ->restrictOnDelete();
            $table->foreignId('goal_id')
                ->constrained('program_goals')
                ->restrictOnDelete();
            $table->string('nama_program');
            $table->text('deskripsi')->nullable();
            $table->year('tahun');
            $table->enum('status', ['draft', 'aktif', 'selesai'])->default('draft');
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            // 💡 OPTIMASI FITUR UTAMA: Index vital untuk memuat Proker per Organisasi berdasarkan Status & Tahun
            $table->index(['organization_id', 'status', 'tahun'], 'wp_org_status_year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'work_programs'
        );
    }
};
