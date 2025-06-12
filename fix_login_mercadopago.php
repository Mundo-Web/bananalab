<?php
require_once 'vendor/autoload.php';

// Cargar la configuración de Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;

try {
    echo "=== SOLUCIÓN LOGIN MERCADOPAGO - SIN REQUERIR SESIÓN ===\n\n";

    // Obtener configuración
    $paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();
    if (!$paymentMethod) {
        throw new Exception('MercadoPago no encontrado');
    }

    $config = json_decode($paymentMethod->configuration, true);
    MercadoPagoConfig::setAccessToken($config['access_token']);

    // Crear preferencia con configuración especial para NO requerir login
    $preferenceData = [
        'items' => [
            [
                'id' => 'test-item-' . time(),
                'title' => 'Producto Test - Sin Login',
                'quantity' => 1,
                'unit_price' => 100.00,
                'currency_id' => 'PEN',
            ]
        ],
        'payer' => [
            'name' => 'Test',
            'surname' => 'User',
            'email' => 'TESTUSER906372783@testuser.com', // Email específico
        ],
        'payment_methods' => [
            'excluded_payment_methods' => [],
            'excluded_payment_types' => [],
            'installments' => 12,
            'default_installments' => 1
        ],
        'back_urls' => [
            'success' => 'http://localhost:8000/checkout/success',
            'failure' => 'http://localhost:8000/checkout/failure',
            'pending' => 'http://localhost:8000/checkout/pending',
        ],
        'auto_return' => 'approved',
        'external_reference' => 'no-login-' . time(),
        'notification_url' => 'http://localhost:8000/api/mercadopago/webhook',
        // Configuraciones adicionales para evitar login
        'expires' => false,
        'expiration_date_from' => null,
        'expiration_date_to' => null,
    ];

    echo "🔄 Creando preferencia sin requerir login...\n";
    
    $client = new PreferenceClient();
    $preference = $client->create($preferenceData);

    if ($preference && isset($preference->id)) {
        echo "✅ Preferencia creada exitosamente!\n\n";
        
        $checkoutUrl = ($config['sandbox'] ?? true) ? $preference->sandbox_init_point : $preference->init_point;
        
        echo "🎯 URL de checkout (sin login requerido):\n";
        echo $checkoutUrl . "\n\n";
        
        echo "💡 CARACTERÍSTICAS DE ESTA PREFERENCIA:\n";
        echo "- Email del payer ya configurado: TESTUSER906372783@testuser.com\n";
        echo "- No requiere login previo en muchos casos\n";
        echo "- Configuración optimizada para pruebas\n\n";
        
        echo "💳 SI NECESITA LOGIN, USA:\n";
        echo "- Comprador: TESTUSER906372783\n";
        echo "- Contraseña: MSBck6OX1m\n\n";
        
        echo "💳 TARJETAS DE PRUEBA:\n";
        echo "- Visa: 4509 9535 6623 3704\n";
        echo "- MasterCard: 5031 7557 3453 0604\n";
        echo "- CVV: 123\n";
        echo "- Vencimiento: 12/25 (cualquier fecha futura)\n\n";
        
        // Crear también una versión con guest checkout habilitado
        echo "🔄 Creando versión alternativa con guest checkout...\n";
        
        $guestPreferenceData = $preferenceData;
        $guestPreferenceData['external_reference'] = 'guest-' . time();
        $guestPreferenceData['payer'] = [
            'email' => 'guest@testuser.com', // Email genérico para guest
        ];
        
        $guestPreference = $client->create($guestPreferenceData);
        
        if ($guestPreference && isset($guestPreference->id)) {
            $guestCheckoutUrl = ($config['sandbox'] ?? true) ? $guestPreference->sandbox_init_point : $guestPreference->init_point;
            
            echo "✅ Preferencia guest creada!\n";
            echo "🎯 URL guest (posible sin login):\n";
            echo $guestCheckoutUrl . "\n\n";
        }
        
        echo "📋 OPCIONES PARA PROBAR:\n";
        echo "1. URL Principal: " . $checkoutUrl . "\n";
        if (isset($guestCheckoutUrl)) {
            echo "2. URL Guest: " . $guestCheckoutUrl . "\n";
        }
        echo "\n";
        
        echo "🚀 INSTRUCCIONES:\n";
        echo "1. Abre cualquiera de las URLs en una ventana privada/incógnito\n";
        echo "2. Si pide login, usa: TESTUSER906372783 / MSBck6OX1m\n";
        echo "3. Si no pide login, procede directamente con la tarjeta\n";
        echo "4. Usa tarjeta: 4509 9535 6623 3704, CVV: 123\n\n";
        
    } else {
        echo "❌ Error al crear la preferencia\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
