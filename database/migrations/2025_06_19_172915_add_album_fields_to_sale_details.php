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
        Schema::table('sale_details', function (Blueprint $table) {
            // Campos específicos para álbumes personalizados
            $table->char('preset_id', 36)->nullable()->after('item_id');
            $table->char('album_id', 36)->nullable()->after('preset_id');
            $table->json('album_data')->nullable()->after('colors'); // Datos completos del álbum diseñado
            $table->json('preset_data')->nullable()->after('album_data'); // Datos del preset seleccionado
            $table->string('pdf_path')->nullable()->after('preset_data'); // Ruta del PDF generado
            $table->text('design_notes')->nullable()->after('pdf_path'); // Notas adicionales del diseño
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_details', function (Blueprint $table) {
            $table->dropColumn([
                'preset_id',
                'album_id', 
                'album_data',
                'preset_data',
                'pdf_path',
                'design_notes'
            ]);
        });
    }
};
