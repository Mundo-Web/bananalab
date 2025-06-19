<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔍 DEBUG: Configuración de MercadoPago en la base de datos\n\n";

try {
    $paymentMethod = App\Models\PaymentMethod::where('slug', 'mercadopago')->first();
    
    if (!$paymentMethod) {
        echo "❌ No se encontró el método de pago MercadoPago\n";
        exit(1);
    }
    
    echo "✅ Método de pago encontrado: {$paymentMethod->name}\n";
    echo "Estado: " . ($paymentMethod->is_active ? 'Activo' : 'Inactivo') . "\n\n";
    
    echo "📄 Configuración RAW (directo de la BD):\n";
    echo "Type: " . gettype($paymentMethod->getAttributes()['configuration']) . "\n";
    echo "Value: " . $paymentMethod->getAttributes()['configuration'] . "\n\n";
    
    echo "📋 Configuración PARSED (después del cast):\n";
    $config = $paymentMethod->configuration;
    echo "Type: " . gettype($config) . "\n";
    
    if (is_array($config)) {
        echo "Keys: " . implode(', ', array_keys($config)) . "\n";
        echo "Public Key: " . ($config['public_key'] ?? 'NO ENCONTRADO') . "\n";
        echo "Access Token: " . (isset($config['access_token']) ? substr($config['access_token'], 0, 30) . '...' : 'NO ENCONTRADO') . "\n";
        echo "Sandbox: " . ($config['sandbox'] ? 'SÍ' : 'NO') . "\n";
    } else {
        echo "Config no es array: " . print_r($config, true) . "\n";
    }
    
    echo "\n🔧 Probando getConfig():\n";
    echo "Public Key via getConfig: " . ($paymentMethod->getConfig('public_key') ?: 'NULL') . "\n";
    echo "Access Token via getConfig: " . ($paymentMethod->getConfig('access_token') ? substr($paymentMethod->getConfig('access_token'), 0, 30) . '...' : 'NULL') . "\n";
    echo "Sandbox via getConfig: " . ($paymentMethod->getConfig('sandbox') ? 'SÍ' : 'NO') . "\n";
    
    echo "\n🧪 Probando API endpoint:\n";
    
    // Test local de getMercadoPagoConfig
    $controller = new App\Http\Controllers\Api\PaymentController();
    $response = $controller->getMercadoPagoConfig();
    $responseData = json_decode($response->getContent(), true);
    
    echo "Respuesta API:\n";
    echo json_encode($responseData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
