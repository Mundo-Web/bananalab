<?php

use App\Models\Album;
use App\Models\ItemPreset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;



// API simulada para modo demo
Route::prefix('api')->group(function () {
    // Album demo
    Route::get('/albums/demo-album-123', function () {
        return response()->json([
            'id' => 'demo-album-123',
            'title' => 'Álbum Demo',
            'item_id' => 'demo-item-456',
            'item_preset_id' => 'demo-preset-789',
            'cover_image_path' => 'demo/album-cover.jpg',
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString()
        ]);
    });
    
    // Preset demo
    Route::get('/item-presets/demo-preset-789', function () {
        return response()->json([
            'id' => 'demo-preset-789',
            'name' => 'Preset Demo',
            'item_id' => 'demo-item-456',
            'cover_image' => 'demo/preset-cover.jpg',
            'content_layer_image' => 'demo/preset-content.jpg',
            'final_layer_image' => 'demo/preset-final.jpg',
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString()
        ]);
    });
});
