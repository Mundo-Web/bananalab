<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;

if ($argc < 3) {
    echo "Uso: php configure_test_credentials.php 'TEST-public-key' 'TEST-access-token'\n";
    exit(1);
}

$testPublicKey = $argv[1];
$testAccessToken = $argv[2];

try {
    echo "=== CONFIGURANDO CREDENCIALES DE TEST ===\n\n";

    // Validar que sean credenciales de TEST
    if (strpos($testPublicKey, 'TEST-') !== 0) {
        throw new Exception('El Public Key debe empezar con "TEST-"');
    }
    
    if (strpos($testAccessToken, 'TEST-') !== 0) {
        throw new Exception('El Access Token debe empezar con "TEST-"');
    }

    $paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();
    if (!$paymentMethod) {
        throw new Exception('MercadoPago no encontrado');
    }

    $config = json_decode($paymentMethod->configuration, true);
    
    // Actualizar con credenciales de TEST
    $config['public_key'] = $testPublicKey;
    $config['access_token'] = $testAccessToken;
    $config['sandbox'] = true;
    $config['is_sandbox'] = true;
    
    echo "Configuración actualizada:\n";
    echo "- sandbox: true\n";
    echo "- is_sandbox: true\n";
    echo "- Public Key: " . substr($testPublicKey, 0, 30) . "...\n";
    echo "- Access Token: " . substr($testAccessToken, 0, 30) . "...\n";
    
    // Guardar la configuración
    $paymentMethod->configuration = json_encode($config);
    $paymentMethod->save();
    
    echo "\n✅ CONFIGURACIÓN GUARDADA EN MODO SANDBOX\n";
    echo "\nAhora puedes probar con:\n";
    echo "- Emails de cuentas de prueba: TESTUSER906372783@testuser.com\n";
    echo "- Tarjetas de prueba oficiales de MercadoPago\n";
    echo "- El frontend usará sandbox_init_point correctamente\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
