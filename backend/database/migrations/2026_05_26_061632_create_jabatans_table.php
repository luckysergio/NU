<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jabatans', function (Blueprint $table) {
    $table->id();
    $table->string('nama', 100);
    $table->string('slug', 100)->unique();
    $table->text('deskripsi')->nullable();
    $table->string('level', 50)->nullable();
    $table->json('levels')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();

    $table->index(['level', 'is_active']);
});
    }

    public function down(): void
    {
        Schema::dropIfExists('jabatans');
    }
};