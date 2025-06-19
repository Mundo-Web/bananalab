<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING SALE_DETAIL WITH NULLABLE ITEM_ID ===\n";

try {
    // Probar crear un SaleDetail con item_id = null (para álbum personalizado)
    $sale = App\Models\Sale::first();
    if (!$sale) {
        echo "❌ No hay ventas para probar\n";
        exit(1);
    }
    
    echo "✅ Sale found: {$sale->id}\n";
    
    // Crear SaleDetail con item_id = null (producto personalizado)
    $saleDetail = new App\Models\SaleDetail();
    $saleDetail->sale_id = $sale->id;
    $saleDetail->item_id = null; // Para álbumes personalizados
    $saleDetail->name = 'Álbum Personalizado Test';
    $saleDetail->quantity = 1;
    $saleDetail->price = 100.00;
    $saleDetail->colors = json_encode([
        'type' => 'custom_album',
        'album_data' => ['album_id' => 3, 'title' => 'Test Album']
    ]);
    
    $saleDetail->save();
    
    echo "✅ SaleDetail created successfully with NULL item_id!\n";
    echo "   ID: {$saleDetail->id}\n";
    echo "   Sale ID: {$saleDetail->sale_id}\n";
    echo "   Item ID: " . ($saleDetail->item_id ?? 'NULL') . "\n";
    echo "   Name: {$saleDetail->name}\n";
    
    // Limpiar el registro de prueba
    $saleDetail->delete();
    echo "✅ Test record cleaned up\n";
    
    echo "\n🎉 SUCCESS! The foreign key constraint issue is RESOLVED! 🎉\n";
    echo "Now custom albums can be created without foreign key errors.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
