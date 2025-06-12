<?php
echo "=== ACTUALIZADOR AUTOMÁTICO CREDENCIALES MERCADOPAGO ===\n";

function updateEnvCredentials($publicKey, $accessToken) {
    $envPath = __DIR__ . '/.env';
    
    if (!file_exists($envPath)) {
        echo "❌ ERROR: Archivo .env no encontrado\n";
        return false;
    }
    
    $envContent = file_get_contents($envPath);
    
    // Backup del archivo original
    $backupPath = $envPath . '.backup.' . date('Y-m-d_H-i-s');
    file_put_contents($backupPath, $envContent);
    echo "💾 Backup creado: " . basename($backupPath) . "\n";
    
    // Actualizar credenciales
    $envContent = preg_replace('/MERCADOPAGO_PUBLIC_KEY=.*/', 'MERCADOPAGO_PUBLIC_KEY=' . $publicKey, $envContent);
    $envContent = preg_replace('/MERCADOPAGO_ACCESS_TOKEN=.*/', 'MERCADOPAGO_ACCESS_TOKEN=' . $accessToken, $envContent);
    
    if (file_put_contents($envPath, $envContent)) {
        echo "✅ Archivo .env actualizado correctamente\n";
        return true;
    } else {
        echo "❌ ERROR: No se pudo actualizar el archivo .env\n";
        return false;
    }
}

function validateCredentials($accessToken) {
    echo "⏳ Validando credenciales...\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/v1/account/bank_report');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "❌ Error de conexión: $error\n";
        return false;
    }
    
    if ($httpCode === 200 || $httpCode === 201) {
        echo "✅ Credenciales válidas\n";
        return true;
    } else {
        echo "❌ Credenciales inválidas (HTTP $httpCode)\n";
        return false;
    }
}

// Verificar si se pasaron credenciales como argumentos
if ($argc >= 3) {
    $publicKey = $argv[1];
    $accessToken = $argv[2];
} else {
    // Solicitar credenciales interactivamente
    echo "🔑 Ingresa tus nuevas credenciales de MercadoPago:\n\n";
    
    echo "📋 Public Key (TEST-xxxx...): ";
    $publicKey = trim(fgets(STDIN));
    
    echo "📋 Access Token (TEST-xxxx...): ";
    $accessToken = trim(fgets(STDIN));
}

// Validar formato
if (!$publicKey || strpos($publicKey, 'TEST-') !== 0) {
    echo "❌ ERROR: El Public Key debe empezar con 'TEST-'\n";
    echo "💡 Ejemplo: TEST-12345678-1234-1234-1234-123456789012\n";
    exit(1);
}

if (!$accessToken || strpos($accessToken, 'TEST-') !== 0) {
    echo "❌ ERROR: El Access Token debe empezar con 'TEST-'\n";
    echo "💡 Ejemplo: TEST-1234567890123456-123456-123456789012345678901234567890123456-12345678\n";
    exit(1);
}

echo "\n📋 CREDENCIALES RECIBIDAS:\n";
echo "🔑 Public Key: " . substr($publicKey, 0, 20) . "...\n";
echo "🔑 Access Token: " . substr($accessToken, 0, 25) . "...\n\n";

// Validar credenciales
if (!validateCredentials($accessToken)) {
    echo "\n💡 POSIBLES SOLUCIONES:\n";
    echo "1. Verifica que hayas copiado las credenciales correctamente\n";
    echo "2. Asegúrate de usar credenciales de PRUEBA (no producción)\n";
    echo "3. Genera nuevas credenciales en: https://www.mercadopago.com.pe/developers/panel/app\n";
    exit(1);
}

// Actualizar archivo .env
if (updateEnvCredentials($publicKey, $accessToken)) {
    echo "\n🎉 ¡CREDENCIALES ACTUALIZADAS EXITOSAMENTE!\n\n";
    echo "📋 PRÓXIMOS PASOS:\n";
    echo "1. Reinicia el servidor Laravel:\n";
    echo "   php artisan serve --port=8000\n\n";
    echo "2. Prueba el pago en:\n";
    echo "   http://localhost:8000/test-final-mercadopago.html\n\n";
    echo "3. Usa estas tarjetas de prueba:\n";
    echo "   ✅ APROBAR: 4009 1753 3280 6176, CVV: 123, Venc: 11/30, Nombre: APRO\n";
    echo "   ❌ RECHAZAR: 4009 1753 3280 6176, CVV: 123, Venc: 11/30, Nombre: OTHE\n\n";
    echo "✅ El problema 'Algo salió mal... No pudimos procesar tu pago' debería estar resuelto\n";
} else {
    echo "\n💡 ACTUALIZACIÓN MANUAL:\n";
    echo "Edita el archivo .env y reemplaza estas líneas:\n";
    echo "MERCADOPAGO_PUBLIC_KEY=$publicKey\n";
    echo "MERCADOPAGO_ACCESS_TOKEN=$accessToken\n";
}

echo "\n=== FIN ACTUALIZACIÓN ===\n";
?>
