<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anggotas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('biodata_id')
                ->constrained('biodatas')
                ->cascadeOnDelete();
            $table->foreignId('organization_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('jabatan_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['biodata_id', 'organization_id']);
            
            $table->index(['organization_id']);
            $table->index(['jabatan_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anggotas');
    }
};