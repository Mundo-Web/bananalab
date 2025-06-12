<?php
/**
 * Script de prueba CORREGIDO para Checkout Pro 
 * Según documentación oficial: usar credenciales de PRODUCCIÓN de cuenta de PRUEBA
 */

require_once 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🧪 PRUEBA CHECKOUT PRO - FLUJO CORRECTO\n";
echo "=======================================\n";
echo "📋 Para Checkout Pro en sandbox:\n";
echo "   1. Crear cuenta de prueba VENDEDOR\n";
echo "   2. Crear aplicación con esa cuenta\n";
echo "   3. Usar credenciales de PRODUCCIÓN (APP_USR-) de esa cuenta de prueba\n";
echo "   4. Usar cuenta de prueba COMPRADOR para realizar pagos\n\n";

$servername = $_ENV['DB_HOST'] ?? 'localhost';
$username = $_ENV['DB_USERNAME'] ?? 'root';  
$password = $_ENV['DB_PASSWORD'] ?? '';
$dbname = $_ENV['DB_DATABASE'] ?? '';

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener credenciales desde la base de datos
    $stmt = $pdo->prepare("SELECT configuration FROM payment_methods WHERE slug = 'mercadopago' AND is_active = 1");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        die("❌ MercadoPago no está configurado en la base de datos\n");
    }
    
    $config = json_decode($result['configuration'], true);
    $accessToken = $config['access_token'] ?? null;
    $publicKey = $config['public_key'] ?? null;
    
    if (!$accessToken || !$publicKey) {
        die("❌ Faltan credenciales en la configuración\n");
    }
    
    echo "🔍 VERIFICANDO CREDENCIALES:\n";
    echo "============================\n";
    echo "ACCESS_TOKEN: " . substr($accessToken, 0, 20) . "...\n";
    echo "PUBLIC_KEY: " . substr($publicKey, 0, 20) . "...\n";
    
    // Para Checkout Pro: credenciales de PRODUCCIÓN de cuenta de PRUEBA
    if (str_starts_with($accessToken, 'APP_USR-')) {
        echo "✅ ACCESS_TOKEN es de PRODUCCIÓN (correcto para Checkout Pro)\n";
    } else {
        echo "❌ ACCESS_TOKEN debe ser de PRODUCCIÓN (APP_USR-) de cuenta de prueba\n";
        echo "📖 Consulta: obtener-credenciales-test.html\n";
        exit(1);
    }
    
    if (str_starts_with($publicKey, 'APP_USR-')) {
        echo "✅ PUBLIC_KEY es de PRODUCCIÓN (correcto para Checkout Pro)\n";
    } else {
        echo "❌ PUBLIC_KEY debe ser de PRODUCCIÓN (APP_USR-) de cuenta de prueba\n";
        echo "📖 Consulta: obtener-credenciales-test.html\n";
        exit(1);
    }
    
} catch (Exception $e) {
    die("❌ Error de base de datos: " . $e->getMessage() . "\n");
}

echo "\n🔄 VERIFICANDO CUENTA EN API:\n";
echo "=============================\n";

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.mercadopago.com/users/me",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $accessToken",
        "Content-Type: application/json"
    ],
    CURLOPT_TIMEOUT => 10
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($httpCode === 200) {
    $userData = json_decode($response, true);
    echo "✅ API conectada exitosamente\n";
    echo "Usuario: " . ($userData['nickname'] ?? 'N/A') . "\n";
    echo "Email: " . ($userData['email'] ?? 'N/A') . "\n";
    echo "País: " . ($userData['site_id'] ?? 'N/A') . "\n";
    
    // Verificar si es cuenta de prueba
    if (isset($userData['email']) && str_contains($userData['email'], 'testuser')) {
        echo "✅ Es una cuenta de prueba válida\n";
    } else {
        echo "⚠️ Verificar que sea cuenta de prueba (email debería contener 'testuser')\n";
    }
} else {
    echo "❌ Error en API: Código $httpCode\n";
    if ($response) {
        $errorData = json_decode($response, true);
        echo "Error: " . json_encode($errorData, JSON_PRETTY_PRINT) . "\n";
    }
    exit(1);
}

echo "\n🛒 PROBANDO CREACIÓN DE PREFERENCIA:\n";
echo "====================================\n";

// Datos de prueba para la preferencia
$preferenceData = [
    "items" => [
        [
            "title" => "Producto de prueba",
            "quantity" => 1,
            "unit_price" => 100.00,
            "currency_id" => "ARS"
        ]
    ],
    "payer" => [
        "email" => "test_user_123456@testuser.com"
    ],
    "back_urls" => [
        "success" => "https://localhost/payment/success",
        "failure" => "https://localhost/payment/failure",
        "pending" => "https://localhost/payment/pending"
    ],
    "auto_return" => "approved"
];

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.mercadopago.com/checkout/preferences",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($preferenceData),
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $accessToken",
        "Content-Type: application/json"
    ],
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($httpCode === 201) {
    $preferenceResponse = json_decode($response, true);
    echo "✅ Preferencia creada exitosamente\n";
    echo "ID: " . ($preferenceResponse['id'] ?? 'N/A') . "\n";
    echo "Sandbox URL: " . ($preferenceResponse['sandbox_init_point'] ?? 'N/A') . "\n";
    echo "Production URL: " . ($preferenceResponse['init_point'] ?? 'N/A') . "\n";
    
    if (isset($preferenceResponse['sandbox_init_point'])) {
        echo "\n🎯 PARA PROBAR EL PAGO:\n";
        echo "======================\n";
        echo "1. Abre: " . $preferenceResponse['sandbox_init_point'] . "\n";
        echo "2. Usa cuenta de prueba COMPRADOR\n";
        echo "3. Usa tarjetas de prueba oficiales:\n";
        echo "   - Visa: 4509 9535 6623 3704\n";
        echo "   - Mastercard: 5031 7557 3453 0604\n";
        echo "   - CVV: cualquier número de 3 dígitos\n";
        echo "   - Fecha: cualquier fecha futura\n";
        echo "   - Nombre: TEST USER\n";
        echo "   - DNI: 12345678\n\n";
    }
    
} else {
    echo "❌ Error creando preferencia: Código $httpCode\n";
    if ($response) {
        $errorData = json_decode($response, true);
        echo "Error: " . json_encode($errorData, JSON_PRETTY_PRINT) . "\n";
        
        // Diagnóstico específico de errores comunes
        if (isset($errorData['message'])) {
            $message = strtolower($errorData['message']);
            if (str_contains($message, 'test') || str_contains($message, 'sandbox')) {
                echo "\n💡 POSIBLE SOLUCIÓN:\n";
                echo "El error sugiere problema con credenciales de prueba.\n";
                echo "Asegúrate de que:\n";
                echo "1. Las credenciales son de PRODUCCIÓN (APP_USR-) de cuenta de PRUEBA\n";
                echo "2. La cuenta de prueba vendedor está correctamente configurada\n";
                echo "3. Visita: obtener-credenciales-test.html para más ayuda\n";
            }
        }
    }
    exit(1);
}

echo "\n🎉 PRUEBA COMPLETADA EXITOSAMENTE\n";
echo "=================================\n";
echo "✅ Credenciales correctas\n";
echo "✅ API funcionando\n";
echo "✅ Preferencia creada\n";
echo "✅ URLs de pago generadas\n";
echo "\n🔄 Ahora puedes probar el flujo completo en tu aplicación\n";
