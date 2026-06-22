<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {

            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('module');

            $table->string('action');

            $table->string('model_type')
                ->nullable();

            $table->unsignedBigInteger('model_id')
                ->nullable();

            $table->json('old_values')
                ->nullable();

            $table->json('new_values')
                ->nullable();

            $table->string('method')
                ->nullable();

            $table->text('url')
                ->nullable();

            $table->ipAddress('ip_address')
                ->nullable();

            $table->longText('user_agent')
                ->nullable();

            $table->text('description')
                ->nullable();

            $table->timestamps();

            $table->index('module');

            $table->index('action');

            $table->index('model_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};