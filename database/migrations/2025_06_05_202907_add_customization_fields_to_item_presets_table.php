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
        Schema::table('item_presets', function (Blueprint $table) {
            // Opciones de páginas disponibles para este preset
            $table->json('pages_options')->nullable(); // ej: ["24 páginas", "50 páginas", "100 páginas"]
            $table->string('default_pages')->nullable(); // ej: "50 páginas"
            
            // Opciones de tapa disponibles para este preset
            $table->json('cover_options')->nullable(); // ej: ["Tapa Dura Personalizable", "Tapa Blanda"]
            $table->string('default_cover')->nullable(); // ej: "Tapa Dura Personalizable"
            
            // Opciones de acabado disponibles para este preset
            $table->json('finish_options')->nullable(); // ej: ["Limado", "Brillante", "Mate"]
            $table->string('default_finish')->nullable(); // ej: "Limado"
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_presets', function (Blueprint $table) {
            $table->dropColumn([
                'pages_options',
                'default_pages',
                'cover_options', 
                'default_cover',
                'finish_options',
                'default_finish'
            ]);
        });
    }
};
