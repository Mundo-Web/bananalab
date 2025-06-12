<?php
/**
 * Verificar y actualizar credenciales de MercadoPago en base de datos
 * Tabla: payment_methods, slug: mercadopago
 */

echo "=== VERIFICANDO CREDENCIALES EN BASE DE DATOS ===\n\n";

try {
    $pdo = new PDO('mysql:host=localhost;dbname=bananalab_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "1. CONECTADO A BASE DE DATOS\n\n";
    
    // Verificar tabla payment_methods
    echo "2. VERIFICANDO TABLA payment_methods:\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'payment_methods'");
    if ($stmt->rowCount() == 0) {
        die("❌ Tabla 'payment_methods' no existe\n");
    }
    echo "   ✅ Tabla payment_methods existe\n\n";
    
    // Buscar registro de MercadoPago
    echo "3. BUSCANDO REGISTRO DE MERCADOPAGO:\n";
    $stmt = $pdo->prepare("SELECT * FROM payment_methods WHERE slug = 'mercadopago'");
    $stmt->execute();
    $mercadopago = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$mercadopago) {
        echo "   ❌ No se encontró registro con slug 'mercadopago'\n";
        
        // Mostrar todos los registros para debug
        echo "\n   Registros disponibles en payment_methods:\n";
        $stmt = $pdo->query("SELECT id, name, slug FROM payment_methods");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "   - ID: {$row['id']}, Name: {$row['name']}, Slug: {$row['slug']}\n";
        }
        exit;
    }
    
    echo "   ✅ Registro de MercadoPago encontrado\n";
    echo "   - ID: {$mercadopago['id']}\n";
    echo "   - Name: {$mercadopago['name']}\n";
    echo "   - Slug: {$mercadopago['slug']}\n";
    echo "   - Status: " . ($mercadopago['is_active'] ? 'Activo' : 'Inactivo') . "\n\n";
    
    // Verificar estructura de credenciales
    echo "4. VERIFICANDO CREDENCIALES ACTUALES:\n";
    
    // Las credenciales pueden estar en diferentes campos
    $possibleFields = ['credentials', 'config', 'settings', 'api_credentials', 'data'];
    $credentialsData = null;
    $credentialsField = null;
    
    foreach ($possibleFields as $field) {
        if (isset($mercadopago[$field]) && !empty($mercadopago[$field])) {
            $credentialsField = $field;
            $credentialsData = $mercadopago[$field];
            break;
        }
    }
    
    if (!$credentialsData) {
        echo "   ❌ No se encontraron credenciales en campos comunes\n";
        echo "   Campos disponibles:\n";
        foreach ($mercadopago as $key => $value) {
            if ($value) {
                echo "   - $key: " . substr($value, 0, 50) . "...\n";
            }
        }
        exit;
    }
    
    echo "   ✅ Credenciales encontradas en campo: $credentialsField\n";
    
    // Intentar decodificar JSON
    $credentials = json_decode($credentialsData, true);
    if (!$credentials) {
        echo "   ❌ Error decodificando JSON de credenciales\n";
        echo "   Contenido raw: $credentialsData\n";
        exit;
    }
    
    echo "   ✅ Credenciales decodificadas exitosamente\n\n";
    
    // Mostrar credenciales actuales
    echo "5. CREDENCIALES ACTUALES:\n";
    foreach ($credentials as $key => $value) {
        if (is_string($value) && strlen($value) > 0) {
            $displayValue = strlen($value) > 20 ? substr($value, 0, 20) . '...' : $value;
            echo "   - $key: $displayValue\n";
            
            // Verificar tipo de credencial
            if (strpos($value, 'TEST-') === 0) {
                echo "     ❌ Credencial de TEST (INCORRECTO para sandbox)\n";
            } elseif (strpos($value, 'APP_USR-') === 0) {
                echo "     ✅ Credencial de producción de cuenta de prueba (CORRECTO)\n";
            }
        }
    }
    
    echo "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit;
}

