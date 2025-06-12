<?php
require_once 'vendor/autoload.php';

// Cargar la configuración de Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;

try {
    echo "=== ACTUALIZANDO CREDENCIALES DE MERCADOPAGO ===\n\n";

    // Buscar el método de pago MercadoPago
    $paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();

    if (!$paymentMethod) {
        echo "❌ No se encontró el método de pago MercadoPago\n";
        exit(1);
    }

    // Nuevas credenciales proporcionadas por el usuario
    $newConfig = [
        'public_key' => 'APP_USR-4aea3c0f-996b-430e-8545-b7b1335b2160',
        'access_token' => 'APP_USR-4609187540698040-061123-a53c80b6e589d4ae3bce3f39f0f7f562-2489869845',
        'client_id' => '4609187540698040',
        'client_secret' => 'ZjHUSayL093WnLuAoPz0iu2ISkpmj0pj',
        'sandbox' => true,  // Importante: mantener en sandbox
    ];

    // Actualizar configuración
    $paymentMethod->configuration = json_encode($newConfig);
    $paymentMethod->save();

    echo "✅ Credenciales actualizadas exitosamente:\n";
    echo "- Public Key: " . $newConfig['public_key'] . "\n";
    echo "- Access Token: " . substr($newConfig['access_token'], 0, 20) . "...\n";
    echo "- Client ID: " . $newConfig['client_id'] . "\n";
    echo "- Sandbox: " . ($newConfig['sandbox'] ? 'SÍ' : 'NO') . "\n\n";

    echo "=== VERIFICANDO CREDENCIALES ===\n";
    
    // Verificar que las credenciales están guardadas correctamente
    $paymentMethod->refresh();
    $savedConfig = json_decode($paymentMethod->configuration, true);
    
    if ($savedConfig['public_key'] === $newConfig['public_key']) {
        echo "✅ Public Key guardado correctamente\n";
    } else {
        echo "❌ Error al guardar Public Key\n";
    }
    
    if ($savedConfig['access_token'] === $newConfig['access_token']) {
        echo "✅ Access Token guardado correctamente\n";
    } else {
        echo "❌ Error al guardar Access Token\n";
    }

    echo "\n=== NOTAS IMPORTANTES ===\n";
    echo "- Vendedor: TESTUSER8159005\n";
    echo "- Comprador: TESTUSER906372783 (email: TESTUSER906372783@testuser.com)\n";
    echo "- Las credenciales son de PRODUCCIÓN pero se usan en SANDBOX\n";
    echo "- El payer.email en la preferencia debe ser exactamente: TESTUSER906372783@testuser.com\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
