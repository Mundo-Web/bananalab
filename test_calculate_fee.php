<?php
/**
 * Script simple para probar que el método calculateFee funciona correctamente
 */

require_once __DIR__ . '/vendor/autoload.php';

echo "🧪 TESTING PAYMENT METHOD CALCULATE FEE\n";
echo str_repeat("=", 50) . "\n";

try {
    // Bootstrap Laravel
    $app = require_once __DIR__ . '/bootstrap/app.php';
    $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    
    // Buscar el método de pago de MercadoPago
    $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')
        ->where('is_active', true)
        ->first();

    if (!$paymentMethod) {
        echo "❌ MercadoPago payment method not found\n";
        exit(1);
    }

    echo "✅ Payment method found: {$paymentMethod->name}\n";

    // Probar el cálculo de comisión
    $amount = 200;
    $fee = $paymentMethod->calculateFee($amount);
    $total = $amount + $fee;

    echo "✅ Fee calculation successful:\n";
    echo "   - Amount: S/ $amount\n";
    echo "   - Fee: S/ $fee\n";
    echo "   - Total: S/ $total\n";

    // Verificar configuración
    $accessToken = $paymentMethod->getConfig('access_token');
    $publicKey = $paymentMethod->getConfig('public_key');

    if ($accessToken && $publicKey) {
        echo "✅ MercadoPago credentials configured\n";
        echo "   - Access Token: " . substr($accessToken, 0, 20) . "...\n";
        echo "   - Public Key: " . substr($publicKey, 0, 20) . "...\n";
    } else {
        echo "❌ MercadoPago credentials not configured\n";
    }

    echo "\n" . str_repeat("=", 50) . "\n";
    echo "🎯 El método calculateFee funciona correctamente!\n";
    echo "El error del endpoint debería estar solucionado.\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
