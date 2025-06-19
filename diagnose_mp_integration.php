<?php

// Script para actualizar la configuración del método de pago MercadoPago
// y corregir la estructura en la base de datos

require 'vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "========================================================\n";
echo "     Corrigiendo integración con MercadoPago\n";
echo "========================================================\n";

try {
    // Obtener método de pago
    $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')->first();

    if (!$paymentMethod) {
        die("❌ No se encontró el método de pago 'mercadopago' en la base de datos\n");
    }

    // Mostrar configuración actual
    echo "Configuración actual:\n";
    echo "- configuration_type: " . gettype($paymentMethod->configuration) . "\n";
    
    if (is_string($paymentMethod->configuration)) {
        echo "- configuration (raw): " . $paymentMethod->configuration . "\n";
        $config = json_decode($paymentMethod->configuration, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo "⚠️ Error decodificando JSON: " . json_last_error_msg() . "\n";
        } else {
            echo "- public_key: " . ($config['public_key'] ?? 'NO PRESENTE') . "\n";
            echo "- access_token: " . (isset($config['access_token']) ? substr($config['access_token'], 0, 15) . "..." : "NO PRESENTE") . "\n";
            echo "- sandbox: " . (isset($config['sandbox']) && $config['sandbox'] ? "true" : "false") . "\n";
        }
    } else {
        echo "- public_key: " . ($paymentMethod->configuration['public_key'] ?? 'NO PRESENTE') . "\n";
        echo "- access_token: " . (isset($paymentMethod->configuration['access_token']) ? substr($paymentMethod->configuration['access_token'], 0, 15) . "..." : "NO PRESENTE") . "\n";
        echo "- sandbox: " . (isset($paymentMethod->configuration['sandbox']) && $paymentMethod->configuration['sandbox'] ? "true" : "false") . "\n";
    }

    // Verificar si el controlador está usando la sintaxis correcta
    echo "\nVerificando si el controlador PaymentController.php usa la sintaxis correcta...\n";
    
    $controllerPath = __DIR__ . '/app/Http/Controllers/Api/PaymentController.php';
    if (!file_exists($controllerPath)) {
        echo "⚠️ No se encontró el archivo del controlador en: $controllerPath\n";
    } else {
        $controllerContent = file_get_contents($controllerPath);
        
        $classicSdkPattern = '/\\\\MercadoPago\\\\SDK::setAccessToken/';
        $classicPaymentPattern = '/new \\\\MercadoPago\\\\Payment/';
        $modernClientPattern = '/new \\\\MercadoPago\\\\Client/';
        
        if (preg_match($classicSdkPattern, $controllerContent) || preg_match($classicPaymentPattern, $controllerContent)) {
            echo "⚠️ El controlador usa la sintaxis antigua del SDK v1/v2 (MercadoPago\\SDK o MercadoPago\\Payment)\n";
            echo "   Esto puede causar errores porque la versión instalada (v3.x) usa una API diferente.\n";
        } elseif (preg_match($modernClientPattern, $controllerContent)) {
            echo "✅ El controlador usa la sintaxis moderna del SDK v3 (MercadoPago\\Client)\n";
        } else {
            echo "⚠️ No se encontró ninguna referencia a MercadoPago en el controlador\n";
        }
    }
    
    echo "\n========================================================\n";
    echo "                   Recomendaciones\n";
    echo "========================================================\n";
    echo "1. Actualiza el código del controlador para usar la API v3 de MercadoPago\n";
    echo "2. Para el frontend, asegúrate de usar el método createCardToken correctamente\n";
    echo "3. Revisa la documentación actual: https://www.mercadopago.com.ar/developers/es/docs\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n========================================================\n";
