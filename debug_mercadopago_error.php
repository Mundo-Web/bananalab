<?php
echo "=== DEBUG MERCADOPAGO ERROR ===\n";

// Cargar Laravel bootstrap para usar env()
require_once __DIR__ . '/vendor/autoload.php';

// Crear aplicación Laravel mínima para acceder a configuración
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Exceptions\MPApiException;

// Configurar credenciales usando Laravel env()
$accessToken = env('MERCADOPAGO_ACCESS_TOKEN');
echo "🔑 Access Token configurado: " . (strlen($accessToken) > 0 ? "SÍ (" . substr($accessToken, 0, 10) . "...)" : "NO") . "\n";

if (!$accessToken) {
    echo "❌ ERROR: No hay access token configurado\n";
    exit(1);
}

MercadoPagoConfig::setAccessToken($accessToken);

// Crear preferencia simple y válida para sandbox
$items = [
    [
        'id' => 'test_item',
        'title' => 'Producto Test',
        'quantity' => 1,
        'unit_price' => 100.00,
        'currency_id' => 'PEN',
    ]
];

$orderNumber = 'TEST_' . time();

// URLs de retorno válidas
$appUrl = 'http://localhost:8000';

$preferenceData = [
    'items' => $items,
    'payer' => [
        'name' => 'Test',
        'surname' => 'User',
        'email' => 'test@test.com',
    ],
    'back_urls' => [
        'success' => $appUrl . '/checkout/success?external_reference=' . $orderNumber . '&payment_type=mercadopago',
        'failure' => $appUrl . '/checkout/failure?external_reference=' . $orderNumber . '&payment_type=mercadopago',
        'pending' => $appUrl . '/checkout/pending?external_reference=' . $orderNumber . '&payment_type=mercadopago',
    ],
    'external_reference' => $orderNumber,
    'notification_url' => $appUrl . '/api/mercadopago/webhook',
    'auto_return' => 'approved', // Auto-retorno solo para pagos aprobados
];

echo "\n📋 Datos de preferencia:\n";
echo json_encode($preferenceData, JSON_PRETTY_PRINT) . "\n";

// Crear cliente y preferencia
$client = new PreferenceClient();

try {
    echo "\n⏳ Creando preferencia...\n";
    $preference = $client->create($preferenceData);
    
    echo "✅ PREFERENCIA CREADA EXITOSAMENTE!\n";
    echo "🆔 ID: " . $preference->id . "\n";
    echo "🔗 URL Sandbox: " . $preference->sandbox_init_point . "\n";
    echo "🔗 URL Producción: " . $preference->init_point . "\n";
    
    echo "\n🎯 USA ESTA URL PARA PROBAR:\n";
    echo $preference->sandbox_init_point . "\n";
    
    echo "\n💳 TARJETAS DE PRUEBA:\n";
    echo "✅ APROBAR: 4009 1753 3280 7176, CVV: 123, Venc: 11/25, Nombre: APRO\n";
    echo "❌ RECHAZAR: 4000 0000 0000 0002, CVV: 123, Venc: 11/25, Nombre: OTHE\n";
    
    echo "\n📋 DETALLES COMPLETOS DE LA PREFERENCIA:\n";
    echo json_encode($preference, JSON_PRETTY_PRINT) . "\n";
    
} catch (MPApiException $e) {
    echo "❌ ERROR DE API MERCADOPAGO:\n";
    echo "Código: " . $e->getApiResponse()->getStatusCode() . "\n";
    echo "Mensaje: " . $e->getMessage() . "\n";
    echo "Detalles: " . json_encode($e->getApiResponse()->getContent(), JSON_PRETTY_PRINT) . "\n";
} catch (Exception $e) {
    echo "❌ ERROR GENERAL:\n";
    echo "Mensaje: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
}

echo "\n=== FIN DEBUG ===\n";
?>
