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
                
  // 👇 Forzar CHAR(36) exactamente igual al campo en items
    $table->char('item_id', 36);
    $table->char('item_preset_id', 36);

                $table->string('title');
                $table->text('description')->nullable();
                $table->string('cover_image_path')->nullable();
                $table->integer('selected_pages');
                $table->string('selected_cover_type');
                $table->string('selected_finish');
                $table->json('custom_options')->nullable(); // Para opciones adicionales futuras
                $table->enum('status', ['draft', 'saved', 'ordered'])->default('draft');
                $table->timestamps();

                // ✅ Foreign keys explícitas (esto es lo que faltaba)
                $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
                $table->foreign('item_preset_id')->references('id')->on('item_presets')->onDelete('cascade');
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
