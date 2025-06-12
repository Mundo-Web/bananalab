<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Crear una instancia mínima de Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== PROBAR CORRECCIÓN MERCADOPAGO ===\n\n";

try {
    $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')
        ->where('is_active', true)
        ->first();

    $config = json_decode($paymentMethod->configuration, true);
    \MercadoPago\MercadoPagoConfig::setAccessToken($config['access_token']);

    $orderNumber = 'CORRECTED_' . time();
    
    // Datos corregidos para preferencia
    $preferenceData = [
        'items' => [
            [
                'id' => 'test_product',
                'title' => 'Producto de Prueba Corregido',
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
        'auto_return' => 'approved',
        'external_reference' => $orderNumber,
        'notification_url' => config('app.url') . '/api/mercadopago/webhook',
        'expires' => false,
    ];

    echo "1. INTENTANDO CREAR PREFERENCIA CORREGIDA:\n";
    
    try {
        $client = new \MercadoPago\Client\Preference\PreferenceClient();
        $preference = $client->create($preferenceData);
        
        echo "   ✅ ¡PREFERENCIA CREADA EXITOSAMENTE!\n";
        echo "   ID: {$preference->id}\n";
        echo "   Init Point: {$preference->init_point}\n";
        echo "   Sandbox Init Point: {$preference->sandbox_init_point}\n";
        
        echo "\n2. URLS DE PRUEBA:\n";
        echo "   Sandbox (recomendado): {$preference->sandbox_init_point}\n";
        echo "   Producción: {$preference->init_point}\n";
        
        echo "\n✅ ¡PROBLEMA SOLUCIONADO! Ahora MercadoPago debería funcionar correctamente.\n";
        
    } catch (\MercadoPago\Exceptions\MPApiException $e) {
        echo "   ❌ Aún hay error de API:\n";
        echo "   Código: {$e->getApiResponse()->getStatusCode()}\n";
        echo "   Mensaje: {$e->getMessage()}\n";
        var_dump($e->getApiResponse()->getContent());
        
    } catch (\Exception $e) {
        echo "   ❌ Error general: {$e->getMessage()}\n";
    }

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== FIN ===\n";
