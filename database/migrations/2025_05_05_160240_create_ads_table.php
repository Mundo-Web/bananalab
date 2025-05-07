<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ads', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('(UUID())'))->primary();
            $table->string('name')->nullable();
            $table->string('image')->nullable(); // o 'image_url' si usas enlaces externos
            $table->string('alt_text')->nullable();
            $table->text('target_url')->nullable();
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->boolean('visible')->default(true);
            $table->boolean('status')->default(true);
            $table->json('schedule')->nullable(); // Para días/horarios específicos (ej: solo jueves)
            $table->integer('priority')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ads');
    }
};
