<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anggotas', function (
            Blueprint $table
        ) {

            $table->id();

            $table->foreignId('organization_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('jabatan_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('no_anggota', 50)
                ->unique();

            $table->string('nama');

            $table->string('no_hp', 20)
                ->nullable();

            $table->text('alamat')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anggotas');
    }
};
