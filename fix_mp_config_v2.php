<?php


require_once 'vendor/autoload.php';
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔧 REPARANDO configuración de MercadoPago (método directo)...\n\n";

try {
    // Usar DB directo para forzar actualización
    $rawConfig = DB::table('payment_methods')
        ->where('slug', 'mercadopago')
        ->value('configuration');
    
    echo "📄 Config RAW actual: $rawConfig\n";
    
    // Decodificar
    $configArray = json_decode($rawConfig, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "❌ Error decodificando JSON: " . json_last_error_msg() . "\n";
        exit(1);
    }
    
    echo "📋 Config decodificado (print_r):\n";
    print_r($configArray);
    
    echo "- Public Key: ";
    var_dump(isset($configArray['public_key']) ? $configArray['public_key'] : 'NO ENCONTRADO');
    echo "- Access Token: ";
    var_dump(isset($configArray['access_token']) ? $configArray['access_token'] : 'NO ENCONTRADO');
    echo "- Sandbox: ";
    var_dump(isset($configArray['sandbox']) ? $configArray['sandbox'] : 'NO ENCONTRADO');
    
    // Actualizar usando Eloquent para que el cast funcione
    $paymentMethod = App\Models\PaymentMethod::where('slug', 'mercadopago')->first();
    $paymentMethod->configuration = $configArray;
    $paymentMethod->save();
    echo "\n✅ Configuración actualizada usando Eloquent\n";
    $paymentMethod->refresh();
    echo "\n🔍 Verificando con el modelo:\n";
    echo "Config type: " . gettype($paymentMethod->configuration) . "\n";
    if (is_array($paymentMethod->configuration)) {
        echo "✅ Config es array correctamente\n";
        echo "Public Key: " . ($paymentMethod->getConfig('public_key') ?: 'NULL') . "\n";
        echo "Access Token: " . ($paymentMethod->getConfig('access_token') ? substr($paymentMethod->getConfig('access_token'), 0, 30) . '...' : 'NULL') . "\n";
        echo "Sandbox: " . ($paymentMethod->getConfig('sandbox') ? 'SÍ' : 'NO') . "\n";
    } else {
        echo "❌ Config sigue siendo string: " . $paymentMethod->configuration . "\n";
    }
    
    // Test final del endpoint API
    echo "\n🧪 Probando API endpoint:\n";
    $controller = new App\Http\Controllers\Api\PaymentController();
    $response = $controller->getMercadoPagoConfig();
    $responseData = json_decode($response->getContent(), true);
    
    echo "Respuesta API:\n";
    echo json_encode($responseData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
