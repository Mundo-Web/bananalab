<?php
require_once 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$servername = $_ENV['DB_HOST'] ?? 'localhost';
$username = $_ENV['DB_USERNAME'] ?? 'root';  
$password = $_ENV['DB_PASSWORD'] ?? '';
$dbname = $_ENV['DB_DATABASE'] ?? '';

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "🔍 VERIFICANDO CREDENCIALES EN BASE DE DATOS\n";
    echo "=============================================\n\n";
    
    $stmt = $pdo->query('SELECT id, name, slug, configuration, is_active FROM payment_methods WHERE slug = "mercadopago"');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo "✅ Método de pago encontrado:\n";
        echo "ID: " . $result['id'] . "\n";
        echo "Nombre: " . $result['name'] . "\n";
        echo "Slug: " . $result['slug'] . "\n";
        echo "Activo: " . ($result['is_active'] ? 'Sí' : 'No') . "\n";
        echo "Configuración bruta: " . $result['configuration'] . "\n\n";
        
        if ($result['configuration']) {
            $config = json_decode($result['configuration'], true);
            if ($config && isset($config['access_token']) && isset($config['public_key'])) {
                echo "✅ Credenciales decodificadas correctamente:\n";
                echo "ACCESS_TOKEN: " . substr($config['access_token'], 0, 20) . "..." . substr($config['access_token'], -10) . "\n";
                echo "PUBLIC_KEY: " . substr($config['public_key'], 0, 20) . "..." . substr($config['public_key'], -10) . "\n";
                
                // Verificar tipo de credenciales
                if (strpos($config['access_token'], 'APP_USR-') === 0) {
                    echo "✅ ACCESS_TOKEN es de PRODUCCIÓN\n";
                } else {
                    echo "⚠️ ACCESS_TOKEN no tiene formato esperado\n";
                }
                
                if (strpos($config['public_key'], 'APP_USR-') === 0) {
                    echo "✅ PUBLIC_KEY es de PRODUCCIÓN\n";
                } else {
                    echo "⚠️ PUBLIC_KEY no tiene formato esperado\n";
                }
                
            } else {
                echo "❌ Error al decodificar la configuración JSON\n";
            }
        } else {
            echo "❌ No hay configuración guardada\n";
        }
    } else {
        echo "❌ Método de pago MercadoPago no encontrado\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
