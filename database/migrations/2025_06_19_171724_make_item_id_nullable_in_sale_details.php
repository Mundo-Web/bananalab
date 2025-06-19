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
            // Hacer item_id nullable para permitir productos personalizados
            $table->char('item_id', 36)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_details', function (Blueprint $table) {
            // Revertir a NOT NULL (solo si no hay registros con item_id NULL)
            $table->char('item_id', 36)->nullable(false)->change();
        });
    }
};
