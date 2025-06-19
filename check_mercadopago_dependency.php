<?php

// Este script verifica si la dependencia de MercadoPago está instalada y configurada correctamente
echo "========================================================\n";
echo "   Verificando instalación del SDK de MercadoPago\n";
echo "========================================================\n";

// Verificar si el composer.json menciona MercadoPago
$composerPath = __DIR__ . '/composer.json';
if (file_exists($composerPath)) {
    $composer = json_decode(file_get_contents($composerPath), true);
    $hasMercadoPago = false;
    
    if (isset($composer['require'])) {
        foreach ($composer['require'] as $package => $version) {
            if (strpos($package, 'mercadopago') !== false) {
                $hasMercadoPago = true;
                echo "✅ Encontrado en composer.json: $package ($version)\n";
            }
        }
    }
    
    if (!$hasMercadoPago) {
        echo "❌ No se encontró MercadoPago en composer.json\n";
    }
} else {
    echo "❌ No se encontró composer.json\n";
}

// Verificar si la clase está presente
echo "\nVerificando si la clase MercadoPago está disponible:\n";
if (!class_exists('MercadoPago\SDK')) {
    echo "❌ La clase MercadoPago\SDK no está disponible. Ejecuta:\n";
    echo "   composer require \"mercadopago/dx-php\"\n";
} else {
    echo "✅ La clase MercadoPago\SDK está disponible\n";
}

// Verificar las credenciales
echo "\nVerificando credenciales de MercadoPago:\n";

// Incluir la función para cargar el entorno Laravel
require_once __DIR__ . '/vendor/autoload.php';

try {
    $app = require_once __DIR__ . '/bootstrap/app.php';
    $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    
    $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')->first();
    
    if (!$paymentMethod) {
        echo "❌ No se encontró el método de pago 'mercadopago' en la base de datos\n";
    } else {
        echo "✅ Método de pago MercadoPago encontrado (ID: {$paymentMethod->id})\n";
        
        // Verificar configuración
        if (empty($paymentMethod->configuration)) {
            echo "❌ La configuración de MercadoPago está vacía\n";
        } else {            // Obtener configuración directamente de la columna configuration
            $config = $paymentMethod->configuration;
            if (is_string($config)) {
                try {
                    $config = json_decode($config, true);
                } catch (\Exception $e) {
                    $config = [];
                }
            }
            
            if (empty($config)) {
                $config = [];
            }
            
            echo "Configuración almacenada:\n";
            echo "- public_key: " . (isset($config['public_key']) ? substr($config['public_key'], 0, 15) . "..." : "NO PRESENTE") . "\n";
            echo "- access_token: " . (isset($config['access_token']) ? substr($config['access_token'], 0, 15) . "..." : "NO PRESENTE") . "\n";
            echo "- sandbox: " . (isset($config['sandbox']) && $config['sandbox'] ? "true" : "false") . "\n";
            
            if (empty($config['access_token'])) {
                echo "❌ ERROR: El access_token está vacío\n";
            } else {
                echo "No se puede validar el acceso a la API de MercadoPago porque la clase SDK no está disponible.\n";
                echo "Ejecuta 'composer install' o 'composer update' para instalar las dependencias.\n";
            }
        }
    }
} catch (\Exception $e) {
    echo "❌ Error cargando la aplicación Laravel: " . $e->getMessage() . "\n";
}

echo "\n========================================================\n";
echo "            Verificación completada\n";
echo "========================================================\n";
