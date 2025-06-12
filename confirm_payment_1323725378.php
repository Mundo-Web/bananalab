<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Crear una instancia mínima de Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== SCRIPT DE CONFIRMACIÓN MANUAL DE PAGO #1323725378 ===\n\n";

try {
    // 1. Buscar ventas pendientes recientes que podrían corresponder al pago
    echo "1. BUSCANDO VENTAS PENDIENTES RECIENTES:\n";
    $recentSales = \App\Models\Sale::where('payment_status', 'pendiente')
        ->where('created_at', '>', now()->subHours(2))
        ->orderBy('created_at', 'desc')
        ->get();
    
    if ($recentSales->count() === 0) {
        echo "   No se encontraron ventas pendientes en las últimas 2 horas.\n";
        exit;
    }
    
    echo "   Ventas pendientes encontradas:\n";
    foreach ($recentSales as $index => $sale) {
        echo "   [{$index}] ID: {$sale->id} | Código: {$sale->code} | Monto: {$sale->amount} | Fecha: {$sale->created_at}\n";
        echo "       Cliente: {$sale->fullname} | Email: {$sale->email}\n";
    }
    
    // 2. Preguntarle al usuario cuál venta corresponde al pago
    echo "\n2. ¿Cuál de estas ventas corresponde a tu pago #1323725378?\n";
    echo "   Ingresa el número de la venta [0-" . ($recentSales->count() - 1) . "] o 'exit' para salir: ";
    
    $handle = fopen("php://stdin", "r");
    $input = trim(fgets($handle));
    fclose($handle);
    
    if ($input === 'exit') {
        echo "   Operación cancelada.\n";
        exit;
    }
    
    if (!is_numeric($input) || $input < 0 || $input >= $recentSales->count()) {
        echo "   Opción inválida.\n";
        exit;
    }
    
    $selectedSale = $recentSales[$input];
    
    echo "\n3. CONFIRMANDO PAGO PARA LA VENTA SELECCIONADA:\n";
    echo "   Venta ID: {$selectedSale->id}\n";
    echo "   Código: {$selectedSale->code}\n";
    echo "   Monto: {$selectedSale->amount}\n";
    echo "   Cliente: {$selectedSale->fullname}\n";
    
    // 3. Marcar el pago como exitoso
    $saleStatusPagado = \App\Models\SaleStatus::getByName('Pagado');
    
    $selectedSale->update([
        'culqi_charge_id' => '1323725378', // Usar tu número de operación
        'payment_status' => 'pagado',
        'status_id' => $saleStatusPagado ? $saleStatusPagado->id : null,
    ]);
    
    echo "   ✅ Pago marcado como exitoso!\n";
    
    // 4. Actualizar stock
    echo "\n4. ACTUALIZANDO STOCK DE PRODUCTOS:\n";
    $saleDetails = \App\Models\SaleDetail::where('sale_id', $selectedSale->id)->get();
    
    foreach ($saleDetails as $detail) {
        $item = \App\Models\Item::find($detail->item_id);
        if ($item) {
            $stockAnterior = $item->stock;
            $item->decrement('stock', $detail->quantity);
            $item->refresh();
            echo "   - Producto: {$detail->name} | Cantidad: {$detail->quantity} | Stock anterior: {$stockAnterior} | Stock actual: {$item->stock}\n";
        }
    }
    
    echo "\n5. VERIFICACIÓN FINAL:\n";
    $selectedSale->refresh();
    echo "   Estado de pago: {$selectedSale->payment_status}\n";
    echo "   Payment ID: {$selectedSale->culqi_charge_id}\n";
    echo "   Estado ID: {$selectedSale->status_id}\n";
    
    echo "\n✅ ¡PAGO CONFIRMADO EXITOSAMENTE!\n";
    echo "   Ahora puedes ver esta venta en el panel de administración.\n";
    echo "   Código de orden: {$selectedSale->code}\n";
    echo "   Operación MercadoPago: #1323725378\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== FIN DEL SCRIPT ===\n";
