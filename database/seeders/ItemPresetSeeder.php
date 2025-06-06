<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\ItemPreset;
use Illuminate\Database\Seeder;

class ItemPresetSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Obtener algunos items para crear presets
        $items = Item::take(3)->get();

        if ($items->count() === 0) {
            $this->command->info('No hay items disponibles para crear presets. Ejecuta primero el seeder de items.');
            return;
        }

        foreach ($items as $item) {
            // Preset básico
            ItemPreset::create([
                'item_id' => $item->id,
                'name' => 'Álbum Básico',
                'description' => 'Álbum con configuración básica, ideal para empezar',
                'price' => $item->price * 0.8, // 20% menos que el precio base
                'discount' => 0,
                'configuration' => [
                    'pages' => 20,
                    'cover_type' => 'soft',
                    'size' => '20x20',
                    'paper_quality' => 'standard'
                ],
                'is_active' => true,
                'sort_order' => 1
            ]);

            // Preset premium
            ItemPreset::create([
                'item_id' => $item->id,
                'name' => 'Álbum Premium',
                'description' => 'Álbum premium con tapa dura y papel de alta calidad',
                'price' => $item->price * 1.5, // 50% más que el precio base
                'discount' => 10,
                'configuration' => [
                    'pages' => 40,
                    'cover_type' => 'hard',
                    'size' => '30x30',
                    'paper_quality' => 'premium',
                    'laminated' => true
                ],
                'is_active' => true,
                'sort_order' => 2
            ]);

            // Preset deluxe
            ItemPreset::create([
                'item_id' => $item->id,
                'name' => 'Álbum Deluxe',
                'description' => 'Álbum de lujo con acabados especiales y máxima calidad',
                'price' => $item->price * 2, // 100% más que el precio base
                'discount' => 15,
                'configuration' => [
                    'pages' => 60,
                    'cover_type' => 'hard',
                    'size' => '40x40',
                    'paper_quality' => 'deluxe',
                    'laminated' => true,
                    'box_included' => true,
                    'special_finish' => 'gold_embossed'
                ],
                'is_active' => true,
                'sort_order' => 3
            ]);
        }

        $this->command->info('Presets de álbumes creados exitosamente.');
    }
}
