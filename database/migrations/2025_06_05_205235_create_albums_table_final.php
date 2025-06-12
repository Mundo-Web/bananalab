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
        //Eliminar la tabla si existe
        Schema::dropIfExists('albums');

        if (!Schema::hasTable('albums')) {
            Schema::create('albums', function (Blueprint $table) {
                $table->id();
                $table->char('uuid', 36)->unique();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
               $table->uuid('item_id');

                $table->uuid('item_preset_id');
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('cover_image_path')->nullable();
                $table->integer('selected_pages');
                $table->string('selected_cover_type');
                $table->string('selected_finish');
                $table->json('custom_options')->nullable(); // Para opciones adicionales futuras
                $table->enum('status', ['draft', 'saved', 'ordered'])->default('draft');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('albums');
    }
};
