<?php
require_once 'vendor/autoload.php';

// Bootstrap Laravel
require_once 'bootstrap/app.php';

echo "=== VERIFICANDO CONFIGURACIÓN DE MERCADOPAGO ===\n\n";

try {
    // Verificar método de pago en base de datos
    $mp = \App\Models\PaymentMethod::where('slug', 'mercadopago')->first();
    
    if ($mp) {
        echo "✅ Método MercadoPago encontrado en BD\n";
        echo "- ID: {$mp->id}\n";
        echo "- Nombre: {$mp->name}\n";
        echo "- Activo: " . ($mp->is_active ? 'Sí' : 'No') . "\n";
        echo "- Configuración actual:\n";
        
        $config = json_decode($mp->configuration, true);
        if ($config) {
            foreach ($config as $key => $value) {
                if (in_array($key, ['public_key', 'access_token'])) {
                    echo "  - {$key}: " . (empty($value) ? 'NO CONFIGURADO' : substr($value, 0, 15) . '...') . "\n";
                } else {
                    echo "  - {$key}: {$value}\n";
                }
            }
        } else {
            echo "  ⚠️ Configuración vacía o inválida\n";
        }
    } else {
        echo "❌ Método MercadoPago NO encontrado en BD\n";
    }
    
    echo "\n";
    
    // Verificar variables de entorno
    echo "=== VARIABLES DE ENTORNO ===\n";
    $envVars = [
        'MERCADOPAGO_PUBLIC_KEY' => env('MERCADOPAGO_PUBLIC_KEY'),
        'MERCADOPAGO_ACCESS_TOKEN' => env('MERCADOPAGO_ACCESS_TOKEN'),
    ];
    
    foreach ($envVars as $key => $value) {
        echo "- {$key}: " . (empty($value) ? 'NO CONFIGURADO' : substr($value, 0, 15) . '...') . "\n";
    }
    
    echo "\n=== TESTING API ROUTES ===\n";
    
    // Test route config
    $configUrl = 'http://127.0.0.1:8000/api/mercadopago/config';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $configUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "GET /api/mercadopago/config\n";
    echo "- HTTP Code: {$httpCode}\n";
    if ($response) {
        $data = json_decode($response, true);
        echo "- Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== VERIFICACIÓN COMPLETADA ===\n";
?>
