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
        Schema::table('sale_statuses', function (Blueprint $table) {
           $table->string('color')->nullable(); // Agregar esta línea
            $table->boolean('editable')->default(false);
            $table->boolean('reversible')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_statuses', function (Blueprint $table) {
            $table->dropColumn(['color', 'editable', 'reversible']);
        });
    }
};
