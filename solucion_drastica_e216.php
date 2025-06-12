<?php
require_once 'vendor/autoload.php';

// Cargar la configuración de Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;

try {
    echo "=== SOLUCIÓN DRÁSTICA - MODO PRODUCCIÓN CON EMAIL DE PRUEBA ===\n\n";

    // Configurar MercadoPago en modo PRODUCCIÓN pero con email de prueba forzado
    $paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();
    if (!$paymentMethod) {
        throw new Exception('MercadoPago no encontrado en base de datos');
    }

    $productionConfig = [
        'public_key' => 'APP_USR-4aea3c0f-996b-430e-8545-b7b1335b2160',
        'access_token' => 'APP_USR-4609187540698040-061123-a53c80b6e589d4ae3bce3f39f0f7f562-2489869845',
        'sandbox' => false,  // PRODUCCIÓN
        'force_test_email' => true,  // Forzar email de prueba aunque esté en producción
    ];

    $paymentMethod->configuration = json_encode($productionConfig);
    $paymentMethod->save();

    echo "✅ Configuración cambiada a PRODUCCIÓN con email de prueba forzado\n\n";

    // Test inmediato
    echo "🔄 Probando preferencia en modo producción...\n";
    
    $testData = [
        'name' => 'Test',
        'lastname' => 'User',
        'email' => 'cualquier@email.com', // Será reemplazado por el controlador
        'phone' => '987654321',
        'amount' => 100.00,
        'title' => 'Test Producción con Email Prueba',
        'description' => 'Solución drástica E216'
    ];

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

    if ($httpCode === 200) {
        $responseData = json_decode($response, true);
        
        if ($responseData && $responseData['status']) {
            echo "✅ ¡PREFERENCIA CREADA EXITOSAMENTE EN PRODUCCIÓN!\n\n";
            echo "🎯 URL para probar (PRODUCCIÓN): " . $responseData['init_point'] . "\n\n";
            
            echo "⚠️  IMPORTANTE:\n";
            echo "- Esto es ambiente de PRODUCCIÓN\n";
            echo "- Usa la cuenta de comprador: TESTUSER906372783 / MSBck6OX1m\n";
            echo "- Email forzado: TESTUSER906372783@testuser.com\n";
            echo "- Este debería funcionar sin error E216\n\n";
            
            echo "💳 TARJETAS DE PRUEBA:\n";
            echo "- Visa: 4509 9535 6623 3704\n";
            echo "- MasterCard: 5031 7557 3453 0604\n";
            echo "- CVV: 123, Vencimiento: cualquier fecha futura\n\n";
            
            echo "🚨 ADVERTENCIA: Aunque sea ambiente de producción,\n";
            echo "   está configurado para usar email de prueba automáticamente.\n";
            echo "   NO deberías ver error E216 ahora.\n\n";
            
            echo "🔗 ABRIR EN NAVEGADOR:\n";
            echo $responseData['init_point'] . "\n\n";
            
        } else {
            echo "❌ Error en la respuesta del servidor\n";
            echo "Respuesta: $response\n";
        }
    } else {
        echo "❌ Error HTTP: $httpCode\n";
        echo "Respuesta: $response\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
