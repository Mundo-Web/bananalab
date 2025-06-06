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
            // Drop foreign key constraints first
            $table->dropForeign(['item_id']);
            $table->dropForeign(['item_preset_id']);
            
            // Change column types from bigint to char(36) to support UUIDs
            $table->char('item_id', 36)->change();
            $table->char('item_preset_id', 36)->change();
            
            // Note: We're not re-adding foreign key constraints because 
            // UUIDs don't work well with traditional foreign keys in Laravel
            // The application will handle referential integrity
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            // Change back to bigint and restore foreign keys
            $table->unsignedBigInteger('item_id')->change();
            $table->unsignedBigInteger('item_preset_id')->change();
            
            $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
            $table->foreign('item_preset_id')->references('id')->on('item_presets')->onDelete('cascade');
        });
    }
};
