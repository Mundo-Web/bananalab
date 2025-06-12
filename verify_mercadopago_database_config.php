<?php
/**
 * Verificar y actualizar credenciales de MercadoPago en el campo 'configuration'
 */

echo "=== VERIFICANDO CREDENCIALES MERCADOPAGO EN BD ===\n\n";

try {
    $pdo = new PDO('mysql:host=localhost;dbname=bananalab_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener configuración actual
    $stmt = $pdo->prepare("SELECT configuration FROM payment_methods WHERE slug = 'mercadopago'");
    $stmt->execute();
    $configJson = $stmt->fetchColumn();
    
    if (!$configJson) {
        die("❌ No se encontró configuración de MercadoPago\n");
    }
    
    echo "1. CONFIGURACIÓN ACTUAL:\n";
    $config = json_decode($configJson, true);
    
    if (!$config) {
        die("❌ Error decodificando configuración JSON\n");
    }
    
    // Mostrar credenciales actuales
    foreach ($config as $key => $value) {
        if (is_string($value)) {
            $displayValue = strlen($value) > 30 ? substr($value, 0, 30) . '...' : $value;
            echo "   - $key: $displayValue\n";
            
            // Verificar tipo de credencial
            if (in_array($key, ['access_token', 'public_key', 'client_id']) && strpos($value, 'TEST-') === 0) {
                echo "     ❌ Credencial de TEST (INCORRECTO para sandbox)\n";
            } elseif (in_array($key, ['access_token', 'public_key', 'client_id']) && strpos($value, 'APP_USR-') === 0) {
                echo "     ✅ Credencial de producción de cuenta de prueba (CORRECTO)\n";
            }
        }
    }
    
    echo "\n2. CUENTAS DE PRUEBA DISPONIBLES:\n";
    echo "   VENDEDOR (para obtener credenciales):\n";
    echo "   - Usuario: TESTUSER8159005\n";
    echo "   - Password: mzt0balbcO\n";
    echo "   - País: Perú\n\n";
    
    echo "   COMPRADOR (para hacer compras de prueba):\n";
    echo "   - Usuario: TESTUSER906372783\n";
    echo "   - Password: MSBck6OX1m\n";
    echo "   - País: Perú\n\n";
    
    // Verificar si las credenciales están correctas
    $accessToken = $config['access_token'] ?? '';
    $publicKey = $config['public_key'] ?? '';
    
    $needsUpdate = false;
    
    if (strpos($accessToken, 'TEST-') === 0) {
        echo "❌ PROBLEMA: Access Token es de TEST, necesita ser de producción de cuenta de prueba\n";
        $needsUpdate = true;
    }
    
    if (strpos($publicKey, 'TEST-') === 0) {
        echo "❌ PROBLEMA: Public Key es de TEST, necesita ser de producción de cuenta de prueba\n";
        $needsUpdate = true;
    }
    
    if (!$needsUpdate && strpos($accessToken, 'APP_USR-') === 0 && strpos($publicKey, 'APP_USR-') === 0) {
        echo "✅ Las credenciales parecen correctas (APP_USR-)\n\n";
        
        // Probar las credenciales con la API
        echo "3. PROBANDO CREDENCIALES CON API MERCADOPAGO:\n";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/v1/account');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $accountData = json_decode($response, true);
            echo "   ✅ Conexión exitosa con MercadoPago\n";
            echo "   - Account ID: " . ($accountData['id'] ?? 'N/A') . "\n";
            echo "   - Email: " . ($accountData['email'] ?? 'N/A') . "\n";
            echo "   - Site ID: " . ($accountData['site_id'] ?? 'N/A') . "\n";
            
            if (isset($accountData['is_test']) && $accountData['is_test']) {
                echo "   ✅ Es una cuenta de prueba (CORRECTO para sandbox)\n";
            } else {
                echo "   ⚠️  No se detectó como cuenta de prueba - verificar\n";
            }
            
            // Si las credenciales funcionan, el problema puede ser otro
            echo "\n4. DIAGNÓSTICO DEL ERROR DE PAGO:\n";
            echo "   Las credenciales están correctas. El error 'No pudimos procesar tu pago' puede deberse a:\n\n";
            
            echo "   a) Misma cuenta para vendedor y comprador:\n";
            echo "      - ❌ INCORRECTO: Usar TESTUSER8159005 para vender Y comprar\n";
            echo "      - ✅ CORRECTO: Usar TESTUSER8159005 para vender, TESTUSER906372783 para comprar\n\n";
            
            echo "   b) Datos del payer incorrectos:\n";
            echo "      - Verificar que el email del payer sea diferente al del vendedor\n";
            echo "      - Usar email de cuenta comprador o test@test.com\n\n";
            
            echo "   c) País incorrecto en configuración:\n";
            echo "      - Verificar que el site_id sea 'MPE' para Perú\n";
            echo "      - Current site_id: " . ($accountData['site_id'] ?? 'N/A') . "\n\n";
            
        } else {
            echo "   ❌ Error conectando con MercadoPago: HTTP $httpCode\n";
            echo "   Response: $response\n";
            $needsUpdate = true;
        }
    }
    
    if ($needsUpdate) {
        echo "\n3. PASOS PARA OBTENER CREDENCIALES CORRECTAS:\n";
        echo "   1. Ve a: https://www.mercadopago.com.pe/\n";
        echo "   2. Inicia sesión con cuenta VENDEDOR: TESTUSER8159005 / mzt0balbcO\n";
        echo "   3. Ve a: https://www.mercadopago.com.pe/developers/panel/app\n";
        echo "   4. Crea una aplicación\n";
        echo "   5. Ve a 'Credenciales de producción' (NO 'de prueba')\n";
        echo "   6. Copia las credenciales que empiecen con APP_USR-\n\n";
        
        echo "¿Quieres actualizar las credenciales ahora? (y/n): ";
        $update = trim(fgets(STDIN));
        
        if (strtolower($update) === 'y') {
            echo "\nIngresa el nuevo Access Token (APP_USR-...): ";
            $newAccessToken = trim(fgets(STDIN));
            
            echo "Ingresa el nuevo Public Key (APP_USR-...): ";
            $newPublicKey = trim(fgets(STDIN));
            
            if (strpos($newAccessToken, 'APP_USR-') !== 0 || strpos($newPublicKey, 'APP_USR-') !== 0) {
                die("❌ Las credenciales deben empezar con APP_USR-\n");
            }
            
            // Actualizar configuración
            $config['access_token'] = $newAccessToken;
            $config['public_key'] = $newPublicKey;
            $config['client_id'] = $newPublicKey;
            
            $newConfigJson = json_encode($config);
            
            $stmt = $pdo->prepare("UPDATE payment_methods SET configuration = ? WHERE slug = 'mercadopago'");
            $result = $stmt->execute([$newConfigJson]);
            
            if ($result) {
                echo "✅ Credenciales actualizadas exitosamente\n";
            } else {
                echo "❌ Error actualizando credenciales\n";
            }
        }
    }
    
    echo "\n5. DATOS DE PRUEBA PARA EL CHECKOUT:\n";
    echo "   Tarjetas de prueba oficiales:\n";
    echo "   - Visa: 4009 1753 3280 6176\n";
    echo "   - Mastercard: 5031 7557 3453 0604\n";
    echo "   - CVV: 123\n";
    echo "   - Fecha: cualquier fecha futura\n";
    echo "   - Email: TESTUSER906372783@testuser.com (cuenta comprador)\n\n";
    
    echo "6. VERIFICAR EN FRONTEND:\n";
    echo "   - Asegúrate de que el email del payer sea diferente al del vendedor\n";
    echo "   - Usa las cuentas de prueba correctas\n";
    echo "   - Verifica que se use la cuenta COMPRADOR para hacer la compra\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "=== FIN DEL DIAGNÓSTICO ===\n";
?>
