<?php
/**
 * Diagnóstico específico para el error "No pudimos procesar tu pago"
 */

require_once 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🔍 DIAGNÓSTICO: 'No pudimos procesar tu pago'\n";
echo "==============================================\n\n";

$servername = $_ENV['DB_HOST'] ?? 'localhost';
$username = $_ENV['DB_USERNAME'] ?? 'root';  
$password = $_ENV['DB_PASSWORD'] ?? '';
$dbname = $_ENV['DB_DATABASE'] ?? '';

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener credenciales
    $stmt = $pdo->prepare("SELECT configuration FROM payment_methods WHERE slug = 'mercadopago' AND is_active = 1");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        die("❌ MercadoPago no configurado\n");
    }
    
    $config = $result['configuration'];
    if (is_string($config)) {
        $config = json_decode($config, true);
    }
    
    $accessToken = $config['access_token'];
    $publicKey = $config['public_key'];
    
    echo "📋 INFORMACIÓN DE LA CUENTA:\n";
    echo "============================\n";
    
    // Verificar información de la cuenta
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
        echo "Usuario: " . ($userData['nickname'] ?? 'N/A') . "\n";
        echo "Email: " . ($userData['email'] ?? 'N/A') . "\n";
        echo "País: " . ($userData['site_id'] ?? 'N/A') . "\n";
        echo "Tipo de cuenta: " . (strpos($userData['email'], 'testuser') !== false ? 'PRUEBA' : 'REAL') . "\n";
        echo "ID de usuario: " . ($userData['id'] ?? 'N/A') . "\n";
        
        if (isset($userData['tags']) && is_array($userData['tags'])) {
            echo "Tags: " . implode(', ', $userData['tags']) . "\n";
        }
    }
    
    echo "\n🧪 CREAR PREFERENCIA MEJORADA PARA DIAGNÓSTICO:\n";
    echo "===============================================\n";
    
    // Crear preferencia con datos mínimos para evitar conflictos
    $preferenceData = [
        "items" => [
            [
                "title" => "Test Payment",
                "quantity" => 1,
                "unit_price" => 10.00,
                "currency_id" => "PEN"
            ]
        ],
        "back_urls" => [
            "success" => "https://www.mercadopago.com.pe/checkout/success",
            "failure" => "https://www.mercadopago.com.pe/checkout/failure", 
            "pending" => "https://www.mercadopago.com.pe/checkout/pending"
        ],
        "auto_return" => "approved",
        "external_reference" => "test_" . time()
    ];

    // NO incluir payer para evitar conflictos
    
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
        echo "✅ Preferencia sin payer creada exitosamente\n";
        echo "ID: " . ($preferenceResponse['id'] ?? 'N/A') . "\n";
        echo "\n🎯 PRUEBA ESTA URL (sin datos de payer):\n";
        echo "======================================\n";
        echo $preferenceResponse['sandbox_init_point'] . "\n\n";
        
        echo "📋 INSTRUCCIONES ESPECÍFICAS:\n";
        echo "=============================\n";
        echo "1. 🔐 Inicia sesión con UNA CUENTA DE PRUEBA COMPRADOR diferente\n";
        echo "2. 💳 Usa estas tarjetas EXACTAS:\n";
        echo "   • VISA: 4509 9535 6623 3704\n";
        echo "   • CVV: 123\n";
        echo "   • Fecha: 11/25\n";
        echo "   • Nombre: APRO\n";
        echo "   • DNI: 12345678\n\n";
        echo "3. 📧 Si te pide email, usa: test_buyer_123@testuser.com\n\n";
        
    } else {
        echo "❌ Error creando preferencia limpia: HTTP $httpCode\n";
        $errorData = json_decode($response, true);
        echo "Error: " . json_encode($errorData, JSON_PRETTY_PRINT) . "\n";
    }
    
    echo "\n💡 POSIBLES CAUSAS DEL ERROR:\n";
    echo "=============================\n";
    echo "1. 🚫 Usas la MISMA cuenta para vendedor Y comprador\n";
    echo "2. 🚫 Datos del payer conflictivos en la preferencia\n";
    echo "3. 🚫 Tarjeta de prueba incorrecta\n";
    echo "4. 🚫 No estás logueado como cuenta de prueba comprador\n\n";
    
    echo "🛠️ SOLUCIÓN RECOMENDADA:\n";
    echo "========================\n";
    echo "1. Ve a https://www.mercadopago.com.pe/developers/panel/testing-accounts\n";
    echo "2. Crea una cuenta de prueba COMPRADOR (diferente al vendedor)\n";
    echo "3. Úsala para hacer pagos en sandbox\n";
    echo "4. NUNCA uses tu cuenta real para pruebas\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
