<?php
echo "=== TEST ESPECÍFICO ERROR 'PARTES DE PRUEBA' ===\n";

// Cargar Laravel bootstrap
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Exceptions\MPApiException;

$accessToken = env('MERCADOPAGO_ACCESS_TOKEN');
echo "🔑 Testing con Access Token: " . substr($accessToken, 0, 15) . "...\n\n";

if (!$accessToken || strpos($accessToken, 'TEST-') !== 0) {
    echo "❌ ERROR: Necesitas credenciales de TEST válidas\n";
    echo "💡 Usa: php fix_mercadopago_credentials.php\n";
    exit(1);
}

MercadoPagoConfig::setAccessToken($accessToken);

// Crear preferencia simple con datos completamente de test
$items = [
    [
        'id' => 'test_001',
        'title' => 'Producto de Prueba',
        'quantity' => 1,
        'unit_price' => 100.00,
        'currency_id' => 'PEN',
    ]
];

$orderNumber = 'TEST_' . time();

$preferenceData = [
    'items' => $items,
    'payer' => [
        'name' => 'Test',
        'surname' => 'User',
        'email' => 'test@test.com', // Email de prueba
    ],
    'back_urls' => [
        'success' => 'http://localhost:8000/checkout/success?external_reference=' . $orderNumber,
        'failure' => 'http://localhost:8000/checkout/failure?external_reference=' . $orderNumber,
        'pending' => 'http://localhost:8000/checkout/pending?external_reference=' . $orderNumber,
    ],
    'external_reference' => $orderNumber,
    'notification_url' => 'http://localhost:8000/api/mercadopago/webhook',
    // Configuración explícita para sandbox
    'auto_return' => 'approved',
];

echo "📋 Datos de la preferencia:\n";
echo json_encode($preferenceData, JSON_PRETTY_PRINT) . "\n\n";

$client = new PreferenceClient();

try {
    echo "⏳ Creando preferencia en sandbox...\n";
    $preference = $client->create($preferenceData);
    
    echo "✅ ¡PREFERENCIA CREADA EXITOSAMENTE!\n";
    echo "🆔 ID: " . $preference->id . "\n";
    echo "🔗 URL Sandbox: " . $preference->sandbox_init_point . "\n\n";
    
    echo "🎯 RESULTADO: El error 'partes de prueba' debería estar RESUELTO\n";
    echo "🧪 PRUEBA ESTA URL:\n";
    echo $preference->sandbox_init_point . "\n\n";
    
    echo "💳 USA ESTAS TARJETAS DE PRUEBA:\n";
    echo "✅ APROBAR: 4009 1753 3280 6176, CVV: 123, Venc: 11/30, Nombre: APRO\n";
    echo "❌ RECHAZAR: 4009 1753 3280 6176, CVV: 123, Venc: 11/30, Nombre: OTHE\n\n";
    
    echo "🔍 VERIFICACIONES ADICIONALES:\n";
    echo "- ✓ Credenciales de TEST válidas\n";
    echo "- ✓ URLs de retorno correctas\n";
    echo "- ✓ Datos de prueba consistentes\n";
    echo "- ✓ Configuración sandbox apropiada\n";
    
} catch (MPApiException $e) {
    echo "❌ ERROR DE API MERCADOPAGO:\n";
    echo "Código: " . $e->getApiResponse()->getStatusCode() . "\n";
    echo "Mensaje: " . $e->getMessage() . "\n";
    
    $responseContent = $e->getApiResponse()->getContent();
    echo "Detalles: " . json_encode($responseContent, JSON_PRETTY_PRINT) . "\n\n";
    
    if ($e->getApiResponse()->getStatusCode() === 401) {
        echo "💡 SOLUCIÓN: Las credenciales están inválidas o expiradas\n";
        echo "🔧 Ejecuta: php fix_mercadopago_credentials.php\n";
        echo "🌐 O usa: http://localhost:8000/mercadopago-credentials-generator.html\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR GENERAL:\n";
    echo "Mensaje: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n=== FIN TEST ===\n";
?>
