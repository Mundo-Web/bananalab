<?php
/**
 * Diagnóstico completo del error "No pudimos procesar tu pago" en sandbox
 * 
 * Este error ocurre principalmente por:
 * 1. Usar la misma cuenta de prueba para vendedor y comprador
 * 2. Usar credenciales mezcladas (producción real + sandbox)
 * 3. Datos de payer incorrectos o conflictivos
 * 4. Configuración incorrecta de la aplicación en MercadoPago
 */

echo "=== DIAGNÓSTICO DE ERROR DE PAGO EN SANDBOX ===\n\n";

// 1. Verificar variables de entorno
echo "1. VERIFICANDO VARIABLES DE ENTORNO:\n";
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    
    // Buscar credenciales de MercadoPago
    preg_match('/MERCADOPAGO_ACCESS_TOKEN=(.+)/', $envContent, $accessToken);
    preg_match('/MERCADOPAGO_PUBLIC_KEY=(.+)/', $envContent, $publicKey);
    
    if (!empty($accessToken[1])) {
        $token = trim($accessToken[1]);
        echo "   - Access Token: " . substr($token, 0, 20) . "...\n";
        
        // Verificar si es token de producción de cuenta de prueba (correcto para sandbox)
        if (strpos($token, 'APP_USR-') === 0) {
            echo "   ✅ Token de producción de cuenta de prueba (CORRECTO para sandbox)\n";
        } elseif (strpos($token, 'TEST-') === 0) {
            echo "   ❌ Token de test (INCORRECTO - usar token de producción de cuenta de prueba)\n";
        } else {
            echo "   ⚠️  Token no reconocido - verificar origen\n";
        }
    }
    
    if (!empty($publicKey[1])) {
        $pubKey = trim($publicKey[1]);
        echo "   - Public Key: " . substr($pubKey, 0, 20) . "...\n";
        
        if (strpos($pubKey, 'APP_USR-') === 0) {
            echo "   ✅ Public Key de producción de cuenta de prueba (CORRECTO)\n";
        } elseif (strpos($pubKey, 'TEST-') === 0) {
            echo "   ❌ Public Key de test (INCORRECTO)\n";
        } else {
            echo "   ⚠️  Public Key no reconocido\n";
        }
    }
} else {
    echo "   ❌ Archivo .env no encontrado\n";
}

echo "\n";

// 2. Probar conexión con API de MercadoPago
echo "2. PROBANDO CONEXIÓN CON MERCADOPAGO:\n";

if (!empty($accessToken[1])) {
    $token = trim($accessToken[1]);
    
    // Hacer petición a /v1/account para verificar la cuenta
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/v1/account');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
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
        echo "   - Site ID: " . ($accountData['site_id'] ?? 'N/A') . "\n";
        
        // Verificar si es cuenta de prueba
        if (isset($accountData['is_test']) && $accountData['is_test']) {
            echo "   ✅ Es una cuenta de prueba (CORRECTO para sandbox)\n";
        } else {
            echo "   ❌ NO es una cuenta de prueba (PELIGRO - cuenta real)\n";
        }
    } else {
        echo "   ❌ Error en conexión: HTTP $httpCode\n";
        echo "   Response: $response\n";
    }
} else {
    echo "   ❌ No hay access token para probar\n";
}

echo "\n";

// 3. Verificar configuración de base de datos
echo "3. VERIFICANDO CONFIGURACIÓN EN BASE DE DATOS:\n";

try {
    $pdo = new PDO('mysql:host=localhost;dbname=bananalab_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verificar tabla de configuraciones
    $stmt = $pdo->query("SHOW TABLES LIKE 'configurations'");
    if ($stmt->rowCount() > 0) {
        $stmt = $pdo->query("SELECT * FROM configurations WHERE config_key LIKE '%mercadopago%'");
        $configs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($configs) > 0) {
            echo "   Configuraciones de MercadoPago en BD:\n";
            foreach ($configs as $config) {
                echo "   - {$config['config_key']}: " . substr($config['config_value'], 0, 20) . "...\n";
            }
        } else {
            echo "   ✅ No hay configuraciones de MercadoPago en BD (usando .env)\n";
        }
    } else {
        echo "   ✅ Tabla configurations no existe (usando .env)\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ Error conectando a BD: " . $e->getMessage() . "\n";
}

echo "\n";

// 4. Generar URLs de guías de solución
echo "4. GUÍAS DE SOLUCIÓN:\n";
echo "   📖 Guía completa: http://localhost/bananalab/public/guia-configuracion-checkout-pro.html\n";
echo "   🔧 Generador de credenciales: http://localhost/bananalab/public/mercadopago-credentials-generator.html\n";
echo "   🧪 Obtener credenciales test: http://localhost/bananalab/public/obtener-credenciales-test.html\n";

echo "\n";

// 5. Instrucciones específicas para solucionar el error
echo "5. SOLUCIÓN PASO A PASO:\n";
echo "   ❗ IMPORTANTE: NUNCA uses tu tarjeta real en sandbox\n\n";

echo "   Paso 1: Verificar cuentas de prueba\n";
echo "   - Ve a: https://www.mercadopago.com.ar/developers/panel/test-users\n";
echo "   - Asegúrate de tener 2 cuentas: una VENDEDOR y una COMPRADOR\n";
echo "   - Deben ser cuentas DIFERENTES\n\n";

echo "   Paso 2: Configurar credenciales correctas\n";
echo "   - Usa las credenciales de PRODUCCIÓN de la cuenta VENDEDOR\n";
echo "   - Las credenciales deben empezar con 'APP_USR-'\n";
echo "   - NO uses las credenciales de TEST (que empiezan con 'TEST-')\n\n";

echo "   Paso 3: Usar tarjetas de prueba oficiales\n";
echo "   - Visa: 4509 9535 6623 3704\n";
echo "   - Mastercard: 5031 7557 3453 0604\n";
echo "   - Código seguridad: 123\n";
echo "   - Fecha vencimiento: cualquier fecha futura\n\n";

echo "   Paso 4: Datos del comprador\n";
echo "   - Usa el email de la cuenta de prueba COMPRADOR\n";
echo "   - O usa un email ficticio como test@test.com\n";
echo "   - NO uses el mismo email del vendedor\n\n";

echo "=== FIN DEL DIAGNÓSTICO ===\n";
echo "Ejecuta este script desde el navegador o terminal para ver el diagnóstico completo.\n";
?>
