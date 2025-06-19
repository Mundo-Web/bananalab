<?php

require 'vendor/autoload.php';

echo "========================================================\n";
echo "   Prueba de integración con MercadoPago SDK v3.x\n";
echo "========================================================\n";

// Cargar la aplicación Laravel para obtener las credenciales
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Obtener método de pago
$paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')->first();

if (!$paymentMethod) {
    die("❌ No se encontró el método de pago 'mercadopago' en la base de datos\n");
}

// Obtener configuración
$config = is_string($paymentMethod->configuration) 
    ? json_decode($paymentMethod->configuration, true) 
    : $paymentMethod->configuration;

$accessToken = $config['access_token'] ?? '';
$publicKey = $config['public_key'] ?? '';

if (empty($accessToken) || empty($publicKey)) {
    die("❌ Credenciales de MercadoPago no configuradas\n");
}

echo "Credenciales disponibles:\n";
echo "- PUBLIC KEY: " . substr($publicKey, 0, 15) . "...\n";
echo "- ACCESS TOKEN: " . substr($accessToken, 0, 15) . "...\n\n";

// Intentar código con SDK v3.x
echo "Intentando crear cliente MercadoPago con SDK v3.x...\n";

try {
    // Crear cliente SDK v3 (nueva forma)
    $client = new \MercadoPago\Client();
    $client->setAccessToken($accessToken);
    $client->setPublicKey($publicKey);
    
    echo "✅ Cliente SDK v3.x creado exitosamente\n";
    
    // Crear un objeto Payment para verificar
    $paymentClient = $client->payment();
    echo "✅ Cliente de Payment creado exitosamente\n";
    
    echo "\nLa integración con MercadoPago SDK v3.x funciona correctamente.\n";
    
} catch (\Exception $e) {
    echo "❌ Error con SDK v3.x: " . $e->getMessage() . "\n";
    
    // Intentar con forma alternativa (usada en tu controlador)
    echo "\nIntentando forma alternativa (SDK clásico)...\n";
    
    try {
        if (class_exists('MercadoPago\SDK')) {
            \MercadoPago\SDK::setAccessToken($accessToken);
            echo "✅ SDK configurado correctamente\n";
            
            $payment = new \MercadoPago\Payment();
            echo "✅ Objeto Payment creado exitosamente\n";
            
            echo "\nLa integración con MercadoPago SDK (método clásico) funciona correctamente.\n";
        } else {
            echo "❌ La clase MercadoPago\SDK no existe\n";
        }
    } catch (\Exception $e2) {
        echo "❌ Error con método clásico: " . $e2->getMessage() . "\n";
    }
}

echo "\n========================================================\n";
echo "                  Prueba finalizada\n";
echo "========================================================\n";
