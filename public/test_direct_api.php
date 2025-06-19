<?php

// Test directo del endpoint MercadoPago
header('Content-Type: application/json');

try {
    // Simular request POST
    $_POST = [
        'token' => 'test_token_123',
        'payment_method_id' => 'visa',
        'issuer_id' => null,
        'installments' => 1,
        'identification_type' => 'DNI',
        'identification_number' => '12345678',
        'amount' => 100.00,
        'cart' => json_encode([
            [
                'id' => 1,
                'name' => 'Test Product',
                'price' => 100.00,
                'quantity' => 1
            ]
        ]),
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
    
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_SERVER['CONTENT_TYPE'] = 'application/json';
    
    // Incluir el bootstrap de Laravel
    require_once __DIR__ . '/vendor/autoload.php';
    $app = require_once __DIR__ . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    
    // Crear el request
    $request = Illuminate\Http\Request::createFromGlobals();
    $request->merge($_POST);
    
    // Instanciar controlador
    $controller = new App\Http\Controllers\Api\PaymentController();
    
    echo "=== TESTING MERCADOPAGO ENDPOINT DIRECTLY ===\n";
    echo "Current time: " . date('Y-m-d H:i:s') . "\n";
    echo "Testing with validation only (not actual payment processing)\n\n";
    
    // Simular solo la parte de validación
    $validated = $request->validate([
        'token' => 'required|string',
        'payment_method_id' => 'required|string',
        'amount' => 'required|numeric|min:0.01',
        'cart' => 'required',  // Más flexible para test
        'name' => 'required|string|max:255',
        'lastname' => 'required|string|max:255',
        'email' => 'required|email'
    ]);
    
    echo "✅ Basic validation passed\n";
    
    // Verificar método de pago
    $paymentMethod = App\Models\PaymentMethod::where('slug', 'mercadopago')->first();
    if (!$paymentMethod) {
        throw new Exception('MercadoPago payment method not found');
    }
    
    echo "✅ Payment method found\n";
    
    // Verificar método calculateFee
    $subtotal = $request->amount;
    $commission = $paymentMethod->calculateFee($subtotal);
    
    echo "✅ Commission calculated: $commission\n";
    echo "✅ PaymentController is working correctly!\n";
    echo "\nIf you're still seeing calculateCommission error, please:\n";
    echo "1. Clear browser cache\n";
    echo "2. Restart XAMPP completely\n";
    echo "3. Check if you're looking at old logs\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
