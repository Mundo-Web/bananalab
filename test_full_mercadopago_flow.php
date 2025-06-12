<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Crear una instancia mínima de Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== TEST COMPLETO MERCADOPAGO COMO FRONTEND ===\n\n";

try {
    // Simular exactamente lo que envía el frontend
    $checkoutData = [
        'name' => 'Test',
        'lastname' => 'User',
        'email' => 'test@example.com',
        'phone' => '123456789',
        'country' => 'PE',
        'department' => 'Lima',
        'province' => 'Lima',
        'district' => 'Miraflores',
        'address' => 'Av Test 123',
        'number' => '123',
        'reference' => 'Cerca al parque',
        'comment' => 'Comentario de prueba',
        'amount' => 200,
        'delivery' => 0,
        'cart' => [
            [
                'id' => '9f15b4ab-a14b-4083-8b15-5f2269fc9768',
                'name' => 'Producto 1',
                'final_price' => 200,
                'quantity' => 1
            ]
        ],
        'payment_method' => 'mercadopago'
    ];

    // Crear el request como lo haría Laravel
    $request = new Request();
    $request->merge([
        'amount' => 200,
        'title' => 'Compra BananaLab', 
        'description' => 'Productos BananaLab',
        'checkout_data' => $checkoutData
    ]);

    // Simular todos los campos que el controlador espera
    $request->merge($checkoutData);

    echo "1. SIMULANDO LLAMADA DEL FRONTEND:\n";
    echo "   Amount: {$request->amount}\n";
    echo "   Customer: {$request->name} {$request->lastname}\n";
    echo "   Email: {$request->email}\n";

    // Instanciar el controlador
    $controller = new \App\Http\Controllers\MercadoPagoController();
    
    echo "\n2. EJECUTANDO CREATEPREFERENCE:\n";
    $response = $controller->createPreference($request);
    $responseData = $response->getData(true);
    
    echo "   Status Code: {$response->getStatusCode()}\n";
    
    if ($response->getStatusCode() === 200) {
        echo "   ✅ ÉXITO! Preferencia creada:\n";
        echo "   Preference ID: {$responseData['preference_id']}\n";
        echo "   Order Number: {$responseData['orderNumber']}\n";
        
        if (isset($responseData['sandbox_init_point'])) {
            echo "   Sandbox URL: {$responseData['sandbox_init_point']}\n";
        }
        if (isset($responseData['init_point'])) {
            echo "   Production URL: {$responseData['init_point']}\n";
        }
        
        echo "\n🎯 URL PARA PROBAR EL PAGO:\n";
        $testUrl = $responseData['sandbox_init_point'] ?? $responseData['init_point'] ?? $responseData['redirect_url'];
        echo "   {$testUrl}\n";
        
        echo "\n✅ ¡PROBLEMA SOLUCIONADO!\n";
        echo "   Usa esta URL para probar el pago con las tarjetas de sandbox.\n";
        
    } else {
        echo "   ❌ ERROR:\n";
        echo "   Message: {$responseData['message']}\n";
        if (isset($responseData['error'])) {
            echo "   Error: {$responseData['error']}\n";
        }
    }

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}

echo "\n=== TARJETAS DE PRUEBA SANDBOX ===\n";
echo "✅ PARA APROBAR:\n";
echo "   Visa: 4009 1753 3280 7176\n";
echo "   CVV: 123\n"; 
echo "   Vencimiento: 11/25\n";
echo "   Nombre: APRO\n";

echo "\n❌ PARA RECHAZAR:\n";
echo "   Visa: 4000 0000 0000 0002\n";
echo "   CVV: 123\n";
echo "   Vencimiento: 11/25\n"; 
echo "   Nombre: OTHE\n";

echo "\n=== FIN ===\n";
