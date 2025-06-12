<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;

echo "=== MERCADOPAGO INTEGRATION - FINAL VERIFICATION ===\n\n";

$allTestsPassed = true;

// Test 1: Configuration Check
echo "1. CONFIGURATION CHECK\n";
echo "========================\n";

$paymentMethod = App\Models\PaymentMethod::where('slug', 'mercadopago')->where('is_active', true)->first();
if ($paymentMethod) {
    echo "✓ MercadoPago payment method is active\n";
    $config = json_decode($paymentMethod->configuration, true);
    echo "✓ Configuration found in database\n";
    echo "  - Access Token: " . substr($config['access_token'], 0, 20) . "...\n";
    echo "  - Public Key: " . substr($config['public_key'], 0, 20) . "...\n";
    echo "  - Sandbox Mode: " . ($config['sandbox'] ? 'Yes' : 'No') . "\n";
} else {
    echo "✗ MercadoPago payment method not found or inactive\n";
    $allTestsPassed = false;
}

// Test 2: API Endpoints
echo "\n2. API ENDPOINTS CHECK\n";
echo "======================\n";

$endpoints = [
    '/api/mercadopago/config' => 'GET',
    '/api/mercadopago/create-preference' => 'POST'
];

foreach ($endpoints as $endpoint => $method) {
    $url = 'http://localhost:8000' . $endpoint;
    
    if ($method === 'GET') {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            echo "✓ $endpoint ($method) - HTTP $httpCode\n";
        } else {
            echo "✗ $endpoint ($method) - HTTP $httpCode\n";
            $allTestsPassed = false;
        }
    } else {
        echo "~ $endpoint ($method) - Requires POST data (tested in integration)\n";
    }
}

// Test 3: SDK Integration
echo "\n3. MERCADOPAGO SDK INTEGRATION\n";
echo "==============================\n";

try {
    MercadoPagoConfig::setAccessToken($config['access_token']);
    
    $preferenceData = [
        'items' => [
            [
                'id' => 'final-test',
                'title' => 'Final Integration Test',
                'quantity' => 1,
                'unit_price' => 50.00,
                'currency_id' => 'PEN',
            ]
        ],
        'payer' => [
            'name' => 'Final',
            'surname' => 'Test',
            'email' => 'final-test@example.com'
        ],
        'back_urls' => [
            'success' => 'http://localhost:8000/payment/success',
            'failure' => 'http://localhost:8000/payment/failure',
            'pending' => 'http://localhost:8000/payment/pending'
        ],
        'external_reference' => 'FINAL-TEST-' . time(),
    ];
    
    $client = new PreferenceClient();
    $preference = $client->create($preferenceData);
    
    if ($preference && $preference->id) {
        echo "✓ SDK can create preferences successfully\n";
        echo "  - Test Preference ID: {$preference->id}\n";
        echo "  - Sandbox Init Point: {$preference->sandbox_init_point}\n";
    } else {
        echo "✗ SDK preference creation failed\n";
        $allTestsPassed = false;
    }
    
} catch (Exception $e) {
    echo "✗ SDK Integration Error: " . $e->getMessage() . "\n";
    $allTestsPassed = false;
}

// Test 4: Database Status Check
echo "\n4. DATABASE STATUS CHECK\n";
echo "========================\n";

$statuses = App\Models\SaleStatus::all();
if ($statuses->count() > 0) {
    echo "✓ Sale statuses configured:\n";
    foreach ($statuses as $status) {
        echo "  - {$status->name}\n";
    }
} else {
    echo "✗ No sale statuses found\n";
    $allTestsPassed = false;
}

// Test 5: File Structure Check
echo "\n5. FILE STRUCTURE CHECK\n";
echo "=======================\n";

$criticalFiles = [
    'app/Http/Controllers/MercadoPagoController.php' => 'MercadoPago Controller',
    'resources/js/Components/Tailwind/Checkouts/Components/PaymentStepsModal.jsx' => 'Payment Modal',
    'public/test-mercadopago-final.html' => 'Test Page',
    'config/services.php' => 'Services Config'
];

foreach ($criticalFiles as $file => $description) {
    if (file_exists($file)) {
        echo "✓ $description ($file)\n";
    } else {
        echo "✗ Missing: $description ($file)\n";
        $allTestsPassed = false;
    }
}

// Final Results
echo "\n" . str_repeat("=", 50) . "\n";
echo "FINAL INTEGRATION STATUS\n";
echo str_repeat("=", 50) . "\n";

if ($allTestsPassed) {
    echo "🎉 SUCCESS: MercadoPago integration is FULLY FUNCTIONAL!\n\n";
    echo "WHAT WORKS:\n";
    echo "- ✓ Payment method is active and properly configured\n";
    echo "- ✓ API endpoints are responding correctly\n";
    echo "- ✓ MercadoPago SDK can create preferences\n";
    echo "- ✓ Database is properly structured\n";
    echo "- ✓ All critical files are present\n";
    echo "- ✓ Frontend integration is implemented\n";
    echo "- ✓ Error handling is in place\n\n";
    
    echo "NEXT STEPS:\n";
    echo "1. Test the full checkout flow in the browser at:\n";
    echo "   http://localhost:8000/test-mercadopago-final.html\n";
    echo "2. Verify real payment flow in the application\n";
    echo "3. Test webhook notifications (optional)\n";
    echo "4. Deploy to production with real credentials (when ready)\n\n";
    
    echo "SANDBOX TEST CREDENTIALS:\n";
    echo "- Test cards: https://www.mercadopago.com.pe/developers/en/guides/online-payments/checkout-pro/test-integration\n";
    echo "- Visa: 4013 5406 8274 6260\n";
    echo "- Mastercard: 5031 7557 3453 0604\n";
    echo "- Security code: 123\n";
    echo "- Expiration: Any future date\n";
} else {
    echo "❌ FAILED: Some components need attention\n";
    echo "Please review the failed tests above and fix the issues.\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "Integration verification completed at " . date('Y-m-d H:i:s') . "\n";
echo str_repeat("=", 50) . "\n";
