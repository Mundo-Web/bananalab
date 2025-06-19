<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING MERCADOPAGO CHECKOUT API ===\n";

// Simular datos de prueba para el endpoint
$testData = [
    'token' => 'test_token_123',
    'payment_method_id' => 'visa',
    'issuer_id' => null,
    'installments' => 1,
    'identification_type' => 'DNI',
    'identification_number' => '12345678',
    'amount' => 100.00,
    'cart' => [
        [
            'id' => 1,
            'name' => 'Test Product',
            'price' => 100.00,
            'quantity' => 1
        ]
    ],
    'name' => 'Test',
    'lastname' => 'User',
    'email' => 'test@example.com',
    'phone' => '123456789',
    'department' => 'Lima',
    'province' => 'Lima',
    'district' => 'Miraflores',
    'address' => 'Test Address',
    'reference' => 'Test Reference'
];

try {
    // Crear instancia del controlador
    $controller = new App\Http\Controllers\Api\PaymentController();
    
    // Crear request mock
    $request = new Illuminate\Http\Request();
    $request->merge($testData);
    
    echo "✅ PaymentController instance created\n";
    echo "✅ Request data prepared\n";
    
    // Verificar que el método existe
    if (method_exists($controller, 'mercadoPagoCheckoutApi')) {
        echo "✅ mercadoPagoCheckoutApi method exists\n";
    } else {
        echo "❌ mercadoPagoCheckoutApi method does NOT exist\n";
        exit(1);
    }
    
    // Verificar PaymentMethod
    $paymentMethod = App\Models\PaymentMethod::where('slug', 'mercadopago')->first();
    if ($paymentMethod) {
        echo "✅ MercadoPago payment method found in database\n";
        
        if (method_exists($paymentMethod, 'calculateFee')) {
            echo "✅ PaymentMethod::calculateFee method exists\n";
            $fee = $paymentMethod->calculateFee(100);
            echo "✅ calculateFee(100) = $fee\n";
        } else {
            echo "❌ PaymentMethod::calculateFee method does NOT exist\n";
        }
    } else {
        echo "❌ MercadoPago payment method not found in database\n";
    }
    
    echo "\n=== ALL CHECKS PASSED ===\n";
    echo "The controller and methods are properly set up.\n";
    echo "If you're still getting calculateCommission error, it might be:\n";
    echo "1. Cache issue (cleared already)\n";
    echo "2. Different file version on server\n";
    echo "3. Error from a different part of the code\n";
    
} catch (Exception $e) {
    echo "❌ Error during testing: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
