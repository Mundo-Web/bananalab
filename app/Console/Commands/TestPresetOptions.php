<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Item;
use App\Models\ItemPreset;

class TestPresetOptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:preset-options';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the new preset options functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Probando las opciones de preset...');
        
        // Buscar el primer item disponible
        $item = Item::first();
        
        if (!$item) {
            $this->error('No hay items disponibles en la base de datos.');
            return;
        }
        
        $this->info("Usando item: {$item->name} (ID: {$item->id})");
        
        // Crear un preset de prueba con las nuevas opciones
        $presetData = [
            'item_id' => $item->id,
            'name' => 'Preset de Prueba - Opciones',
            'description' => 'Preset creado para probar las nuevas opciones',
            'price' => 150.00,
            'discount' => 10.00,
            'sort_order' => 1,
            'is_active' => true,
            
            // Nuevas opciones
            'pages_options' => [
                ['value' => '20', 'label' => '20 páginas'],
                ['value' => '30', 'label' => '30 páginas'],
                ['value' => '40', 'label' => '40 páginas'],
                ['value' => '50', 'label' => '50 páginas']
            ],
            'default_pages' => '30',
            
            'cover_options' => [
                ['value' => 'dura', 'label' => 'Tapa Dura'],
                ['value' => 'blanda', 'label' => 'Tapa Blanda'],
                ['value' => 'premium', 'label' => 'Tapa Premium']
            ],
            'default_cover' => 'dura',
            
            'finish_options' => [
                ['value' => 'mate', 'label' => 'Acabado Mate'],
                ['value' => 'brillante', 'label' => 'Acabado Brillante'],
                ['value' => 'satinado', 'label' => 'Acabado Satinado']
            ],
            'default_finish' => 'mate',
            
            // Configuraciones básicas
            'canvas_config' => [
                'width' => 1000,
                'height' => 1000,
                'dpi' => 300,
                'background_color' => '#ffffff'
            ],
            
            'content_layer_config' => [
                'x' => 100,
                'y' => 100,
                'width' => 800,
                'height' => 800,
                'rotation' => 0,
                'opacity' => 1,
                'fit_mode' => 'cover'
            ]
        ];
        
        try {
            $preset = ItemPreset::create($presetData);
            $this->info("✅ Preset creado exitosamente con ID: {$preset->id}");
            
            // Verificar que los datos se guardaron correctamente
            $savedPreset = ItemPreset::find($preset->id);
            
            $this->info("\n📋 Verificando opciones guardadas:");
            
            // Verificar páginas
            $this->line("🟢 Opciones de páginas:");
            if ($savedPreset->pages_options) {
                foreach ($savedPreset->pages_options as $option) {
                    $this->line("   - {$option['value']}: {$option['label']}");
                }
                $this->line("   Página por defecto: {$savedPreset->default_pages}");
            } else {
                $this->line("   ❌ No se encontraron opciones de páginas");
            }
            
            // Verificar tapas
            $this->line("\n🟢 Opciones de tapa:");
            if ($savedPreset->cover_options) {
                foreach ($savedPreset->cover_options as $option) {
                    $this->line("   - {$option['value']}: {$option['label']}");
                }
                $this->line("   Tapa por defecto: {$savedPreset->default_cover}");
            } else {
                $this->line("   ❌ No se encontraron opciones de tapa");
            }
            
            // Verificar acabados
            $this->line("\n🟢 Opciones de acabado:");
            if ($savedPreset->finish_options) {
                foreach ($savedPreset->finish_options as $option) {
                    $this->line("   - {$option['value']}: {$option['label']}");
                }
                $this->line("   Acabado por defecto: {$savedPreset->default_finish}");
            } else {
                $this->line("   ❌ No se encontraron opciones de acabado");
            }
            
            $this->info("\n✅ Prueba completada exitosamente!");
            $this->info("Puedes ver el preset creado en el panel de administración.");
            
        } catch (\Exception $e) {
            $this->error("❌ Error al crear el preset: " . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}
