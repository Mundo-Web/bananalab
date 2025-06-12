<?php
/**
 * Script para actualizar credenciales de MercadoPago a las correctas para sandbox
 */

echo "=== ACTUALIZANDO CREDENCIALES PARA SANDBOX ===\n\n";

$envFile = __DIR__ . '/.env';

if (!file_exists($envFile)) {
    die("❌ Archivo .env no encontrado\n");
}

echo "1. Respaldando archivo .env actual...\n";
copy($envFile, $envFile . '.backup.' . date('Y-m-d-H-i-s'));
echo "   ✅ Respaldo creado\n\n";

echo "2. INSTRUCCIONES PARA OBTENER LAS CREDENCIALES CORRECTAS:\n\n";

echo "   Paso 1: Ve a https://www.mercadopago.com.ar/developers/panel/test-users\n";
echo "   Paso 2: Crea o usa una cuenta de prueba VENDEDOR\n";
echo "   Paso 3: Inicia sesión en MercadoPago con esa cuenta de prueba\n";
echo "   Paso 4: Ve a https://www.mercadopago.com.ar/developers/panel/app\n";
echo "   Paso 5: Crea una aplicación o usa una existente\n";
echo "   Paso 6: En 'Credenciales de producción', copia:\n";
echo "           - Public Key (empieza con APP_USR-)\n";
echo "           - Access Token (empieza con APP_USR-)\n\n";

echo "   ⚠️  IMPORTANTE: NO uses las credenciales de 'Credenciales de prueba' (TEST-)\n";
echo "   ⚠️  USA las de 'Credenciales de producción' de la cuenta de prueba\n\n";

// Mostrar formulario para ingresar las credenciales
echo "3. INGRESA LAS NUEVAS CREDENCIALES:\n\n";

echo "   Access Token (debe empezar con APP_USR-): ";
$accessToken = trim(fgets(STDIN));

if (strpos($accessToken, 'APP_USR-') !== 0) {
    die("❌ Error: El Access Token debe empezar con 'APP_USR-'. Token ingresado: $accessToken\n");
}

echo "   Public Key (debe empezar con APP_USR-): ";
$publicKey = trim(fgets(STDIN));

if (strpos($publicKey, 'APP_USR-') !== 0) {
    die("❌ Error: El Public Key debe empezar con 'APP_USR-'. Key ingresada: $publicKey\n");
}

// Actualizar archivo .env
$envContent = file_get_contents($envFile);

// Reemplazar o agregar las credenciales
$envContent = preg_replace('/MERCADOPAGO_ACCESS_TOKEN=.*/', "MERCADOPAGO_ACCESS_TOKEN=$accessToken", $envContent);
$envContent = preg_replace('/MERCADOPAGO_PUBLIC_KEY=.*/', "MERCADOPAGO_PUBLIC_KEY=$publicKey", $envContent);

// Si no existían, agregarlas
if (strpos($envContent, 'MERCADOPAGO_ACCESS_TOKEN=') === false) {
    $envContent .= "\nMERCADOPAGO_ACCESS_TOKEN=$accessToken";
}
if (strpos($envContent, 'MERCADOPAGO_PUBLIC_KEY=') === false) {
    $envContent .= "\nMERCADOPAGO_PUBLIC_KEY=$publicKey";
}

file_put_contents($envFile, $envContent);

echo "\n4. ✅ Credenciales actualizadas exitosamente\n\n";

// Verificar las credenciales
echo "5. VERIFICANDO CREDENCIALES...\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/v1/account');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $accessToken,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $accountData = json_decode($response, true);
    echo "   ✅ Conexión exitosa con MercadoPago\n";
    echo "   - Account ID: " . ($accountData['id'] ?? 'N/A') . "\n";
    echo "   - Email: " . ($accountData['email'] ?? 'N/A') . "\n";
    
    if (isset($accountData['is_test']) && $accountData['is_test']) {
        echo "   ✅ Es una cuenta de prueba (CORRECTO para sandbox)\n";
    } else {
        echo "   ⚠️  Verificar si es cuenta de prueba\n";
    }
} else {
    echo "   ❌ Error verificando credenciales: HTTP $httpCode\n";
    echo "   Response: $response\n";
}

echo "\n6. PRÓXIMOS PASOS:\n";
echo "   ✅ Credenciales actualizadas\n";
echo "   🔄 Reinicia tu servidor Laravel (php artisan serve)\n";
echo "   🧪 Prueba el flujo de pago con:\n";
echo "      - Tarjeta: 4509 9535 6623 3704 (Visa)\n";
echo "      - CVV: 123\n";
echo "      - Fecha: cualquier fecha futura\n";
echo "      - Email: diferente al del vendedor\n\n";

echo "=== ACTUALIZACIÓN COMPLETADA ===\n";
?>
