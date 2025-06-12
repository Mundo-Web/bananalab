<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;

// Crear una instancia mínima de Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== VERIFICAR ITEMS Y CREAR VENTA CORRECTA ===\n\n";

try {
    // 1. Verificar items existentes
    echo "1. ITEMS EXISTENTES:\n";
    $items = \App\Models\Item::take(5)->get(['id', 'name']);
    
    if ($items->count() > 0) {
        foreach ($items as $item) {
            echo "   ID: {$item->id} | Name: {$item->name}\n";
        }
        $firstItemId = $items->first()->id;
    } else {
        echo "   No hay items en la base de datos. Creando item de prueba...\n";
        
        // Crear un item de prueba
        $firstItemId = \App\Models\Item::create([
            'name' => 'Producto de Prueba - MercadoPago',
            'description' => 'Producto creado para test de pago MercadoPago',
            'price' => 200.00,
            'stock' => 100,
            'sku' => 'TEST-MP-001',
            'is_active' => true,
            'category_id' => 1, // Asumiendo que existe
        ])->id;
        
        echo "   ✅ Item creado con ID: {$firstItemId}\n";
    }
    
    // 2. Buscar la venta que acabamos de crear
    echo "\n2. VERIFICANDO VENTA CREADA:\n";
    $sale = \App\Models\Sale::where('culqi_charge_id', '1323725378')->first();
    
    if ($sale) {
        echo "   ✅ Venta encontrada: {$sale->code}\n";
        echo "   ID: {$sale->id}\n";
        echo "   Estado: {$sale->payment_status}\n";
        
        // 3. Crear detalle de venta con item válido
        echo "\n3. CREANDO DETALLE DE VENTA:\n";
        try {
            \App\Models\SaleDetail::create([
                'sale_id' => $sale->id,
                'item_id' => $firstItemId,
                'name' => 'Producto - Pago MercadoPago #1323725378',
                'price' => 200.00,
                'quantity' => 1,
            ]);
            echo "   ✅ Detalle de venta creado exitosamente!\n";
        } catch (\Exception $e) {
            echo "   ❌ Error creando detalle: " . $e->getMessage() . "\n";
        }
        
        // 4. Crear URL de prueba
        $appUrl = config('app.url', 'http://localhost:8000');
        $testUrl = $appUrl . '/checkout/success?external_reference=' . $sale->code . '&payment_id=1323725378&payment_type=mercadopago';
        
        echo "\n4. URL DE PRUEBA PARA PROBAR EL FLUJO:\n";
        echo "   {$testUrl}\n";
        
        echo "\n✅ ¡LISTO! Tu pago ya está registrado en el sistema.\n";
        echo "   Código de venta: {$sale->code}\n";
        echo "   Payment ID: 1323725378\n";
        echo "   Estado: {$sale->payment_status}\n";
        echo "\n   Puedes verificar esta venta en el panel de administración o usar la URL de arriba para probar el retorno.\n";
        
    } else {
        echo "   ❌ No se encontró la venta con payment_id 1323725378\n";
    }

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== FIN ===\n";
