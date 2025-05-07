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
        Schema::create('campaigns', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('(UUID())'))->primary();
            $table->string('slug')->unique();
            $table->string('name');
            $table->longText('description')->nullable();
            $table->string('image')->nullable();
            $table->string('banner')->nullable();
            $table->boolean('featured')->default(false);
            $table->boolean('visible')->default(true);
            $table->boolean('status')->default(true)->nullable();
            $table->timestamps();
        });

        Schema::create('campaign_item', function (Blueprint $table) {
            $table->uuid('campaign_id');
            $table->uuid('item_id');
            $table->primary(['campaign_id', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaigns');
        Schema::dropIfExists('campaign_item');
    }
};
