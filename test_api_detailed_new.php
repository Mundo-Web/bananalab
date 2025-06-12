<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;

try {
    echo "=== PRUEBA DETALLADA DE API MERCADOPAGO ===\n\n";

    $paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();
    $config = json_decode($paymentMethod->configuration, true);
    
    echo "Configurando SDK...\n";
    MercadoPagoConfig::setAccessToken($config['access_token']);
    
    // Activar logs para debug
    MercadoPagoConfig::setRuntimeEnviroment(MercadoPago\MercadoPagoConfig::LOCAL);
    
    echo "Creando preferencia básica...\n";
    
    $preferenceData = [
        'items' => [
            [
                'id' => 'test-item',
                'title' => 'Test Product',
                'quantity' => 1,
                'unit_price' => 100.00,
                'currency_id' => 'PEN',
            ]
        ],
        'payer' => [
            'email' => 'test@example.com',
        ],
    ];
    
    $client = new PreferenceClient();
    
    try {
        $preference = $client->create($preferenceData);
        echo "✅ Preferencia creada:\n";
        echo "- ID: " . $preference->id . "\n";
        echo "- Init Point: " . ($preference->init_point ?? 'NO DISPONIBLE') . "\n";
        echo "- Sandbox Init Point: " . ($preference->sandbox_init_point ?? 'NO DISPONIBLE') . "\n";
    } catch (Exception $e) {
        echo "❌ Error detallado:\n";
        echo "- Mensaje: " . $e->getMessage() . "\n";
        
        // Verificar si el error contiene información útil
        if (method_exists($e, 'getApiResponse')) {
            $response = $e->getApiResponse();
            echo "- Respuesta API: " . json_encode($response, JSON_PRETTY_PRINT) . "\n";
        }
        
        // Verificar conexión básica a MercadoPago
        echo "\nVerificando conectividad...\n";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/checkout/preferences');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $config['access_token'],
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($preferenceData));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "- Código HTTP: " . $httpCode . "\n";
        echo "- Respuesta RAW: " . $response . "\n";
        
        if ($httpCode === 401) {
            echo "\n🚨 ERROR 401: Credenciales inválidas o expiradas\n";
            echo "- Verifica que el Access Token sea correcto\n";
            echo "- Verifica que no haya expirado\n";
        } elseif ($httpCode === 400) {
            echo "\n🚨 ERROR 400: Datos de la preferencia inválidos\n";
            $responseData = json_decode($response, true);
            if ($responseData && isset($responseData['message'])) {
                echo "- Mensaje: " . $responseData['message'] . "\n";
            }
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error general: " . $e->getMessage() . "\n";
}
