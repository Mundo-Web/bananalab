<?php
/**
 * Script para actualizar credenciales de PRUEBA de Checkout Pro
 * Ejecutar después de obtener las credenciales correctas de MercadoPago
 */

require_once 'vendor/autoload.php';

// Cargar variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🔧 ACTUALIZAR CREDENCIALES DE PRUEBA - CHECKOUT PRO\n";
echo "===================================================\n\n";

echo "📋 IMPORTANTE: Este script es para credenciales de PRUEBA de Checkout Pro\n";
echo "Las credenciales deben empezar con 'TEST-' no con 'APP_USR-'\n\n";

// Conectar a base de datos
$servername = $_ENV['DB_HOST'] ?? 'localhost';
$username = $_ENV['DB_USERNAME'] ?? 'root';
$password = $_ENV['DB_PASSWORD'] ?? '';
$dbname = $_ENV['DB_DATABASE'] ?? '';

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conectado a la base de datos\n\n";
} catch(PDOException $e) {
    die("❌ Error de conexión: " . $e->getMessage() . "\n");
}

// Solicitar las nuevas credenciales
echo "Por favor, ingresa las credenciales de PRUEBA de tu aplicación Checkout Pro:\n";
echo "=======================================================================\n\n";

echo "1. ACCESS TOKEN (debe empezar con TEST-): ";
$handle = fopen("php://stdin", "r");
$newAccessToken = trim(fgets($handle));

echo "2. PUBLIC KEY (debe empezar con TEST-): ";
$newPublicKey = trim(fgets($handle));
fclose($handle);

echo "\n";

// Validar que sean credenciales de TEST
if (strpos($newAccessToken, 'TEST-') !== 0) {
    echo "❌ ERROR: El ACCESS TOKEN debe empezar con 'TEST-'\n";
    echo "El token que ingresaste: " . substr($newAccessToken, 0, 20) . "...\n";
    echo "Formato esperado: TEST-1234567890123456-061123-...\n\n";
    echo "🔍 Verifica que:\n";
    echo "1. Estés en la sección 'Credenciales de prueba' (no producción)\n";
    echo "2. Tu aplicación sea de tipo 'Checkout Pro'\n";
    echo "3. Hayas copiado el token completo\n";
    exit(1);
}

if (strpos($newPublicKey, 'TEST-') !== 0) {
    echo "❌ ERROR: La PUBLIC KEY debe empezar con 'TEST-'\n";
    echo "La key que ingresaste: " . substr($newPublicKey, 0, 20) . "...\n";
    echo "Formato esperado: TEST-abcdef12-3456-7890-...\n\n";
    echo "🔍 Verifica que:\n";
    echo "1. Estés en la sección 'Credenciales de prueba' (no producción)\n";
    echo "2. Tu aplicación sea de tipo 'Checkout Pro'\n";
    echo "3. Hayas copiado la key completa\n";
    exit(1);
}

echo "✅ Formato de credenciales correcto\n";

// Probar las credenciales con la API
echo "🔄 Probando credenciales con API de MercadoPago...\n";

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.mercadopago.com/users/me",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $newAccessToken",
        "Content-Type: application/json"
    ],
    CURLOPT_TIMEOUT => 10
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($httpCode === 200) {
    $userData = json_decode($response, true);
    echo "✅ Credenciales válidas!\n";
    echo "Usuario: " . ($userData['nickname'] ?? 'N/A') . "\n";
    echo "Email: " . ($userData['email'] ?? 'N/A') . "\n";
    echo "País: " . ($userData['site_id'] ?? 'N/A') . "\n";
    echo "Tipo de cuenta: " . ($userData['user_type'] ?? 'N/A') . "\n\n";
    
    // Verificar que sea una cuenta de prueba
    if (strpos($userData['email'], 'testuser.com') === false) {
        echo "⚠️ ADVERTENCIA: Esta no parece ser una cuenta de prueba\n";
        echo "Las cuentas de prueba suelen tener emails como: test_user_XXXX@testuser.com\n";
        echo "¿Estás seguro de que creaste la aplicación con una cuenta de prueba?\n\n";
        
        echo "¿Continuar de todos modos? (y/n): ";
        $handle = fopen("php://stdin", "r");
        $continue = trim(fgets($handle));
        fclose($handle);
        
        if (strtolower($continue) !== 'y' && strtolower($continue) !== 'yes') {
            echo "Operación cancelada.\n";
            exit(0);
        }
    }
    
} else {
    echo "❌ Credenciales inválidas o expiradas\n";
    echo "Código HTTP: $httpCode\n";
    if ($response) {
        $errorData = json_decode($response, true);
        echo "Error: " . ($errorData['message'] ?? 'Desconocido') . "\n";
    }
    echo "\n🔍 Posibles causas:\n";
    echo "1. Las credenciales no son de una aplicación Checkout Pro\n";
    echo "2. La cuenta de prueba no existe o fue eliminada\n";
    echo "3. Hay un error de tipeo en las credenciales\n";
    exit(1);
}

