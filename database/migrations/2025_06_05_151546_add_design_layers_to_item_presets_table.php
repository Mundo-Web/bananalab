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
            // Imágenes del diseño
            $table->string('cover_image')->nullable()->after('image')->comment('Imagen de portada/template base');
            $table->string('content_layer_image')->nullable()->after('cover_image')->comment('Layer donde el usuario sube su contenido');
            $table->string('final_layer_image')->nullable()->after('content_layer_image')->comment('Layer final que va encima del contenido');
            
            // Configuración de las capas
            $table->json('cover_layer_config')->nullable()->after('final_layer_image')->comment('Configuración del layer de portada');
            $table->json('content_layer_config')->nullable()->after('cover_layer_config')->comment('Configuración del área de contenido');
            $table->json('final_layer_config')->nullable()->after('content_layer_config')->comment('Configuración del layer final');
            
            // Configuración general del canvas
            $table->json('canvas_config')->nullable()->after('final_layer_config')->comment('Configuración del canvas (dimensiones, DPI, etc.)');
            
            // Preview/thumbnail del preset completo
            $table->string('preview_image')->nullable()->after('canvas_config')->comment('Vista previa del preset completo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_presets', function (Blueprint $table) {
            $table->dropColumn([
                'cover_image',
                'content_layer_image', 
                'final_layer_image',
                'cover_layer_config',
                'content_layer_config',
                'final_layer_config',
                'canvas_config',
                'preview_image'
            ]);
        });
    }
};
