<?php
/**
 * Probar credenciales actuales de MercadoPago desde base de datos
 */

echo "=== PROBANDO CREDENCIALES ACTUALES ===\n\n";

try {
    $pdo = new PDO('mysql:host=localhost;dbname=bananalab_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener credenciales de la base de datos
    $stmt = $pdo->prepare("SELECT configuration FROM payment_methods WHERE slug = 'mercadopago'");
    $stmt->execute();
    $configJson = $stmt->fetchColumn();
    
    if (!$configJson) {
        echo "❌ No se encontró configuración de MercadoPago\n";
        exit;
    }
    
    $config = json_decode($configJson, true);
    if (!$config) {
        echo "❌ Error decodificando configuración\n";
        exit;
    }
    
    $accessToken = $config['access_token'] ?? '';
    $publicKey = $config['public_key'] ?? '';
    
    echo "1. CREDENCIALES ACTUALES:\n";
    echo "   Access Token: " . substr($accessToken, 0, 30) . "...\n";
    echo "   Public Key: " . substr($publicKey, 0, 30) . "...\n\n";
    
    if (strpos($accessToken, 'APP_USR-') === 0) {
        echo "   ✅ Access Token formato correcto (APP_USR-)\n";
    } else {
        echo "   ❌ Access Token formato incorrecto\n";
    }
    
    if (strpos($publicKey, 'APP_USR-') === 0) {
        echo "   ✅ Public Key formato correcto (APP_USR-)\n";
    } else {
        echo "   ❌ Public Key formato incorrecto\n";
    }
    
    echo "\n2. PROBANDO CON API MERCADOPAGO:\n";
    
    // Probar con endpoint /v1/account
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
    
    echo "   Endpoint: /v1/account\n";
    echo "   HTTP Code: $httpCode\n";
    
    if ($httpCode === 200) {
        $accountData = json_decode($response, true);
        echo "   ✅ Conexión exitosa\n";
        echo "   - Account ID: " . ($accountData['id'] ?? 'N/A') . "\n";
        echo "   - Email: " . ($accountData['email'] ?? 'N/A') . "\n";
        echo "   - Site ID: " . ($accountData['site_id'] ?? 'N/A') . "\n";
        echo "   - Country: " . ($accountData['country_id'] ?? 'N/A') . "\n";
        
        if (isset($accountData['is_test']) && $accountData['is_test']) {
            echo "   ✅ Es cuenta de prueba (CORRECTO)\n";
        } else {
            echo "   ⚠️  No detectado como cuenta de prueba\n";
        }
        
        // Si funciona la API, probar crear una preferencia de prueba
        echo "\n3. PROBANDO CREACIÓN DE PREFERENCIA:\n";
        
        $preferenceData = [
            'items' => [
                [
                    'title' => 'Producto de Prueba',
                    'quantity' => 1,
                    'unit_price' => 100.00
                ]
            ],
            'payer' => [
                'email' => 'test@test.com'
            ],
            'back_urls' => [
                'success' => 'http://localhost/bananalab/success',
                'failure' => 'http://localhost/bananalab/failure',
                'pending' => 'http://localhost/bananalab/pending'
            ],
            'auto_return' => 'approved'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/checkout/preferences');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($preferenceData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $prefResponse = curl_exec($ch);
        $prefHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "   HTTP Code: $prefHttpCode\n";
        
        if ($prefHttpCode === 201) {
            $prefData = json_decode($prefResponse, true);
            echo "   ✅ Preferencia creada exitosamente\n";
            echo "   - ID: " . ($prefData['id'] ?? 'N/A') . "\n";
            echo "   - Init Point: " . (isset($prefData['init_point']) ? 'Disponible' : 'No disponible') . "\n";
            echo "   - Sandbox Init Point: " . (isset($prefData['sandbox_init_point']) ? 'Disponible' : 'No disponible') . "\n";
            
            if (isset($prefData['init_point'])) {
                echo "\n   🔗 URL de pago: " . $prefData['init_point'] . "\n";
            }
            
        } else {
            echo "   ❌ Error creando preferencia\n";
            echo "   Response: $prefResponse\n";
        }
        
    } elseif ($httpCode === 404) {
        echo "   ❌ Error 404 - Recurso no encontrado\n";
        echo "   Posibles causas:\n";
        echo "   - Credenciales no válidas para el país (Perú)\n";
        echo "   - Access token expirado o incorrecto\n";
        echo "   - Cuenta de prueba mal configurada\n";
        echo "   Response: $response\n";
        
    } elseif ($httpCode === 401) {
        echo "   ❌ Error 401 - No autorizado\n";
        echo "   - Verificar que las credenciales sean correctas\n";
        echo "   Response: $response\n";
        
    } else {
        echo "   ❌ Error HTTP $httpCode\n";
        echo "   Response: $response\n";
    }
    
    echo "\n4. RECOMENDACIONES:\n";
    
    if ($httpCode !== 200) {
        echo "   🔄 Las credenciales necesitan ser actualizadas\n";
        echo "   📋 Pasos:\n";
        echo "   1. Inicia sesión con TESTUSER8159005 / mzt0balbcO\n";
        echo "   2. Ve a https://www.mercadopago.com.pe/developers/panel/app\n";
        echo "   3. Obtén nuevas credenciales de PRODUCCIÓN\n";
        echo "   4. Actualízalas usando la interfaz web\n\n";
        
        echo "   🌐 Interfaz web: http://localhost/bananalab/public/obtener-credenciales-peru.html\n";
    } else {
        echo "   ✅ Credenciales funcionan correctamente\n";
        echo "   💡 Si hay errores de pago, verificar:\n";
        echo "   - Usar cuenta COMPRADOR diferente (TESTUSER906372783)\n";
        echo "   - Email del payer diferente al del vendedor\n";
        echo "   - Tarjetas de prueba oficiales de Perú\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DE LA PRUEBA ===\n";
?>
