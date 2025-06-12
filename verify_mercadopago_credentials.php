<?php
echo "=== VERIFICACIÓN CREDENCIALES MERCADOPAGO ===\n";

// Cargar Laravel bootstrap
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$publicKey = env('MERCADOPAGO_PUBLIC_KEY');
$accessToken = env('MERCADOPAGO_ACCESS_TOKEN');

echo "📋 CREDENCIALES CONFIGURADAS:\n";
echo "🔑 Public Key: " . ($publicKey ? substr($publicKey, 0, 20) . "..." : "NO CONFIGURADO") . "\n";
echo "🔑 Access Token: " . ($accessToken ? substr($accessToken, 0, 20) . "..." : "NO CONFIGURADO") . "\n";

// Verificar si son credenciales de test
$isTestPublicKey = $publicKey && strpos($publicKey, 'TEST-') === 0;
$isTestAccessToken = $accessToken && strpos($accessToken, 'TEST-') === 0;

echo "\n🧪 VERIFICACIÓN ENTORNO:\n";
echo "✓ Public Key es de TEST: " . ($isTestPublicKey ? "SÍ" : "NO") . "\n";
echo "✓ Access Token es de TEST: " . ($isTestAccessToken ? "SÍ" : "NO") . "\n";

if (!$isTestPublicKey || !$isTestAccessToken) {
    echo "\n❌ PROBLEMA DETECTADO: Las credenciales deben ser de TEST para sandbox\n";
    echo "\n📋 CREDENCIALES DE TEST CORRECTAS (ejemplo):\n";
    echo "MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\n";
    echo "MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx\n";
    echo "\n🔗 Obtén tus credenciales de test en:\n";
    echo "https://www.mercadopago.com.pe/developers/panel/app\n";
    echo "Sección: Credenciales de prueba\n";
}

// Verificar si el token es válido haciendo una request simple
if ($accessToken && $isTestAccessToken) {
    echo "\n⏳ Verificando validez del access token...\n";
    
    try {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/v1/account/bank_report');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200 || $httpCode === 201) {
            echo "✅ Access token VÁLIDO\n";
        } elseif ($httpCode === 401) {
            echo "❌ Access token INVÁLIDO (401 Unauthorized)\n";
            echo "💡 Necesitas generar nuevas credenciales de test\n";
        } else {
            echo "⚠️ Respuesta inesperada: HTTP $httpCode\n";
            echo "Respuesta: $response\n";
        }
    } catch (Exception $e) {
        echo "❌ Error al verificar token: " . $e->getMessage() . "\n";
    }
}

echo "\n=== FIN VERIFICACIÓN ===\n";
?>
