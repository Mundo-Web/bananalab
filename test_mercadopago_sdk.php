<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Direct MercadoPago SDK Test ===\n\n";

// Test MercadoPago SDK directly
$config = config('services.mercadopago');
echo "Access Token: " . substr($config['access_token'], 0, 20) . "...\n";
echo "Sandbox: " . ($config['sandbox'] ? 'true' : 'false') . "\n\n";

// Create preference directly
try {
    \MercadoPago\SDK::setAccessToken($config['access_token']);
    
    $preference = new \MercadoPago\Preference();
    
    // Create basic item
    $item = new \MercadoPago\Item();
    $item->id = 'test-item';
    $item->title = 'Test Product';
    $item->quantity = 1;
    $item->unit_price = 100.00;
    $item->currency_id = 'PEN';
    
    $preference->items = [$item];
    
    // Set payer
    $payer = new \MercadoPago\Payer();
    $payer->name = 'Test';
    $payer->surname = 'User';
    $payer->email = 'test@example.com';
    $preference->payer = $payer;
    
    // Set URLs
    $preference->back_urls = [
        'success' => 'http://localhost:8000/payment/success',
        'failure' => 'http://localhost:8000/payment/failure',
        'pending' => 'http://localhost:8000/payment/pending'
    ];
    $preference->auto_return = 'approved';
    
    // External reference
    $preference->external_reference = 'TEST-' . time();
    
    // Save preference
    $result = $preference->save();
    
    if ($preference->id) {
        echo "✓ Preference created successfully!\n";
        echo "  - ID: {$preference->id}\n";
        echo "  - Init Point: {$preference->init_point}\n";
        echo "  - Sandbox Init Point: {$preference->sandbox_init_point}\n";
    } else {
        echo "✗ Failed to create preference\n";
        echo "Errors:\n";
        if (isset($preference->error)) {
            print_r($preference->error);
        }
    }
    
} catch (Exception $e) {
    echo "✗ Exception: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";
