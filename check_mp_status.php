<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔍 Verificando estado actual de MercadoPago...\n\n";

try {
    $paymentMethod = App\Models\PaymentMethod::where('slug', 'mercadopago')->first();
    
    if (!$paymentMethod) {
        echo "❌ No se encontró el método de pago MercadoPago\n";
        exit(1);
    }
    
    echo "✅ Método de pago encontrado: {$paymentMethod->name}\n";
    echo "Estado: " . ($paymentMethod->is_active ? 'Activo' : 'Inactivo') . "\n";
      $config = $paymentMethod->configuration;
    
    // Si la configuración es un string JSON, decodificarlo
    if (is_string($config)) {
        $config = json_decode($config, true);
    }
    
    if (!$config) {
        echo "❌ No hay configuración disponible\n";
        exit(1);
    }
    
    echo "\n📄 Configuración actual:\n";
    echo "- Public Key: " . (isset($config['public_key']) ? substr($config['public_key'], 0, 20) . '...' : 'No configurado') . "\n";
    echo "- Access Token: " . (isset($config['access_token']) ? substr($config['access_token'], 0, 20) . '...' : 'No configurado') . "\n";
    echo "- Sandbox: " . ($config['sandbox'] ? 'SÍ' : 'NO') . "\n";
    
    // Test credentials
    if (isset($config['access_token'])) {
        echo "\n🧪 Probando credenciales...\n";
        
        $accessToken = $config['access_token'];
        $url = 'https://api.mercadopago.com/v1/payment_methods';
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "HTTP Code: $httpCode\n";
        
        if ($httpCode == 200) {
            echo "✅ Credenciales válidas\n";
        } else {
            echo "❌ Credenciales inválidas ($httpCode)\n";
            echo "Respuesta: $response\n";
            
            echo "\n📝 Para obtener credenciales válidas:\n";
            echo "1. Ve a https://www.mercadopago.com/developers/\n";
            echo "2. Crea una aplicación\n";
            echo "3. Ve a 'Credenciales' en tu aplicación\n";
            echo "4. Copia el Access Token y Public Key\n";
            echo "5. Ejecuta: php artisan update-mp-credentials\n";
        }
    } else {
        echo "❌ No hay Access Token configurado\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
