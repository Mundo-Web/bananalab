<?php
require_once 'vendor/autoload.php';

// Cargar la configuración de Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;

try {
    echo "=== TEST PREFERENCIA CON EMAIL CORRECTO DE COMPRADOR ===\n\n";

    // Obtener configuración de MercadoPago
    $paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();
    if (!$paymentMethod) {
        throw new Exception('MercadoPago no está configurado');
    }

    $config = json_decode($paymentMethod->configuration, true);
    
    echo "📋 Configuración actual:\n";
    echo "- Public Key: " . $config['public_key'] . "\n";
    echo "- Access Token: " . substr($config['access_token'], 0, 20) . "...\n";
    echo "- Sandbox: " . ($config['sandbox'] ? 'SÍ' : 'NO') . "\n\n";

    // Configurar SDK
    MercadoPagoConfig::setAccessToken($config['access_token']);

    // Datos de prueba con EMAIL CORRECTO del comprador
    $preferenceData = [
        'items' => [
            [
                'id' => 'test-item-1',
                'title' => 'Producto de Prueba BananaLab',
                'quantity' => 1,
                'unit_price' => 100.00,
                'currency_id' => 'PEN',
            ]
        ],
        'payer' => [
            'name' => 'Test',
            'surname' => 'User',
            'email' => 'TESTUSER906372783@testuser.com',  // EMAIL CORRECTO DEL COMPRADOR
        ],
        'back_urls' => [
            'success' => 'http://localhost:8000/checkout/success',
            'failure' => 'http://localhost:8000/checkout/failure',
            'pending' => 'http://localhost:8000/checkout/pending',
        ],
        'external_reference' => 'TEST-' . time(),
        'notification_url' => 'http://localhost:8000/api/mercadopago/webhook',
    ];

    echo "📤 Datos de la preferencia:\n";
    echo json_encode($preferenceData, JSON_PRETTY_PRINT) . "\n\n";

    // Crear preferencia
    echo "🔄 Creando preferencia...\n";
    $client = new PreferenceClient();
    $preference = $client->create($preferenceData);

    if ($preference && isset($preference->id)) {
        echo "✅ Preferencia creada exitosamente!\n\n";
        echo "📊 Detalles de la preferencia:\n";
        echo "- ID: " . $preference->id . "\n";
        echo "- Init Point: " . $preference->init_point . "\n";
        echo "- Sandbox Init Point: " . $preference->sandbox_init_point . "\n";
        echo "- External Reference: " . $preference->external_reference . "\n\n";

        echo "🎯 URLS PARA USAR EN FRONTEND:\n";
        echo "- Para SANDBOX: " . $preference->sandbox_init_point . "\n";
        echo "- Para PRODUCCIÓN: " . $preference->init_point . "\n\n";

        echo "👤 DATOS DE PRUEBA PARA USAR:\n";
        echo "- Vendedor: TESTUSER8159005 / mzt0balbcO\n";
        echo "- Comprador: TESTUSER906372783 / MSBck6OX1m\n";
        echo "- Email en preferencia: TESTUSER906372783@testuser.com\n\n";

        echo "💳 TARJETAS DE PRUEBA OFICIALES:\n";
        echo "- Visa: 4509 9535 6623 3704\n";
        echo "- MasterCard: 5031 7557 3453 0604\n";
        echo "- CVV: 123, Vencimiento: cualquier fecha futura\n\n";

        echo "🚀 SIGUIENTE PASO:\n";
        echo "1. Abrir en navegador: " . $preference->sandbox_init_point . "\n";
        echo "2. Usar datos del COMPRADOR: TESTUSER906372783 / MSBck6OX1m\n";
        echo "3. Usar una tarjeta de prueba oficial\n";
        echo "4. Verificar que el pago se procese sin errores\n";

    } else {
        echo "❌ Error: No se pudo crear la preferencia\n";
        print_r($preference);
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
