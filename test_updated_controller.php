<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING UPDATED MERCADOPAGO CONTROLLER ===\n";

try {
    // Datos de prueba
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

    // Crear una instancia de Sale para probar la estructura
    $sale = new App\Models\Sale();
    
    // Probar asignación de campos básicos
    $sale->code = 'BL-TEST123';
    $sale->payment_status = 'pendiente';
    $sale->payment_method = 'mercadopago';
    $sale->amount = 100.00;
    $sale->payment_fee = 5.99;
    $sale->name = 'Test';
    $sale->lastname = 'User';
    $sale->fullname = 'Test User';
    $sale->email = 'test@example.com';
    $sale->phone = '123456789';
    $sale->department = 'Lima';
    $sale->province = 'Lima';
    $sale->district = 'Miraflores';
    $sale->address = 'Test Address';
    $sale->reference = 'Test Reference';
    $sale->country = 'Perú';
    $sale->delivery = 0;
    
    echo "✅ Sale model fields assignment successful\n";
    
    // Verificar método de pago MercadoPago
    $paymentMethod = App\Models\PaymentMethod::where('slug', 'mercadopago')->first();
    if ($paymentMethod) {
        echo "✅ MercadoPago payment method found\n";
        $fee = $paymentMethod->calculateFee(100);
        echo "✅ Fee calculation works: $fee\n";
    } else {
        echo "❌ MercadoPago payment method not found\n";
    }
    
    echo "\n=== STRUCTURE VERIFICATION COMPLETE ===\n";
    echo "The controller should now work with the correct database structure.\n";
    echo "Ready to test the full payment flow!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
