<?php
/**
 * Script para verificar y actualizar credenciales de MercadoPago
 * Ejecutar desde el directorio raíz del proyecto: php check_and_update_mercadopago_credentials.php
 */

require_once 'vendor/autoload.php';

// Cargar variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Configurar base de datos
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

echo "🔍 VERIFICANDO CREDENCIALES ACTUALES DE MERCADOPAGO\n";
echo "=================================================\n\n";

// 1. Verificar credenciales en .env
echo "1. Credenciales en archivo .env:\n";
echo "--------------------------------\n";
$envAccessToken = $_ENV['MERCADOPAGO_ACCESS_TOKEN'] ?? 'No configurado';
$envPublicKey = $_ENV['MERCADOPAGO_PUBLIC_KEY'] ?? 'No configurado';

echo "ACCESS_TOKEN: " . maskCredential($envAccessToken) . "\n";
echo "PUBLIC_KEY: " . maskCredential($envPublicKey) . "\n";

// Verificar si son credenciales de test
if (strpos($envAccessToken, 'TEST-') === 0) {
    echo "✅ ACCESS_TOKEN es de prueba (correcto para sandbox)\n";
} else {
    echo "⚠️ ACCESS_TOKEN NO es de prueba - debe empezar con 'TEST-'\n";
}

if (strpos($envPublicKey, 'TEST-') === 0) {
    echo "✅ PUBLIC_KEY es de prueba (correcto para sandbox)\n";
} else {
    echo "⚠️ PUBLIC_KEY NO es de prueba - debe empezar con 'TEST-'\n";
}

echo "\n";

// 2. Verificar credenciales en base de datos
echo "2. Credenciales en base de datos:\n";
echo "---------------------------------\n";

try {
    $stmt = $pdo->prepare("SELECT id, name, slug, configuration, is_active FROM payment_methods WHERE slug = 'mercadopago'");
    $stmt->execute();
    $mercadopagoMethod = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($mercadopagoMethod) {
        echo "✅ Método de pago MercadoPago encontrado (ID: {$mercadopagoMethod['id']})\n";
        echo "Estado: " . ($mercadopagoMethod['is_active'] ? 'Activo' : 'Inactivo') . "\n";
        
        $config = json_decode($mercadopagoMethod['configuration'], true);
        if ($config) {
            $dbAccessToken = $config['access_token'] ?? 'No configurado';
            $dbPublicKey = $config['public_key'] ?? 'No configurado';
            
            echo "ACCESS_TOKEN: " . maskCredential($dbAccessToken) . "\n";
            echo "PUBLIC_KEY: " . maskCredential($dbPublicKey) . "\n";
            
            // Verificar si son credenciales de test
            if (strpos($dbAccessToken, 'TEST-') === 0) {
                echo "✅ ACCESS_TOKEN es de prueba (correcto para sandbox)\n";
            } else {
                echo "⚠️ ACCESS_TOKEN NO es de prueba - debe empezar con 'TEST-'\n";
            }
            
            if (strpos($dbPublicKey, 'TEST-') === 0) {
                echo "✅ PUBLIC_KEY es de prueba (correcto para sandbox)\n";
            } else {
                echo "⚠️ PUBLIC_KEY NO es de prueba - debe empezar con 'TEST-'\n";
            }
        } else {
            echo "❌ No se pudo decodificar la configuración JSON\n";
        }
    } else {
        echo "❌ Método de pago MercadoPago no encontrado en la base de datos\n";
    }
} catch (Exception $e) {
    echo "❌ Error al consultar la base de datos: " . $e->getMessage() . "\n";
}

echo "\n";

// 3. Probar credenciales con la API de MercadoPago
echo "3. Probando credenciales con API de MercadoPago:\n";
echo "------------------------------------------------\n";

// Usar credenciales de la base de datos si están disponibles, sino las del .env
$testAccessToken = isset($config) && isset($config['access_token']) ? $config['access_token'] : $envAccessToken;

if ($testAccessToken && $testAccessToken !== 'No configurado') {
    echo "Probando ACCESS_TOKEN: " . maskCredential($testAccessToken) . "\n";
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api.mercadopago.com/users/me",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $testAccessToken",
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
    } else {
        echo "❌ Credenciales inválidas o expiradas\n";
        echo "Código HTTP: $httpCode\n";
        if ($response) {
            $errorData = json_decode($response, true);
            echo "Error: " . ($errorData['message'] ?? 'Desconocido') . "\n";
        }
    }
} else {
    echo "❌ No hay ACCESS_TOKEN para probar\n";
}

echo "\n";

// 4. Mostrar resumen y recomendaciones
echo "4. RESUMEN Y RECOMENDACIONES:\n";
echo "=============================\n";

$needsUpdate = false;

if (!$testAccessToken || $testAccessToken === 'No configurado') {
    echo "❌ Falta configurar ACCESS_TOKEN\n";
    $needsUpdate = true;
}

if (strpos($testAccessToken, 'TEST-') !== 0) {
    echo "❌ ACCESS_TOKEN no es de prueba (debe empezar con 'TEST-')\n";
    $needsUpdate = true;
}

$testPublicKey = isset($config) && isset($config['public_key']) ? $config['public_key'] : $envPublicKey;
if (!$testPublicKey || $testPublicKey === 'No configurado') {
    echo "❌ Falta configurar PUBLIC_KEY\n";
    $needsUpdate = true;
}

