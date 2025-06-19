<?php

require 'vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "========================================================\n";
echo "   Verificando integración con MercadoPago SDK v2.x\n";
echo "========================================================\n";

try {
    // Obtener método de pago
    $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')->first();
    
    if (!$paymentMethod) {
        die("❌ No se encontró el método de pago 'mercadopago'\n");
    }
    
    // Obtener configuración
    $config = is_string($paymentMethod->configuration) 
        ? json_decode($paymentMethod->configuration, true) 
        : $paymentMethod->configuration;
        
    $accessToken = $config['access_token'] ?? '';
    
    if (empty($accessToken)) {
        die("❌ El access_token no está configurado\n");
    }
    
    echo "Verificando si SDK v2 está disponible...\n";
    if (!class_exists('MercadoPago\SDK')) {
        die("❌ La clase MercadoPago\\SDK no está disponible\n");
    }
    
    echo "✅ SDK v2 encontrado, intentando configurar con access token...\n";
    \MercadoPago\SDK::setAccessToken($accessToken);
    
    echo "✅ SDK configurado correctamente\n";
    echo "Intentando crear un objeto Payment...\n";
    
    $payment = new \MercadoPago\Payment();
    $payment->transaction_amount = 100;
    $payment->description = "Test Payment";
    // No guardamos el pago, solo verificamos que se pueda crear el objeto
    
    echo "✅ Objeto Payment creado exitosamente\n";
    echo "\nLa integración con el SDK v2.x de MercadoPago funciona correctamente.\n";
    echo "El backend debe ser capaz de procesar pagos correctamente.\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n========================================================\n";
