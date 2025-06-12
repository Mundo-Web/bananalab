<?php
/**
 * Diagnóstico del error E216 "invalid esc" en MercadoPago
 * Este error ocurre en la tokenización de tarjetas en el frontend
 */

echo "=== DIAGNÓSTICO ERROR E216 - INVALID ESC ===\n\n";

echo "📋 ANÁLISIS DEL ERROR:\n";
echo "   Código: E216\n";
echo "   Descripción: invalid esc\n";
echo "   Endpoint: /v1/card_tokens\n";
echo "   Método: POST\n";
echo "   Public Key: APP_USR-4aea3c0f-996b-430e-8545-b7b1335b2160\n\n";

echo "🔍 POSIBLES CAUSAS:\n";
echo "   1. Configuración incorrecta del SDK de MercadoPago en el frontend\n";
echo "   2. Public Key mal configurada en el frontend\n";
echo "   3. Datos de la tarjeta mal formateados\n";
echo "   4. Problemas con la validación de CVV (ESC = Extended Security Code)\n";
echo "   5. Configuración de país incorrecta\n\n";

echo "📝 VERIFICACIONES NECESARIAS:\n";
echo "   ✓ Verificar configuración del SDK MercadoPago en frontend\n";
echo "   ✓ Verificar que se use la Public Key correcta\n";
echo "   ✓ Verificar formato de datos de tarjeta\n";
echo "   ✓ Verificar configuración de país (Perú - PE)\n\n";

// Verificar si las credenciales están correctas en la BD
try {
    $pdo = new PDO('mysql:host=localhost;dbname=bananalab_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->prepare("SELECT configuration FROM payment_methods WHERE slug = 'mercadopago'");
    $stmt->execute();
    $configJson = $stmt->fetchColumn();
    
    if ($configJson) {
        $config = json_decode($configJson, true);
        $publicKey = $config['public_key'] ?? '';
        
        echo "🔑 PUBLIC KEY EN BASE DE DATOS:\n";
        echo "   Stored: " . substr($publicKey, 0, 30) . "...\n";
        echo "   Used in error: APP_USR-4aea3c0f-996b-430e-8545-b7b1335b2160\n";
        
        if ($publicKey === 'APP_USR-4aea3c0f-996b-430e-8545-b7b1335b2160') {
            echo "   ✅ Public Key coincide con la usada en el error\n";
        } else {
            echo "   ❌ Public Key NO coincide - hay inconsistencia\n";
            echo "   🔄 Necesita actualización en frontend o backend\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Error verificando BD: " . $e->getMessage() . "\n";
}

echo "\n🛠️ ARCHIVOS A REVISAR:\n";
echo "   1. Frontend que maneja el pago (React/JavaScript)\n";
echo "   2. Configuración del SDK MercadoPago\n";
echo "   3. Controlador que pasa la Public Key al frontend\n";
echo "   4. Validación de datos de tarjeta\n\n";

echo "🎯 SOLUCIONES PRIORITARIAS:\n";
echo "   1. Verificar configuración del SDK en frontend\n";
echo "   2. Asegurar que el país sea 'PE' (Perú)\n";
echo "   3. Validar formato de datos de tarjeta\n";
echo "   4. Verificar que el CVV se envíe correctamente\n\n";

echo "📚 REFERENCIAS:\n";
echo "   - Error E216: https://www.mercadopago.com.pe/developers/es/docs/checkout-api/error-codes\n";
echo "   - SDK JS: https://www.mercadopago.com.pe/developers/es/docs/sdks-library/client-side/javascript\n\n";

echo "🔍 ARCHIVOS DE INVESTIGACIÓN CREADOS:\n";
echo "   - debug_frontend_mercadopago.html (para debuggear frontend)\n";
echo "   - fix_e216_error.js (script de corrección)\n";
echo "   - test_card_tokenization.html (prueba de tokenización)\n\n";

echo "=== EJECUTAR DIAGNÓSTICO FRONTEND ===\n";
echo "Abre: http://localhost/bananalab/public/debug_frontend_mercadopago.html\n";
?>
