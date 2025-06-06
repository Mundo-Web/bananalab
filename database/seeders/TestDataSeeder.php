<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Item;
use App\Models\ItemPreset;

class TestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear un item de prueba
        $item = Item::create([
            'name' => 'Libro Personalizado de Matrimonio',
            'slug' => 'libro-personalizado-matrimonio',
            'description' => 'Un hermoso libro personalizable para capturar los buenos deseos de matrimonio',
            'price' => 59.99,
            'status' => true
        ]);

        // Crear algunos presets para el item
        ItemPreset::create([
            'item_id' => $item->id,
            'name' => 'Diseño Clásico de Boda',
            'description' => 'Un diseño elegante y clásico perfecto para bodas tradicionales. Incluye elementos dorados y tipografía serif.',
            'price' => 59.99,
            'image' => '/assets/img/backgrounds/resources/default-image.png',
            'pages_options' => ['24 páginas', '50 páginas', '100 páginas'],
            'default_pages' => '50 páginas',
            'cover_options' => ['Tapa Dura Personalizable', 'Tapa Blanda'],
            'default_cover' => 'Tapa Dura Personalizable',
            'finish_options' => ['Limado', 'Brillante', 'Mate'],
            'default_finish' => 'Limado',
            'is_active' => true,
            'sort_order' => 1
        ]);

        ItemPreset::create([
            'item_id' => $item->id,
            'name' => 'Diseño Moderno Minimalista',
            'description' => 'Un diseño limpio y moderno con líneas simples y espacios en blanco. Perfecto para parejas que prefieren la simplicidad.',
            'price' => 59.99,
            'image' => '/assets/img/backgrounds/resources/default-image.png',
            'pages_options' => ['24 páginas', '50 páginas'],
            'default_pages' => '24 páginas',
            'cover_options' => ['Tapa Dura Personalizable'],
            'default_cover' => 'Tapa Dura Personalizable',
            'finish_options' => ['Mate', 'Brillante'],
            'default_finish' => 'Mate',
            'is_active' => true,
            'sort_order' => 2
        ]);

        ItemPreset::create([
            'item_id' => $item->id,
            'name' => 'Diseño Floral Romántico',
            'description' => 'Un diseño romántico con elementos florales y colores suaves. Ideal para bodas en jardín o al aire libre.',
            'price' => 69.99,
            'image' => '/assets/img/backgrounds/resources/default-image.png',
            'pages_options' => ['50 páginas', '100 páginas'],
            'default_pages' => '100 páginas',
            'cover_options' => ['Tapa Dura Personalizable', 'Tapa Blanda'],
            'default_cover' => 'Tapa Dura Personalizable',
            'finish_options' => ['Brillante', 'Limado'],
            'default_finish' => 'Brillante',
            'is_active' => true,
            'sort_order' => 3
        ]);

        // Crear otro item
        $item2 = Item::create([
            'name' => 'Álbum de Fotos Personalizado',
            'slug' => 'album-fotos-personalizado',
            'description' => 'Álbum de fotos personalizable para recordar momentos especiales',
            'price' => 45.99,
            'status' => true
        ]);

        ItemPreset::create([
            'item_id' => $item2->id,
            'name' => 'Álbum Vintage',
            'description' => 'Diseño vintage con toques nostálgicos',
            'price' => 45.99,
            'image' => '/assets/img/backgrounds/resources/default-image.png',
            'is_active' => true,
            'sort_order' => 1
        ]);

        echo "Datos de prueba creados exitosamente:\n";
        echo "- Item 1: {$item->name} (ID: {$item->id})\n";
        echo "- Item 2: {$item2->name} (ID: {$item2->id})\n";
        echo "- Total presets creados: " . ItemPreset::count() . "\n";
    }
}
