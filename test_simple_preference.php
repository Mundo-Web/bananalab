<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Crear una instancia mínima de Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== PROBAR PREFERENCIA SIMPLIFICADA ===\n\n";

try {
    $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')
        ->where('is_active', true)
        ->first();

    $config = json_decode($paymentMethod->configuration, true);
    \MercadoPago\MercadoPagoConfig::setAccessToken($config['access_token']);

    $orderNumber = 'SIMPLE_' . time();
    
    // Preferencia mínima y simple
    $preferenceData = [
        'items' => [
            [
                'id' => 'test_product',
                'title' => 'Producto Simple',
                'quantity' => 1,
                'unit_price' => 100.0,
                'currency_id' => 'PEN',
            ]
        ],
        'payer' => [
            'name' => 'Test',
            'surname' => 'User', 
            'email' => 'test@example.com',
        ],
        'back_urls' => [
            'success' => config('app.url') . '/checkout/success?external_reference=' . $orderNumber . '&payment_type=mercadopago',
            'failure' => config('app.url') . '/checkout/failure?external_reference=' . $orderNumber . '&payment_type=mercadopago',
            'pending' => config('app.url') . '/checkout/pending?external_reference=' . $orderNumber . '&payment_type=mercadopago',
        ],
        'external_reference' => $orderNumber,
        'notification_url' => config('app.url') . '/api/mercadopago/webhook',
    ];

    echo "1. DATOS A ENVIAR (SIMPLIFICADOS):\n";
    echo json_encode($preferenceData, JSON_PRETTY_PRINT) . "\n";

    echo "\n2. INTENTANDO CREAR PREFERENCIA:\n";
    
    try {
        $client = new \MercadoPago\Client\Preference\PreferenceClient();
        $preference = $client->create($preferenceData);
        
        echo "   ✅ ¡PREFERENCIA CREADA EXITOSAMENTE!\n";
        echo "   ID: {$preference->id}\n";
        echo "   Init Point: {$preference->init_point}\n";
        
        if (isset($preference->sandbox_init_point)) {
            echo "   Sandbox Init Point: {$preference->sandbox_init_point}\n";
        }
        
        echo "\n3. PRUEBA DIRECTA DE PAGO:\n";
        $testUrl = $config['sandbox'] ? ($preference->sandbox_init_point ?? $preference->init_point) : $preference->init_point;
        echo "   URL para probar: {$testUrl}\n";
        
        echo "\n✅ ¡PROBLEMA SOLUCIONADO! La configuración está funcionando.\n";
        echo "   Ahora puedes hacer un pago de prueba usando la URL de arriba.\n";
        
    } catch (\MercadoPago\Exceptions\MPApiException $e) {
        echo "   ❌ Error de API:\n";
        echo "   Código: {$e->getApiResponse()->getStatusCode()}\n";
        echo "   Mensaje: {$e->getMessage()}\n";
        $errorData = $e->getApiResponse()->getContent();
        echo "   Detalles: " . json_encode($errorData, JSON_PRETTY_PRINT) . "\n";
        
    } catch (\Exception $e) {
        echo "   ❌ Error general: {$e->getMessage()}\n";
    }

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== FIN ===\n";
