<?php
require_once 'vendor/autoload.php';

// Cargar variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🔧 ACTUALIZANDO CREDENCIALES DE PRODUCCIÓN\n";
echo "==========================================\n\n";

$servername = $_ENV['DB_HOST'] ?? 'localhost';
$username = $_ENV['DB_USERNAME'] ?? 'root';  
$password = $_ENV['DB_PASSWORD'] ?? '';
$dbname = $_ENV['DB_DATABASE'] ?? '';

echo "Conectando a base de datos: $dbname\n";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conectado a la base de datos\n\n";
    
    // Nuevas credenciales de PRODUCCIÓN
    $accessToken = 'APP_USR-4609187540698040-061123-a53c80b6e589d4ae3bce3f39f0f7f562-2489869845';
    $publicKey = 'APP_USR-4aea3c0f-996b-430e-8545-b7b1335b2160';
    
    // Verificar que son credenciales de producción (no empiezan con TEST-)
    if (strpos($accessToken, 'TEST-') === 0) {
        echo "⚠️ ADVERTENCIA: ACCESS_TOKEN parece ser de prueba\n";
    } else {
        echo "✅ ACCESS_TOKEN es de PRODUCCIÓN (correcto)\n";
    }
    
    if (strpos($publicKey, 'TEST-') === 0) {
        echo "⚠️ ADVERTENCIA: PUBLIC_KEY parece ser de prueba\n";
    } else {
        echo "✅ PUBLIC_KEY es de PRODUCCIÓN (correcto)\n";
    }
    
    echo "\n";
    
    // Probar las credenciales con la API
    echo "Probando credenciales con API de MercadoPago...\n";
    
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
        echo "✅ Credenciales VÁLIDAS!\n";
        echo "Usuario: " . ($userData['nickname'] ?? 'N/A') . "\n";
        echo "Email: " . ($userData['email'] ?? 'N/A') . "\n";
        echo "País: " . ($userData['site_id'] ?? 'N/A') . "\n\n";
        
        // Actualizar en la base de datos
        $config = json_encode([
            'access_token' => $accessToken,
            'public_key' => $publicKey
        ]);
        
        $stmt = $pdo->prepare("UPDATE payment_methods SET configuration = ?, is_active = 1 WHERE slug = 'mercadopago'");
        $result = $stmt->execute([$config]);
        
        if ($result) {
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
            
        } else {
            echo "❌ Error al actualizar en la base de datos\n";
        }
        
    } else {
        echo "❌ Credenciales INVÁLIDAS\n";
        echo "Código HTTP: $httpCode\n";
        if ($response) {
            $errorData = json_decode($response, true);
            echo "Error: " . ($errorData['message'] ?? 'Desconocido') . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n🎯 IMPORTANTE:\n";
echo "==============\n";
echo "Ahora estás usando credenciales de PRODUCCIÓN.\n";
echo "Esto significa:\n";
echo "- Los pagos serán REALES (no simulaciones)\n";
echo "- Usa tarjetas reales para probar\n";
echo "- Los usuarios serán cobrados realmente\n";
echo "- No uses tarjetas de prueba de MercadoPago\n";
echo "\n";
?>
