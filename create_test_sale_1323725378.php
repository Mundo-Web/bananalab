<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Crear una instancia mínima de Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CREAR VENTA PARA PAGO #1323725378 ===\n\n";

try {
    // Generar número de orden único
    $orderNumber = '1323725378MP' . time();
    
    echo "Creando venta con código: {$orderNumber}\n";
    
    // Obtener estado "Pagado"
    $saleStatusPagado = \App\Models\SaleStatus::getByName('Pagado');
    
    // Crear la venta directamente como pagada
    $sale = \App\Models\Sale::create([
        'code' => $orderNumber,
        'user_id' => null,
        'name' => 'Cliente',
        'lastname' => 'MercadoPago',
        'fullname' => 'Cliente MercadoPago',
        'email' => 'cliente@example.com',
        'phone' => '',
        'country' => 'PE',
        'department' => '',
        'province' => '',
        'district' => '',
        'ubigeo' => '',
        'address' => '',
        'number' => '',
        'reference' => '',
        'comment' => 'Pago procesado manualmente - Operación #1323725378',
        'amount' => 200.00, // Asumiendo un monto típico
        'delivery' => 0,
        'payment_status' => 'pagado',
        'status_id' => $saleStatusPagado ? $saleStatusPagado->id : null,
        'culqi_charge_id' => '1323725378',
        'invoiceType' => '',
        'documentType' => '',
        'document' => '',
        'businessName' => '',
    ]);
    
    echo "✅ Venta creada exitosamente!\n";
    echo "   ID: {$sale->id}\n";
    echo "   Código: {$sale->code}\n";
    echo "   Estado: {$sale->payment_status}\n";
    echo "   Monto: {$sale->amount}\n";
    echo "   Payment ID: {$sale->culqi_charge_id}\n";
    
    // Crear un detalle de venta genérico
    \App\Models\SaleDetail::create([
        'sale_id' => $sale->id,
        'item_id' => 1, // Asumiendo que existe un item con ID 1
        'name' => 'Producto - Pago MercadoPago #1323725378',
        'price' => 200.00,
        'quantity' => 1,
    ]);
    
    echo "✅ Detalle de venta agregado!\n";
    
    // Crear URL de prueba para simular el retorno de MercadoPago
    $appUrl = config('app.url', 'http://localhost:8000');
    $testUrl = $appUrl . '/checkout/success?external_reference=' . $orderNumber . '&payment_id=1323725378&payment_type=mercadopago';
    
    echo "\n📝 INSTRUCCIONES:\n";
    echo "1. Tu venta ya está registrada en el sistema con estado 'pagado'\n";
    echo "2. Puedes verificarla en el panel de administración\n";
    echo "3. Para probar el flujo de retorno, visita esta URL:\n";
    echo "   {$testUrl}\n";
    echo "\n4. Esta URL te llevará al paso 3 del checkout con confirmación de pago exitoso\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== FIN ===\n";