if (strpos($testPublicKey, 'TEST-') !== 0) {
    echo "❌ PUBLIC_KEY no es de prueba (debe empezar con 'TEST-')\n";
    $needsUpdate = true;
}

if ($needsUpdate) {
    echo "\n🔧 NECESITAS ACTUALIZAR LAS CREDENCIALES:\n";
    echo "=========================================\n";
    echo "1. Ve a https://www.mercadopago.com.pe/developers/panel\n";
    echo "2. Inicia sesión con tu cuenta de MercadoPago\n";
    echo "3. Ve a 'Tus integraciones' > 'Tu aplicación'\n";
    echo "4. En la sección 'Credenciales de prueba':\n";
    echo "   - Copia el 'Access token' (empieza con TEST-)\n";
    echo "   - Copia la 'Public key' (empieza con TEST-)\n";
    echo "5. Ejecuta este script con los parámetros para actualizar:\n";
    echo "   php check_and_update_mercadopago_credentials.php --update\n\n";
    
    // Preguntar si quiere actualizar ahora
    echo "¿Quieres actualizar las credenciales ahora? (y/n): ";
    $handle = fopen("php://stdin", "r");
    $input = trim(fgets($handle));
    fclose($handle);
    
    if (strtolower($input) === 'y' || strtolower($input) === 'yes') {
        updateCredentials($pdo);
    }
} else {
    echo "✅ Las credenciales parecen estar configuradas correctamente\n";
    echo "✅ Puedes probar el flujo de pago en sandbox\n";
    echo "\n💳 Usa estas tarjetas de prueba:\n";
    echo "================================\n";
    echo "VISA (Aprobada): 4009 1753 3280 6176\n";
    echo "Mastercard (Aprobada): 5031 7557 3453 0604\n";
    echo "CVV: 123\n";
    echo "Vencimiento: 11/30\n";
    echo "Nombre: APRO\n";
    echo "\nVISA (Rechazada): 4509 9535 6623 3704\n";
    echo "Nombre: OTHE\n";
}

echo "\n";

// Verificar si se pasó el parámetro --update
if (in_array('--update', $argv)) {
    updateCredentials($pdo);
}

function maskCredential($credential) {
    if (!$credential || $credential === 'No configurado') {
        return $credential;
    }
    
    if (strlen($credential) > 10) {
        return substr($credential, 0, 10) . '...' . substr($credential, -4);
    }
    
    return $credential;
}

function updateCredentials($pdo) {
    echo "\n🔧 ACTUALIZANDO CREDENCIALES:\n";
    echo "=============================\n";
    
    echo "Ingresa el nuevo ACCESS_TOKEN (debe empezar con TEST-): ";
    $handle = fopen("php://stdin", "r");
    $newAccessToken = trim(fgets($handle));
    
    echo "Ingresa la nueva PUBLIC_KEY (debe empezar con TEST-): ";
    $newPublicKey = trim(fgets($handle));
    fclose($handle);
    
    // Validar que sean credenciales de test
    if (strpos($newAccessToken, 'TEST-') !== 0) {
        echo "❌ ACCESS_TOKEN debe empezar con 'TEST-'\n";
        return;
    }
    
    if (strpos($newPublicKey, 'TEST-') !== 0) {
        echo "❌ PUBLIC_KEY debe empezar con 'TEST-'\n";
        return;
    }
    
    // Probar las nuevas credenciales
    echo "Probando nuevas credenciales...\n";
    
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
    
    if ($httpCode !== 200) {
        echo "❌ Las nuevas credenciales no son válidas\n";
        echo "Código HTTP: $httpCode\n";
        return;
    }
    
    echo "✅ Credenciales válidas!\n";
    
    // Actualizar en base de datos
    try {
        $newConfig = json_encode([
            'access_token' => $newAccessToken,
            'public_key' => $newPublicKey
        ]);
        
        $stmt = $pdo->prepare("UPDATE payment_methods SET configuration = ?, is_active = 1 WHERE slug = 'mercadopago'");
        $stmt->execute([$newConfig]);
        
        echo "✅ Credenciales actualizadas en la base de datos\n";
        
        // Actualizar archivo .env
        $envFile = __DIR__ . '/.env';
        if (file_exists($envFile)) {
            $envContent = file_get_contents($envFile);
            
            // Actualizar o agregar las variables
            $envContent = preg_replace('/^MERCADOPAGO_ACCESS_TOKEN=.*$/m', "MERCADOPAGO_ACCESS_TOKEN=$newAccessToken", $envContent);
            $envContent = preg_replace('/^MERCADOPAGO_PUBLIC_KEY=.*$/m', "MERCADOPAGO_PUBLIC_KEY=$newPublicKey", $envContent);
            
            // Si no existían las variables, agregarlas
            if (strpos($envContent, 'MERCADOPAGO_ACCESS_TOKEN=') === false) {
                $envContent .= "\nMERCADOPAGO_ACCESS_TOKEN=$newAccessToken";
            }
            if (strpos($envContent, 'MERCADOPAGO_PUBLIC_KEY=') === false) {
                $envContent .= "\nMERCADOPAGO_PUBLIC_KEY=$newPublicKey";
            }
            
            file_put_contents($envFile, $envContent);
            echo "✅ Archivo .env actualizado\n";
        }
        
        echo "\n🎉 ¡Credenciales actualizadas exitosamente!\n";
        echo "Ahora puedes probar el flujo de pago en sandbox\n";
        
    } catch (Exception $e) {
        echo "❌ Error al actualizar credenciales: " . $e->getMessage() . "\n";
    }
}
