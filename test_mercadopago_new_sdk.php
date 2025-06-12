<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;

echo "=== New MercadoPago SDK Test ===\n\n";

// Test MercadoPago SDK directly - use config from DB
$paymentMethod = App\Models\PaymentMethod::where('slug', 'mercadopago')->where('is_active', true)->first();
if (!$paymentMethod) {
    die("MercadoPago payment method not found or not active\n");
}

$config = json_decode($paymentMethod->configuration, true);
echo "Access Token from DB: " . substr($config['access_token'], 0, 20) . "...\n";
echo "Public Key from DB: " . substr($config['public_key'], 0, 20) . "...\n";
echo "Sandbox from DB: " . (($config['sandbox'] ?? true) ? 'true' : 'false') . "\n\n";

try {
    // Configure MercadoPago
    MercadoPagoConfig::setAccessToken($config['access_token']);
    MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL);
    
    // Create simple preference data
    $preferenceData = [
        'items' => [
            [
                'id' => 'test-item',
                'title' => 'Test Product',
                'quantity' => 1,
                'unit_price' => 100.00,
                'currency_id' => 'PEN',
            ]
        ],
        'payer' => [
            'name' => 'Test',
            'surname' => 'User',
            'email' => 'test@example.com'
        ],    'back_urls' => [
        'success' => 'http://localhost:8000/payment/success',
        'failure' => 'http://localhost:8000/payment/failure',
        'pending' => 'http://localhost:8000/payment/pending'
    ],
        'external_reference' => 'TEST-' . time(),
    ];
    
    echo "Creating preference with data:\n";
    echo json_encode($preferenceData, JSON_PRETTY_PRINT) . "\n\n";
    
    // Create preference
    $client = new PreferenceClient();
    $preference = $client->create($preferenceData);
    
    if ($preference && $preference->id) {
        echo "✓ Preference created successfully!\n";
        echo "  - ID: {$preference->id}\n";
        echo "  - Init Point: {$preference->init_point}\n";
        echo "  - Sandbox Init Point: {$preference->sandbox_init_point}\n";
    } else {
        echo "✗ Failed to create preference\n";
        var_dump($preference);
    }
    
} catch (\MercadoPago\Exceptions\MPApiException $e) {
    echo "✗ MercadoPago API Exception:\n";
    echo "  - Status Code: " . $e->getStatusCode() . "\n";
    echo "  - Message: " . $e->getMessage() . "\n";
    echo "  - Response: " . json_encode($e->getApiResponse()->getContent(), JSON_PRETTY_PRINT) . "\n";
} catch (Exception $e) {
    echo "✗ General Exception: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";
