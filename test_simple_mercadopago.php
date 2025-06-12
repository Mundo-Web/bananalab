<?php
require_once 'vendor/autoload.php';

// Cargar la configuración de Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    echo "=== TEST SIMPLE MERCADOPAGO - SIN CARRITO ===\n\n";

    // Test del endpoint /api/mercadopago/create-preference con datos mínimos
    echo "🔄 Creando preferencia con datos mínimos...\n";
    
    $testData = [
        'name' => 'Test',
        'lastname' => 'User',
        'email' => 'test@example.com',
        'phone' => '987654321',
        'amount' => 100.00,
        'title' => 'Test BananaLab Simple',
        'description' => 'Prueba simple sin carrito'
    ];

    echo "📤 Datos enviados:\n";
    echo json_encode($testData, JSON_PRETTY_PRINT) . "\n\n";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/mercadopago/create-preference');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "📥 Respuesta HTTP: $httpCode\n";
    echo "📄 Respuesta completa:\n";
    echo $response . "\n\n";

    if ($httpCode === 200) {
        $responseData = json_decode($response, true);
        
        if ($responseData && $responseData['status']) {
            echo "✅ ¡ÉXITO! Preferencia creada correctamente\n\n";
            echo "🎯 URLs de prueba:\n";
            echo "Sandbox: " . $responseData['sandbox_init_point'] . "\n";
            echo "Producción: " . $responseData['init_point'] . "\n\n";
            
            echo "👤 Credenciales para probar:\n";
            echo "Comprador: TESTUSER906372783 / MSBck6OX1m\n";
            echo "Email automático: TESTUSER906372783@testuser.com\n\n";
            
            echo "💳 Tarjetas de prueba:\n";
            echo "Visa: 4509 9535 6623 3704\n";
            echo "MasterCard: 5031 7557 3453 0604\n";
            echo "CVV: 123, Vencimiento: cualquier fecha futura\n\n";
            
            echo "🚀 INSTRUCCIONES:\n";
            echo "1. Abrir: " . $responseData['sandbox_init_point'] . "\n";
            echo "2. Iniciar sesión con TESTUSER906372783 / MSBck6OX1m\n";
            echo "3. Usar tarjeta de prueba\n";
            echo "4. Verificar que NO aparezca error E216\n";
        } else {
            echo "❌ Error en la respuesta del servidor\n";
        }
    } else {
        echo "❌ Error HTTP: $httpCode\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
