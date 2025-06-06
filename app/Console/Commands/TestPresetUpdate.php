<?php

namespace App\Console\Commands;

use App\Models\Item;
use App\Models\ItemPreset;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TestPresetUpdate extends Command
{
    protected $signature = 'test:preset-update {item?} {preset?}';
    protected $description = 'Test preset update functionality';

    public function handle()
    {
        // Obtener item y preset específicos o los primeros disponibles
        $itemId = $this->argument('item');
        $presetId = $this->argument('preset');

        if (!$itemId || !$presetId) {
            // Buscar cualquier preset existente para hacer la prueba
            $preset = ItemPreset::with('item')->first();
            if (!$preset) {
                $this->error('No hay presets disponibles para probar');
                return;
            }
            $itemId = $preset->item_id;
            $presetId = $preset->id;
            $this->info("Usando item {$itemId} y preset {$presetId}");
        }

        // Verificar que existen
        $item = Item::find($itemId);
        $preset = ItemPreset::find($presetId);

        if (!$item) {
            $this->error("Item {$itemId} no encontrado");
            return;
        }

        if (!$preset) {
            $this->error("Preset {$presetId} no encontrado");
            return;
        }

        if ($preset->item_id !== $item->id) {
            $this->error("El preset no pertenece al item");
            return;
        }

        $this->info("Item: {$item->name}");
        $this->info("Preset: {$preset->name}");

        // Simular la petición de actualización
        $this->info("Simulando actualización...");

        // Crear datos de prueba
        $testData = [
            'id' => $presetId,
            'item_id' => $itemId,
            'name' => $preset->name . ' (Updated)',
            'description' => 'Test update description',
            'price' => '29.99',
            'discount' => '0',
            'sort_order' => '1',
            'is_active' => '1',
            'canvas_config' => json_encode([
                'width' => 1000,
                'height' => 1000,
                'dpi' => 300,
                'background_color' => '#ffffff',
                'format' => 'JPEG',
                'quality' => 90
            ]),
            'content_layer_config' => json_encode([
                'x' => 0,
                'y' => 0,
                'width' => 1000,
                'height' => 1000,
                'rotation' => 0,
                'opacity' => 1,
                'blend_mode' => 'normal',
                'fit_mode' => 'cover',
                'allow_upload' => true,
                'max_file_size' => 10,
                'allowed_formats' => ['jpg', 'jpeg', 'png', 'gif']
            ])
        ];

        try {
            // Actualizar directamente el modelo
            $preset->update($testData);
            $this->info("✅ Actualización exitosa!");
            $this->info("Nuevo nombre: {$preset->fresh()->name}");
        } catch (\Exception $e) {
            $this->error("❌ Error en la actualización: " . $e->getMessage());
            $this->error("Trace: " . $e->getTraceAsString());
        }
    }
}
