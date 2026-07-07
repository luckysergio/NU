<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_documents', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('activity_id')
                ->constrained('activities')
                ->cascadeOnDelete()
                ->comment('ID kegiatan yang memiliki dokumen');
            
            $table->string('file_name', 255)
                ->comment('Nama file asli dari user');
            
            $table->string('file_path', 500)
                ->comment('Path penyimpanan file di storage');
            
            $table->string('file_type', 50)
                ->comment('Tipe file (pdf, doc, docx, xls, xlsx, ppt, pptx, jpg, png)');
            
            $table->unsignedBigInteger('file_size')
                ->default(0)
                ->comment('Ukuran file dalam bytes');
            
            $table->string('description', 500)
                ->nullable()
                ->comment('Deskripsi dokumen (opsional)');
            
            $table->string('category', 50)
                ->nullable()
                ->comment('Kategori dokumen: proposal, laporan, surat, foto, dll');
            
            $table->foreignId('uploaded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('User yang upload dokumen');
            
            $table->timestamp('uploaded_at')
                ->useCurrent()
                ->comment('Waktu upload dokumen');
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['activity_id', 'category'], 'idx_activity_category');
            $table->index(['activity_id', 'file_type'], 'idx_activity_file_type');
            $table->index('uploaded_by', 'idx_uploaded_by');
            $table->index('created_at', 'idx_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_documents');
    }
};