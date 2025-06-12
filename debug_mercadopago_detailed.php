<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Crear una instancia mínima de Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== DEBUG DETALLADO MERCADOPAGO ===\n\n";

try {
    // 1. Verificar configuración de MercadoPago
    echo "1. VERIFICANDO CONFIGURACIÓN DE MERCADOPAGO:\n";
    $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')
        ->where('is_active', true)
        ->first();

    if (!$paymentMethod) {
        echo "   ❌ MercadoPago no está disponible\n";
        exit;
    }

    $config = json_decode($paymentMethod->configuration, true);
    echo "   ✅ MercadoPago activo\n";
    echo "   Access Token: " . substr($config['access_token'], 0, 20) . "...\n";
    echo "   Public Key: " . substr($config['public_key'], 0, 20) . "...\n";
    echo "   Sandbox: " . ($config['sandbox'] ? 'Sí' : 'No') . "\n";

    // 2. Configurar SDK de MercadoPago
    echo "\n2. CONFIGURANDO SDK DE MERCADOPAGO:\n";
    \MercadoPago\MercadoPagoConfig::setAccessToken($config['access_token']);
    echo "   ✅ SDK configurado\n";

    // 3. Crear una preferencia de prueba simplificada
    echo "\n3. CREANDO PREFERENCIA DE PRUEBA:\n";
    
    $orderNumber = 'TEST_' . time();
    
    // Datos mínimos para preferencia
    $preferenceData = [
        'items' => [
            [
                'id' => 'test_product',
                'title' => 'Producto de Prueba',
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
            'success' => config('app.url') . '/checkout/success?external_reference=' . $orderNumber,
            'failure' => config('app.url') . '/checkout/failure?external_reference=' . $orderNumber,
            'pending' => config('app.url') . '/checkout/pending?external_reference=' . $orderNumber,
        ],
        'external_reference' => $orderNumber,
        'notification_url' => config('app.url') . '/api/mercadopago/webhook',
        'auto_return' => 'approved',
    ];

    echo "   Datos a enviar:\n";
    echo "   " . json_encode($preferenceData, JSON_PRETTY_PRINT) . "\n";

    // 4. Intentar crear la preferencia
    echo "\n4. INTENTANDO CREAR PREFERENCIA:\n";
    
    try {
        $client = new \MercadoPago\Client\Preference\PreferenceClient();
        $preference = $client->create($preferenceData);
        
        echo "   ✅ Preferencia creada exitosamente!\n";
        echo "   ID: {$preference->id}\n";
        echo "   Init Point: {$preference->init_point}\n";
        echo "   Sandbox Init Point: {$preference->sandbox_init_point}\n";
        
    } catch (\MercadoPago\Exceptions\MPApiException $e) {
        echo "   ❌ Error de API de MercadoPago:\n";
        echo "   Código: {$e->getApiResponse()->getStatusCode()}\n";
        echo "   Mensaje: {$e->getMessage()}\n";
        echo "   Respuesta completa:\n";
        var_dump($e->getApiResponse()->getContent());
        
    } catch (\Exception $e) {
        echo "   ❌ Error general:\n";
        echo "   Mensaje: {$e->getMessage()}\n";
        echo "   Línea: {$e->getLine()}\n";
        echo "   Archivo: {$e->getFile()}\n";
    }

    // 5. Verificar credenciales directamente con MercadoPago
    echo "\n5. VERIFICANDO CREDENCIALES CON MERCADOPAGO:\n";
    
    try {
        // Hacer una llamada simple para verificar las credenciales
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => 'https://api.mercadopago.com/users/me',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $config['access_token'],
                'Content-Type: application/json',
            ],
        ]);
        
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        
        if ($httpCode === 200) {
            $user = json_decode($response, true);
            echo "   ✅ Credenciales válidas\n";
            echo "   Usuario ID: {$user['id']}\n";
            echo "   Email: {$user['email']}\n";
            echo "   País: {$user['site_id']}\n";
        } else {
            echo "   ❌ Credenciales inválidas (HTTP {$httpCode})\n";
            echo "   Respuesta: {$response}\n";
        }
        
    } catch (\Exception $e) {
        echo "   ❌ Error verificando credenciales: {$e->getMessage()}\n";
    }

} catch (\Exception $e) {
    echo "❌ Error general: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== FIN DEL DEBUG ===\n";
