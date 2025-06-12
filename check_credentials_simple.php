<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;

$paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();
if ($paymentMethod) {
    $config = json_decode($paymentMethod->configuration, true);
    echo "=== CREDENCIALES ACTUALES ===\n";
    echo "Public Key: " . substr($config['public_key'] ?? 'NO ENCONTRADO', 0, 30) . "...\n";
    echo "Access Token: " . substr($config['access_token'] ?? 'NO ENCONTRADO', 0, 30) . "...\n";
    echo "Es sandbox: " . (($config['is_sandbox'] ?? false) ? 'SÍ' : 'NO') . "\n";
    
    // Verificar si son credenciales de TEST
    $isTestPublicKey = strpos($config['public_key'] ?? '', 'TEST-') === 0;
    $isTestAccessToken = strpos($config['access_token'] ?? '', 'TEST-') === 0;
    
    echo "\n=== VERIFICACIÓN ===\n";
    echo "Public Key es de TEST: " . ($isTestPublicKey ? 'SÍ' : 'NO') . "\n";
    echo "Access Token es de TEST: " . ($isTestAccessToken ? 'SÍ' : 'NO') . "\n";
    
    if (!$isTestPublicKey || !$isTestAccessToken) {
        echo "\n🚨 PROBLEMA: Estás usando credenciales de PRODUCCIÓN en SANDBOX\n";
        echo "Esto causa el error E216 y problemas de login.\n";
    } else {
        echo "\n✅ Las credenciales son de TEST, esto está correcto.\n";
    }
} else {
    echo "PaymentMethod no encontrado\n";
}
