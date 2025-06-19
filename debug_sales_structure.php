<?php
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::create('/');
$kernel->bootstrap();

echo "=== Revisando estructura de Sales ===\n";

try {
    // Ver ventas existentes
    $sales = App\Models\Sale::select('payment_status', 'status_id')->distinct()->get();
    echo "Payment statuses existentes:\n";
    foreach ($sales as $sale) {
        echo "- payment_status: '{$sale->payment_status}', status_id: {$sale->status_id}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

// Intentar crear sin payment_status primero
echo "\n=== Probando creación simplificada ===\n";
try {
    $sale = App\Models\Sale::create([
        'code' => 'TEST-' . time(),
        'user_id' => 1,
        'name' => 'Test',
        'lastname' => 'User',
        'fullname' => 'Test User',
        'email' => 'test@test.com',
        'phone' => '123456789',
        'country' => 'Perú',
        'department' => 'Lima',
        'province' => 'Lima',
        'district' => 'Lima',
        'address' => 'Test Address',
        'amount' => 100.00,
        'delivery' => 0,
        'payment_method' => 'test',
        'payment_method_id' => 1,
        'payment_fee' => 0,
    ]);
    echo "✅ Sale creada exitosamente con ID: " . $sale->id . "\n";
    
    // Eliminar la venta de prueba
    $sale->delete();
    echo "✅ Sale de prueba eliminada\n";
    
} catch (Exception $e) {
    echo "❌ Error creando sale: " . $e->getMessage() . "\n";
}
?>
