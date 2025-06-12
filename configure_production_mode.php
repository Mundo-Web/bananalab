<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;

try {
    echo "=== CONFIGURANDO MODO PRODUCCIÓN COMPLETO ===\n\n";

    $paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();
    if (!$paymentMethod) {
        throw new Exception('MercadoPago no encontrado');
    }

    $config = json_decode($paymentMethod->configuration, true);
    
    // Configurar modo PRODUCCIÓN completo
    $config['sandbox'] = false;
    $config['is_sandbox'] = false;
    
    echo "Configuración actualizada:\n";
    echo "- sandbox: " . ($config['sandbox'] ? 'true' : 'false') . "\n";
    echo "- is_sandbox: " . ($config['is_sandbox'] ? 'true' : 'false') . "\n";
    echo "- Public Key: " . substr($config['public_key'], 0, 30) . "...\n";
    echo "- Access Token: " . substr($config['access_token'], 0, 30) . "...\n";
    
    // Guardar la configuración
    $paymentMethod->configuration = json_encode($config);
    $paymentMethod->save();
    
    echo "\n✅ CONFIGURACIÓN GUARDADA EN MODO PRODUCCIÓN\n";
    echo "\nIMPORTANTE:\n";
    echo "- El frontend ahora usará init_point (producción)\n";
    echo "- Para pruebas, usa emails de cuentas de prueba oficiales\n";
    echo "- Las transacciones serán REALES si usas tarjetas reales\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