// Mostrar las cuentas de prueba proporcionadas
echo "6. CUENTAS DE PRUEBA PROPORCIONADAS:\n";
echo "   VENDEDOR:\n";
echo "   - Usuario: TESTUSER8159005\n";
echo "   - Password: mzt0balbcO\n";
echo "   - País: Perú\n\n";

echo "   COMPRADOR:\n";
echo "   - Usuario: TESTUSER906372783\n";
echo "   - Password: MSBck6OX1m\n";
echo "   - País: Perú\n\n";

echo "7. PASOS PARA OBTENER CREDENCIALES CORRECTAS:\n";
echo "   1. Inicia sesión en MercadoPago con cuenta VENDEDOR (TESTUSER8159005)\n";
echo "   2. Ve a: https://www.mercadopago.com.pe/developers/panel/app\n";
echo "   3. Crea una aplicación\n";
echo "   4. Ve a 'Credenciales de producción' (NO 'de prueba')\n";
echo "   5. Copia Access Token y Public Key (deben empezar con APP_USR-)\n\n";

echo "8. ¿QUIERES ACTUALIZAR LAS CREDENCIALES AHORA? (y/n): ";
$update = trim(fgets(STDIN));

if (strtolower($update) === 'y' || strtolower($update) === 'yes') {
    echo "\n=== ACTUALIZANDO CREDENCIALES ===\n\n";
    
    echo "Ingresa el nuevo Access Token (debe empezar con APP_USR-): ";
    $newAccessToken = trim(fgets(STDIN));
    
    if (strpos($newAccessToken, 'APP_USR-') !== 0) {
        die("❌ Error: El Access Token debe empezar con 'APP_USR-'\n");
    }
    
    echo "Ingresa el nuevo Public Key (debe empezar con APP_USR-): ";
    $newPublicKey = trim(fgets(STDIN));
    
    if (strpos($newPublicKey, 'APP_USR-') !== 0) {
        die("❌ Error: El Public Key debe empezar con 'APP_USR-'\n");
    }
    
    // Actualizar credenciales
    $credentials['access_token'] = $newAccessToken;
    $credentials['public_key'] = $newPublicKey;
    $credentials['client_id'] = $newPublicKey; // A veces se usa client_id
    
    // Si hay campos específicos para sandbox
    if (isset($credentials['sandbox_access_token'])) {
        $credentials['sandbox_access_token'] = $newAccessToken;
    }
    if (isset($credentials['sandbox_public_key'])) {
        $credentials['sandbox_public_key'] = $newPublicKey;
    }
    
    $newCredentialsJson = json_encode($credentials, JSON_PRETTY_PRINT);
    
    // Actualizar en base de datos
    $stmt = $pdo->prepare("UPDATE payment_methods SET $credentialsField = ? WHERE slug = 'mercadopago'");
    $result = $stmt->execute([$newCredentialsJson]);
    
    if ($result) {
        echo "   ✅ Credenciales actualizadas exitosamente en base de datos\n\n";
        
        // Verificar la actualización
        echo "9. VERIFICANDO ACTUALIZACIÓN:\n";
        $stmt = $pdo->prepare("SELECT $credentialsField FROM payment_methods WHERE slug = 'mercadopago'");
        $stmt->execute();
        $updated = $stmt->fetchColumn();
        $updatedCreds = json_decode($updated, true);
        
        foreach ($updatedCreds as $key => $value) {
            if (is_string($value) && strlen($value) > 0) {
                $displayValue = strlen($value) > 20 ? substr($value, 0, 20) . '...' : $value;
                echo "   - $key: $displayValue\n";
            }
        }
        
        echo "\n✅ CREDENCIALES ACTUALIZADAS CORRECTAMENTE\n";
        echo "🔄 Ahora prueba el flujo de pago con las tarjetas de prueba\n";
        
    } else {
        echo "   ❌ Error actualizando credenciales en base de datos\n";
    }
}

echo "\n=== FIN ===\n";
?>
