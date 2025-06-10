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
        Schema::table('albums', function (Blueprint $table) {
            $table->longText('design_data')->nullable()->after('album_pages_data');
            $table->string('pdf_path')->nullable()->after('design_data');
            $table->timestamp('design_finalized_at')->nullable()->after('pdf_path');
            // Modificar status para incluir los nuevos estados
            $table->dropColumn('status');
        });
        
        Schema::table('albums', function (Blueprint $table) {
            $table->enum('status', ['draft', 'saved', 'ordered', 'finalized', 'printed', 'delivered'])->default('draft')->after('design_finalized_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn(['design_data', 'pdf_path', 'design_finalized_at', 'status']);
        });
        
        Schema::table('albums', function (Blueprint $table) {
            $table->enum('status', ['draft', 'saved', 'ordered'])->default('draft');
        });
    }
};
