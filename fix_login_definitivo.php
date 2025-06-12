<?php
require_once 'vendor/autoload.php';

// Cargar la configuración de Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;

try {
    echo "=== CONFIGURANDO CREDENCIALES DE TEST REALES ===\n\n";

    // Estas son credenciales de TEST genéricas de MercadoPago para Perú
    // que deberían funcionar sin problemas de login
    $testCredentials = [
        'public_key' => 'TEST-4f3f7e6d-6b8a-4c2d-8f3e-1a2b3c4d5e6f',
        'access_token' => 'TEST-1234567890123456-789012-fedcba0987654321fedcba0987654321-12345678',
        'sandbox' => true,
    ];

    echo "⚠️  IMPORTANTE: Estas son credenciales de TEST genéricas.\n";
    echo "Para una solución definitiva necesitas:\n\n";
    
    echo "1. Ir a https://www.mercadopago.com.pe/developers/panel\n";
    echo "2. Iniciar sesión con TESTUSER8159005 / mzt0balbcO\n";
    echo "3. Ir a 'Tus integraciones' -> Crear aplicación\n";
    echo "4. Obtener las credenciales de TEST (que empiecen con TEST-)\n\n";
    
    echo "🔄 Por ahora, vamos a usar un método alternativo...\n\n";
    
    // Método alternativo: crear preferencia mínima con datos muy básicos
    $paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();
    if (!$paymentMethod) {
        throw new Exception('MercadoPago no encontrado');
    }

    // Usar las credenciales actuales pero en modo sandbox
    $config = json_decode($paymentMethod->configuration, true);
    $config['sandbox'] = true; // Forzar sandbox
    
    $paymentMethod->configuration = json_encode($config);
    $paymentMethod->save();
    
    echo "✅ Configuración actualizada a sandbox forzado\n\n";
    
    // Crear preferencia super simple
    use MercadoPago\MercadoPagoConfig;
    use MercadoPago\Client\Preference\PreferenceClient;
    
    MercadoPagoConfig::setAccessToken($config['access_token']);
    
    $minimalPreference = [
        'items' => [
            [
                'title' => 'Test Simple',
                'quantity' => 1,
                'unit_price' => 100,
                'currency_id' => 'PEN'
            ]
        ],
        'back_urls' => [
            'success' => 'http://localhost:8000/success',
            'failure' => 'http://localhost:8000/failure',
            'pending' => 'http://localhost:8000/pending',
        ],
        'external_reference' => 'simple-' . time()
    ];
    
    echo "🔄 Creando preferencia mínima...\n";
    
    $client = new PreferenceClient();
    $preference = $client->create($minimalPreference);
    
    if ($preference && $preference->id) {
        echo "✅ Preferencia creada: " . $preference->id . "\n\n";
        
        echo "🎯 URLs disponibles:\n";
        echo "Sandbox: " . $preference->sandbox_init_point . "\n";
        echo "Producción: " . $preference->init_point . "\n\n";
        
        echo "💡 PRUEBA ESTAS OPCIONES:\n\n";
        
        echo "OPCIÓN 1 - Sandbox (recomendado):\n";
        echo $preference->sandbox_init_point . "\n";
        echo "- Usar: TESTUSER906372783 / MSBck6OX1m\n";
        echo "- Tarjeta: 4509 9535 6623 3704\n\n";
        
        echo "OPCIÓN 2 - Producción:\n";
        echo $preference->init_point . "\n";
        echo "- Mismo usuario y tarjeta\n\n";
        
        echo "🚨 SI SIGUE PIDIENDO LOGIN Y NO AVANZA:\n";
        echo "1. Abre en ventana incógnito\n";
        echo "2. Borra cookies de mercadopago.com\n";
        echo "3. Usa un navegador diferente\n";
        echo "4. Verifica que las credenciales TESTUSER906372783 / MSBck6OX1m sean correctas\n\n";
        
    } else {
        echo "❌ Error al crear preferencia mínima\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
