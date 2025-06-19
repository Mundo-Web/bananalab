<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING SALEDETAIL CREATION ===\n";

try {
    // Datos de prueba
    $testData = [
        'sale_id' => '9f319037-2a3e-49a7-8452-ef0e3ab13390',
        'item_id' => 'album_3_1750274001369',
        'name' => 'Mundo nuevo',
        'quantity' => 1,
        'price' => 100.00,
        'colors' => json_encode([
            'id' => 'album_3_1750274001369',
            'name' => 'Mundo nuevo',
            'type' => 'custom_album',
            'price' => '100.00'
        ])
    ];

    // Crear SaleDetail de prueba
    $saleDetail = new App\Models\SaleDetail();
    $saleDetail->sale_id = $testData['sale_id'];
    $saleDetail->item_id = $testData['item_id'];
    $saleDetail->name = $testData['name'];
    $saleDetail->quantity = $testData['quantity'];
    $saleDetail->price = $testData['price'];
    $saleDetail->colors = $testData['colors'];

    echo "✅ SaleDetail object created successfully\n";
    echo "Sale ID: " . $saleDetail->sale_id . "\n";
    echo "Name: " . $saleDetail->name . "\n";
    echo "Price: " . $saleDetail->price . "\n";
    echo "Quantity: " . $saleDetail->quantity . "\n";
    
    // Probar con create directamente
    echo "\n=== TESTING WITH CREATE METHOD ===\n";
    $created = App\Models\SaleDetail::create($testData);
    echo "✅ SaleDetail created with ID: " . $created->id . "\n";
    
    // Limpiar - eliminar el registro de prueba
    $created->delete();
    echo "✅ Test record cleaned up\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
