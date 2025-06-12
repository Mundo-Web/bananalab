<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;

try {
    echo "=== CONFIGURANDO MODO SANDBOX COMPLETO ===\n\n";

    $paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();
    if (!$paymentMethod) {
        throw new Exception('MercadoPago no encontrado');
    }

    $config = json_decode($paymentMethod->configuration, true);
    
    echo "🚨 ATENCIÓN: Para usar modo SANDBOX necesitas credenciales de TEST\n";
    echo "Las credenciales actuales son de PRODUCCIÓN:\n";
    echo "- Public Key: " . substr($config['public_key'], 0, 30) . "...\n";
    echo "- Access Token: " . substr($config['access_token'], 0, 30) . "...\n\n";
    
    echo "PASOS OBLIGATORIOS:\n";
    echo "1. Ve a https://www.mercadopago.com.pe/developers/panel/credentials\n";
    echo "2. Inicia sesión con tu cuenta de vendedor\n";
    echo "3. En la sección 'Credenciales de prueba' (TEST), copia:\n";
    echo "   - Public Key (que empiece con TEST-)\n";
    echo "   - Access Token (que empiece con TEST-)\n";
    echo "4. Ejecuta el siguiente comando con las credenciales correctas:\n\n";
    
    echo "php configure_test_credentials.php 'TEST-tu-public-key' 'TEST-tu-access-token'\n\n";
    
    echo "❌ NO se puede configurar modo SANDBOX con credenciales de PRODUCCIÓN\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
