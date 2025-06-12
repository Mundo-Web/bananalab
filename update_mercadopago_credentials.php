<?php
echo "=== TEST CREDENCIALES NUEVAS MERCADOPAGO ===\n";

// Solicitar credenciales por línea de comandos
echo "🔑 Por favor, ingresa tus nuevas credenciales de MercadoPago:\n\n";

echo "📋 Ingresa tu PUBLIC KEY (TEST-xxxx...):\n";
$publicKey = trim(fgets(STDIN));

echo "\n📋 Ingresa tu ACCESS TOKEN (TEST-xxxx...):\n";
$accessToken = trim(fgets(STDIN));

// Validar formato
if (!$publicKey || strpos($publicKey, 'TEST-') !== 0) {
    echo "❌ ERROR: El Public Key debe empezar con 'TEST-'\n";
    exit(1);
}

if (!$accessToken || strpos($accessToken, 'TEST-') !== 0) {
    echo "❌ ERROR: El Access Token debe empezar con 'TEST-'\n";
    exit(1);
}

echo "\n⏳ Verificando credenciales...\n";

// Verificar access token
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
    echo "✅ CREDENCIALES VÁLIDAS!\n\n";
    
    // Actualizar archivo .env
    $envContent = file_get_contents('.env');
    
    // Buscar y reemplazar credenciales
    $envContent = preg_replace('/MERCADOPAGO_PUBLIC_KEY=.*/', 'MERCADOPAGO_PUBLIC_KEY=' . $publicKey, $envContent);
    $envContent = preg_replace('/MERCADOPAGO_ACCESS_TOKEN=.*/', 'MERCADOPAGO_ACCESS_TOKEN=' . $accessToken, $envContent);
    
    if (file_put_contents('.env', $envContent)) {
        echo "✅ Archivo .env actualizado correctamente\n";
        echo "\n📋 PRÓXIMOS PASOS:\n";
        echo "1. Reinicia el servidor: php artisan serve --port=8000\n";
        echo "2. Abre: http://localhost:8000/test-final-mercadopago.html\n";
        echo "3. Prueba el pago con tarjeta: 4009 1753 3280 7176\n";
        echo "\n🎉 ¡Todo listo para probar pagos en sandbox!\n";
    } else {
        echo "❌ ERROR: No se pudo actualizar el archivo .env\n";
        echo "💡 Actualiza manualmente:\n";
        echo "MERCADOPAGO_PUBLIC_KEY=$publicKey\n";
        echo "MERCADOPAGO_ACCESS_TOKEN=$accessToken\n";
    }
    
} else {
    echo "❌ CREDENCIALES INVÁLIDAS (HTTP $httpCode)\n";
    echo "💡 Verifica que hayas copiado correctamente las credenciales de test\n";
    echo "🔗 Obtén nuevas en: https://www.mercadopago.com.pe/developers/panel/app\n";
}

echo "\n=== FIN TEST ===\n";
?>
