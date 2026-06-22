<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create(
            'document_specifications',
            function (Blueprint $table) {

                $table->id();

                $table->string('nama');

                $table->string('slug')->unique();

                $table->text('deskripsi')
                    ->nullable();

                $table->unsignedTinyInteger(
                    'urutan'
                );

                $table->boolean('is_active')
                    ->default(true);

                $table->timestamps();

                $table->softDeletes();
            }
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(
            'document_specifications'
        );
    }
};