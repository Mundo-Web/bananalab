<?php

require_once 'bootstrap/app.php';

$app = app();

use App\Models\PaymentMethod;

$mp = PaymentMethod::where('slug', 'mercadopago')->first();

if ($mp) {
    // Actualizar con credenciales de prueba temporales
    $mp->configuration = [
        'public_key' => 'TEST-4f3f7d8e-2c1a-4b6d-9e8f-1a2b3c4d5e6f',
        'access_token' => 'TEST-123456789012345-061808-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t-123456789',
        'sandbox' => true,
        'success_url' => 'http://localhost:8000/checkout/success',
        'failure_url' => 'http://localhost:8000/checkout/failure', 
        'pending_url' => 'http://localhost:8000/checkout/pending',
        'webhook_url' => 'http://localhost:8000/api/payments/mercadopago/webhook'
    ];
    
    $mp->save();
    
    echo "✅ Credenciales de MercadoPago actualizadas!" . PHP_EOL;
    echo "Public Key: " . substr($mp->configuration['public_key'], 0, 20) . "..." . PHP_EOL;
    echo "Sandbox: " . ($mp->configuration['sandbox'] ? 'Sí' : 'No') . PHP_EOL;
    
} else {
    echo "❌ No se encontró MercadoPago en payment_methods" . PHP_EOL;
}
