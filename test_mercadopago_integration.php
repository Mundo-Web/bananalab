<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== MercadoPago Integration Test ===\n\n";

// 1. Check MercadoPago configuration
echo "1. Checking MercadoPago Configuration...\n";
$mercadoPago = App\Models\PaymentMethod::where('name', 'MercadoPago')->first();
if ($mercadoPago && $mercadoPago->is_active) {
    echo "✓ MercadoPago is active\n";
    echo "   - Public Key: " . (config('services.mercadopago.public_key') ? 'SET' : 'NOT SET') . "\n";
    echo "   - Access Token: " . (config('services.mercadopago.access_token') ? 'SET' : 'NOT SET') . "\n";
    echo "   - Sandbox Mode: " . (config('services.mercadopago.sandbox', true) ? 'Yes' : 'No') . "\n";
} else {
    echo "✗ MercadoPago is not active or not found\n";
    exit(1);
}

// 2. Test API endpoint
echo "\n2. Testing MercadoPago API endpoint...\n";
$configUrl = 'http://localhost:8000/api/mercadopago/config';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $configUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✓ API endpoint is responding\n";
    $data = json_decode($response, true);
    if (isset($data['public_key'])) {
        echo "   - Public key returned in API: " . substr($data['public_key'], 0, 20) . "...\n";
    }
} else {
    echo "✗ API endpoint returned HTTP $httpCode\n";
}

// 3. Create a test sale
echo "\n3. Creating test sale...\n";
try {    $testSale = App\Models\Sale::create([
        'code' => 'TEST-' . time(),
        'name' => 'Test',
        'lastname' => 'User',
        'fullname' => 'Test User',
        'email' => 'test@example.com',
        'phone' => '123456789',
        'country' => 'PE',
        'department' => 'Lima',
        'province' => 'Lima',
        'district' => 'Lima',
        'address' => 'Test Address',
        'number' => '123',
        'amount' => 100.00,
        'delivery' => 10.00,
        'status_id' => App\Models\SaleStatus::where('name', 'Pendiente')->first()->id,
        'payment_method_id' => $mercadoPago->id,
        'payment_status' => 'pendiente',
    ]);
    
    echo "✓ Test sale created with ID: {$testSale->id}\n";
    
    // 4. Test preference creation
    echo "\n4. Testing MercadoPago preference creation...\n";
    $controller = new App\Http\Controllers\MercadoPagoController();
      // Create a mock request
    $request = new Illuminate\Http\Request();
    $request->merge([
        'sale_id' => $testSale->id,
        'name' => 'Test',
        'lastname' => 'User',
        'email' => 'test@example.com',
        'phone' => '123456789',
        'address' => 'Test Address',
        'number' => '123',
        'amount' => 100.00,
        'delivery' => 10.00,
        'cart' => [
            [
                'id' => 'test-item',
                'name' => 'Test Product',
                'quantity' => 1,
                'final_price' => 100.00
            ]
        ]
    ]);
      try {
        $preferenceResponse = $controller->createPreference($request);
        $preferenceData = $preferenceResponse->getData(true);
        
        if (isset($preferenceData['status']) && $preferenceData['status']) {
            echo "✓ Preference created successfully\n";
            echo "   - Preference ID: {$preferenceData['preference_id']}\n";
            echo "   - Init Point: {$preferenceData['init_point']}\n";
        } else {
            echo "✗ Preference creation failed: " . ($preferenceData['error'] ?? $preferenceData['message'] ?? 'Unknown error') . "\n";
            echo "   Full response: " . json_encode($preferenceData, JSON_PRETTY_PRINT) . "\n";
        }
    } catch (Exception $e) {
        echo "✗ Exception during preference creation: " . $e->getMessage() . "\n";
        echo "   Trace: " . $e->getTraceAsString() . "\n";
    }
    
    // Clean up test sale
    echo "\n5. Cleaning up test data...\n";
    $testSale->delete();
    echo "✓ Test sale deleted\n";
    
} catch (Exception $e) {
    echo "✗ Error creating test sale: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
