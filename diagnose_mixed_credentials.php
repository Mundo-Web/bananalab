<?php
echo "=== DIAGNÓSTICO PROBLEMA 'PARTES DE PRUEBA' ===\n";

// Cargar Laravel bootstrap
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$publicKey = env('MERCADOPAGO_PUBLIC_KEY');
$accessToken = env('MERCADOPAGO_ACCESS_TOKEN');

echo "📋 ANÁLISIS DE CREDENCIALES:\n";
echo "🔑 Public Key: " . ($publicKey ? substr($publicKey, 0, 20) . "..." : "NO CONFIGURADO") . "\n";
echo "🔑 Access Token: " . ($accessToken ? substr($accessToken, 0, 20) . "..." : "NO CONFIGURADO") . "\n";

// Verificar tipos de credenciales
$isTestPublicKey = $publicKey && strpos($publicKey, 'TEST-') === 0;
$isTestAccessToken = $accessToken && strpos($accessToken, 'TEST-') === 0;
$isProdPublicKey = $publicKey && strpos($publicKey, 'APP_USR-') === 0;
$isProdAccessToken = $accessToken && strpos($accessToken, 'APP_USR-') === 0;

echo "\n🔍 TIPO DE CREDENCIALES:\n";
echo "✓ Public Key es de TEST: " . ($isTestPublicKey ? "SÍ" : "NO") . "\n";
echo "✓ Access Token es de TEST: " . ($isTestAccessToken ? "SÍ" : "NO") . "\n";
echo "⚠ Public Key es de PRODUCCIÓN: " . ($isProdPublicKey ? "SÍ" : "NO") . "\n";
echo "⚠ Access Token es de PRODUCCIÓN: " . ($isProdAccessToken ? "SÍ" : "NO") . "\n";

// Detectar problemas
$hasProblems = false;

if ($isProdPublicKey || $isProdAccessToken) {
    echo "\n❌ PROBLEMA DETECTADO: CREDENCIALES DE PRODUCCIÓN\n";
    echo "No puedes usar credenciales de producción (APP_USR-) para testing.\n";
    echo "Necesitas credenciales de prueba (TEST-).\n";
    $hasProblems = true;
}

if ($isTestPublicKey !== $isTestAccessToken) {
    echo "\n❌ PROBLEMA DETECTADO: MEZCLA DE TIPOS\n";
    echo "Estás mezclando credenciales de test y producción.\n";
    echo "Ambas deben ser del mismo tipo (TEST- o APP_USR-).\n";
    $hasProblems = true;
}

if (!$publicKey || !$accessToken) {
    echo "\n❌ PROBLEMA DETECTADO: CREDENCIALES FALTANTES\n";
    echo "Faltan credenciales en el archivo .env\n";
    $hasProblems = true;
}

if (!$hasProblems && $isTestPublicKey && $isTestAccessToken) {
    echo "\n✅ CREDENCIALES PARECEN CORRECTAS\n";
    echo "El problema puede ser otro. Revisando...\n";
    
    // Verificar si el error viene de la URL o configuración
    echo "\n🔍 VERIFICANDO CONFIGURACIÓN ADICIONAL:\n";
    
    $appUrl = config('app.url');
    echo "🌐 APP_URL: $appUrl\n";
    
    if (strpos($appUrl, 'https://') === 0) {
        echo "⚠️ POSIBLE PROBLEMA: Estás usando HTTPS en desarrollo\n";
        echo "💡 Para testing, considera usar HTTP: http://localhost:8000\n";
    }
}

echo "\n📋 SOLUCIONES RECOMENDADAS:\n";

if ($isProdPublicKey || $isProdAccessToken) {
    echo "1. 🔄 CAMBIAR A CREDENCIALES DE PRUEBA:\n";
    echo "   - Ve a: https://www.mercadopago.com.pe/developers/panel/app\n";
    echo "   - Sección: 'Credenciales de prueba' (NO producción)\n";
    echo "   - Copia las credenciales que empiecen con TEST-\n\n";
}

if ($isTestPublicKey !== $isTestAccessToken) {
    echo "2. 🔧 SINCRONIZAR TIPOS DE CREDENCIALES:\n";
    echo "   - Usa SOLO credenciales de prueba para testing\n";
    echo "   - Ambas deben empezar con TEST-\n\n";
}

echo "3. 🛠️ USAR HERRAMIENTAS DE DIAGNÓSTICO:\n";
echo "   - Generador web: http://localhost:8000/mercadopago-credentials-generator.html\n";
echo "   - Script automático: php fix_mercadopago_credentials.php\n\n";

echo "4. 💳 VERIFICAR ENTORNO DE TARJETAS:\n";
echo "   - Para TEST: usa tarjetas de prueba oficiales\n";
echo "   - Para PROD: usa tarjetas reales (NO recomendado en desarrollo)\n";

echo "\n=== FIN DIAGNÓSTICO ===\n";
?>
