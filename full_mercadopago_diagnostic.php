<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;

try {
    echo "=== DIAGNÓSTICO COMPLETO MERCADOPAGO ===\n\n";

    // 1. Verificar configuración actual
    $paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();
    if (!$paymentMethod) {
        throw new Exception('MercadoPago no encontrado');
    }

    $config = json_decode($paymentMethod->configuration, true);
    
    echo "1. CONFIGURACIÓN ACTUAL:\n";
    echo "   - Public Key: " . substr($config['public_key'], 0, 30) . "...\n";
    echo "   - Access Token: " . substr($config['access_token'], 0, 30) . "...\n";
    echo "   - Es sandbox: " . (($config['sandbox'] ?? false) ? 'SÍ' : 'NO') . "\n";
    echo "   - is_sandbox: " . (($config['is_sandbox'] ?? false) ? 'SÍ' : 'NO') . "\n";
    
    // 2. Verificar tipo de credenciales
    $isTestPublicKey = strpos($config['public_key'], 'TEST-') === 0;
    $isTestAccessToken = strpos($config['access_token'], 'TEST-') === 0;
    
    echo "\n2. TIPO DE CREDENCIALES:\n";
    echo "   - Public Key es TEST: " . ($isTestPublicKey ? 'SÍ' : 'NO') . "\n";
    echo "   - Access Token es TEST: " . ($isTestAccessToken ? 'SÍ' : 'NO') . "\n";
    
    // 3. Verificar consistencia
    echo "\n3. ANÁLISIS DE CONSISTENCIA:\n";
    $isSandboxConfig = $config['sandbox'] ?? false;
    $hasTestCredentials = $isTestPublicKey && $isTestAccessToken;
    
    if ($isSandboxConfig && $hasTestCredentials) {
        echo "   ✅ CORRECTO: Modo sandbox con credenciales TEST\n";
    } elseif (!$isSandboxConfig && !$hasTestCredentials) {
        echo "   ✅ CORRECTO: Modo producción con credenciales REALES\n";
    } else {
        echo "   ❌ INCONSISTENCIA DETECTADA:\n";
        if ($isSandboxConfig && !$hasTestCredentials) {
            echo "      - Modo sandbox pero credenciales de PRODUCCIÓN\n";
            echo "      - ESTO CAUSA ERROR E216\n";
        } elseif (!$isSandboxConfig && $hasTestCredentials) {
            echo "      - Modo producción pero credenciales de TEST\n";
            echo "      - ESTO CAUSA ERRORES DE AUTENTICACIÓN\n";
        }
    }
    
    // 4. Crear preferencia de prueba
    echo "\n4. PRUEBA DE CREACIÓN DE PREFERENCIA:\n";
    
    MercadoPagoConfig::setAccessToken($config['access_token']);
    
    $preferenceData = [
        'items' => [
            [
                'id' => 'test-' . time(),
                'title' => 'Producto Test Diagnóstico',
                'quantity' => 1,
                'unit_price' => 100.00,
                'currency_id' => 'PEN',
            ]
        ],
        'payer' => [
            'name' => 'Test',
            'surname' => 'User',
            'email' => $hasTestCredentials ? 'TESTUSER906372783@testuser.com' : 'test@example.com',
        ],
        'back_urls' => [
            'success' => 'http://localhost:8000/success',
            'failure' => 'http://localhost:8000/failure',
            'pending' => 'http://localhost:8000/pending',
        ],
        'auto_return' => 'approved',
    ];
    
    $client = new PreferenceClient();
    $preference = $client->create($preferenceData);
    
    echo "   ✅ Preferencia creada exitosamente\n";
    echo "   - ID: " . $preference->id . "\n";
    
    if ($hasTestCredentials || $isSandboxConfig) {
        echo "   - Sandbox URL: " . ($preference->sandbox_init_point ?? 'NO DISPONIBLE') . "\n";
    } else {
        echo "   - Production URL: " . ($preference->init_point ?? 'NO DISPONIBLE') . "\n";
    }
    
    // 5. Recomendaciones
    echo "\n5. RECOMENDACIONES:\n";
    
    if ($isSandboxConfig && $hasTestCredentials) {
        echo "   ✅ Todo configurado correctamente para PRUEBAS\n";
        echo "   - Usa tarjetas de prueba de MercadoPago\n";
        echo "   - Usa cuentas de usuario de prueba\n";
        echo "   - Las transacciones son simuladas\n";
    } elseif (!$isSandboxConfig && !$hasTestCredentials) {
        echo "   ✅ Todo configurado correctamente para PRODUCCIÓN\n";
        echo "   - Las transacciones son REALES\n";
        echo "   - Puedes usar cuentas de prueba para testear\n";
        echo "   - Asegúrate de tener webhooks configurados\n";
    } else {
        echo "   🚨 ACCIÓN REQUERIDA:\n";
        if ($isSandboxConfig && !$hasTestCredentials) {
            echo "   - Ejecuta: php configure_test_credentials.php 'TEST-tu-public-key' 'TEST-tu-access-token'\n";
            echo "   - O ejecuta: php configure_production_mode.php\n";
        } else {
            echo "   - Ejecuta: php configure_production_mode.php\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error en diagnóstico: " . $e->getMessage() . "\n";
    echo "Detalles: " . $e->getTraceAsString() . "\n";
}
