<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔧 REPARANDO configuración de MercadoPago...\n\n";

try {
    $paymentMethod = App\Models\PaymentMethod::where('slug', 'mercadopago')->first();
    
    if (!$paymentMethod) {
        echo "❌ No se encontró el método de pago MercadoPago\n";
        exit(1);
    }
    
    echo "✅ Método encontrado: {$paymentMethod->name}\n";
    
    // Obtener configuración RAW
    $rawConfig = $paymentMethod->getAttributes()['configuration'];
    echo "📄 Config RAW: $rawConfig\n";
    
    // Decodificar manualmente
    $configArray = json_decode($rawConfig, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "❌ Error decodificando JSON: " . json_last_error_msg() . "\n";
        exit(1);
    }
    
    echo "📋 Config decodificado:\n";
    print_r($configArray);
    
    // Forzar actualización con array
    $paymentMethod->configuration = $configArray;
    $paymentMethod->save();
    
    echo "\n✅ Configuración actualizada correctamente!\n";
    
    // Verificar
    $paymentMethod->refresh();
    echo "\n🔍 Verificando:\n";
    echo "Public Key: " . ($paymentMethod->getConfig('public_key') ?: 'NULL') . "\n";
    echo "Access Token: " . ($paymentMethod->getConfig('access_token') ? substr($paymentMethod->getConfig('access_token'), 0, 30) . '...' : 'NULL') . "\n";
    echo "Sandbox: " . ($paymentMethod->getConfig('sandbox') ? 'SÍ' : 'NO') . "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