// Actualizar en base de datos
try {
    $newConfig = json_encode([
        'access_token' => $newAccessToken,
        'public_key' => $newPublicKey
    ]);
    
    $stmt = $pdo->prepare("UPDATE payment_methods SET configuration = ?, is_active = 1 WHERE slug = 'mercadopago'");
    $stmt->execute([$newConfig]);
    
    echo "✅ Credenciales actualizadas en la base de datos\n";
    
    // Verificar la actualización
    $stmt = $pdo->prepare("SELECT configuration FROM payment_methods WHERE slug = 'mercadopago'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row) {
        $savedConfig = json_decode($row['configuration'], true);
        echo "ACCESS_TOKEN guardado: " . substr($savedConfig['access_token'], 0, 20) . "...\n";
        echo "PUBLIC_KEY guardado: " . substr($savedConfig['public_key'], 0, 20) . "...\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error al actualizar credenciales: " . $e->getMessage() . "\n";
    exit(1);
}

// Actualizar archivo .env (opcional)
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    
    // Actualizar o agregar las variables
    if (strpos($envContent, 'MERCADOPAGO_ACCESS_TOKEN=') !== false) {
        $envContent = preg_replace('/^MERCADOPAGO_ACCESS_TOKEN=.*$/m', "MERCADOPAGO_ACCESS_TOKEN=$newAccessToken", $envContent);
    } else {
        $envContent .= "\nMERCADOPAGO_ACCESS_TOKEN=$newAccessToken";
    }
    
    if (strpos($envContent, 'MERCADOPAGO_PUBLIC_KEY=') !== false) {
        $envContent = preg_replace('/^MERCADOPAGO_PUBLIC_KEY=.*$/m', "MERCADOPAGO_PUBLIC_KEY=$newPublicKey", $envContent);
    } else {
        $envContent .= "\nMERCADOPAGO_PUBLIC_KEY=$newPublicKey";
    }
    
    file_put_contents($envFile, $envContent);
    echo "✅ Archivo .env actualizado\n";
}

echo "\n🎉 ¡CREDENCIALES ACTUALIZADAS EXITOSAMENTE!\n";
echo "===========================================\n";
echo "Tu sistema ahora está configurado para Checkout Pro con credenciales de PRUEBA.\n\n";

echo "🧪 PRÓXIMOS PASOS PARA PROBAR:\n";
echo "==============================\n";
echo "1. Ejecuta: php test_checkout_pro_final.php\n";
echo "2. Haz una compra en tu sitio\n";
echo "3. Cuando llegues a MercadoPago, inicia sesión con tu cuenta COMPRADORA\n";
echo "4. Usa las tarjetas de prueba de MercadoPago\n\n";

echo "💳 TARJETAS DE PRUEBA:\n";
echo "======================\n";
echo "VISA (Aprobada): 4009 1753 3280 6176\n";
echo "Mastercard (Aprobada): 5031 7557 3453 0604\n";
echo "CVV: 123, Vencimiento: 11/30, Nombre: APRO\n\n";

echo "⚠️ RECORDATORIO:\n";
echo "=================\n";
echo "- Estas son credenciales de PRUEBA (no cobrará dinero real)\n";
echo "- Para usar en producción, necesitarás activar credenciales de producción reales\n";
echo "- El flujo de pago ahora debe funcionar sin errores\n";

echo "\n🏁 ¡Tu Checkout Pro está listo para pruebas! 🎉\n";
?>
