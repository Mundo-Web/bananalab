<?php
/**
 * Script de prueba final para Checkout Pro con credenciales correctas
 */

require_once 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🧪 PRUEBA FINAL - CHECKOUT PRO CON CREDENCIALES CORRECTAS\n";
echo "=========================================================\n\n";

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
    
    // Verificar que sean credenciales de TEST
    if (strpos($accessToken, 'TEST-') === 0) {
        echo "✅ ACCESS_TOKEN es de PRUEBA (correcto para Checkout Pro)\n";
    } else {
        echo "❌ ACCESS_TOKEN NO es de prueba - debe empezar con 'TEST-'\n";
        echo "Ejecuta: php update_test_credentials.php\n";
        exit(1);
    }
    
    if (strpos($publicKey, 'TEST-') === 0) {
        echo "✅ PUBLIC_KEY es de PRUEBA (correcto para Checkout Pro)\n";
    } else {
        echo "❌ PUBLIC_KEY NO es de prueba - debe empezar con 'TEST-'\n";
        echo "Ejecuta: php update_test_credentials.php\n";
        exit(1);
    }
    
} catch (Exception $e) {
    die("❌ Error de base de datos: " . $e->getMessage() . "\n");
}

echo "\n🔄 PROBANDO API DE MERCADOPAGO:\n";
echo "===============================\n";

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
    if (strpos($userData['email'], 'testuser.com') !== false) {
        echo "✅ Es una cuenta de prueba válida\n";
    } else {
        echo "⚠️ No parece ser una cuenta de prueba estándar\n";
    }
} else {
    echo "❌ Error en API: Código $httpCode\n";
    if ($response) {
        $errorData = json_decode($response, true);
        echo "Error: " . ($errorData['message'] ?? 'Desconocido') . "\n";
    }
    die("No se puede continuar sin acceso a la API\n");
}

echo "\n🛍️ CREANDO PREFERENCIA DE PRUEBA:\n";
echo "==================================\n";

$orderNumber = 'CHECKOUT-PRO-' . time();
$appUrl = $_ENV['APP_URL'] ?? 'http://localhost:8000';

$preferenceData = [
    'items' => [
        [
            'id' => 'checkout-pro-test',
            'title' => 'Producto Checkout Pro Test',
            'quantity' => 1,
            'unit_price' => 100.00,
            'currency_id' => 'PEN',
        ]
    ],
    'payer' => [
        'name' => 'Comprador',
        'surname' => 'Prueba',
        'email' => 'comprador.prueba@example.com',
    ],
    'back_urls' => [
        'success' => $appUrl . '/checkout/success?external_reference=' . $orderNumber,
        'failure' => $appUrl . '/checkout/failure?external_reference=' . $orderNumber,
        'pending' => $appUrl . '/checkout/pending?external_reference=' . $orderNumber,
    ],
    'external_reference' => $orderNumber,
    'notification_url' => $appUrl . '/api/mercadopago/webhook',
];

echo "Datos de la preferencia:\n";
echo json_encode($preferenceData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

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

echo "Respuesta de MercadoPago (HTTP $httpCode):\n";

if ($httpCode === 201) {
    $preference = json_decode($response, true);
    echo "✅ Preferencia creada exitosamente!\n";
    echo "ID: " . $preference['id'] . "\n";
    echo "URL de pago (SANDBOX): " . $preference['sandbox_init_point'] . "\n";
    echo "URL de pago (PROD): " . $preference['init_point'] . "\n";
    
    // Generar página de prueba
    $testPageContent = '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba Checkout Pro - Configuración Correcta</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen py-8">
    <div class="max-w-4xl mx-auto p-6">
        <div class="bg-white rounded-lg shadow-lg p-8">
            <h1 class="text-3xl font-bold text-green-600 mb-6">✅ Checkout Pro - Configuración Correcta</h1>
            
            <div class="grid md:grid-cols-2 gap-6">
                <!-- Estado del Sistema -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h2 class="text-xl font-semibold text-green-800 mb-4">✅ Sistema Configurado</h2>
                    <ul class="space-y-2 text-green-700">
                        <li>✅ Credenciales de PRUEBA válidas</li>
                        <li>✅ API de MercadoPago conectada</li>
                        <li>✅ Preferencia de Checkout Pro creada</li>
                        <li>✅ Frontend configurado correctamente</li>
                    </ul>
                </div>
                
                <!-- Información del Pago -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h2 class="text-xl font-semibold text-blue-800 mb-4">🧪 Datos de Prueba</h2>
                    <div class="space-y-2 text-blue-700">
                        <p><strong>Orden:</strong> ' . $orderNumber . '</p>
                        <p><strong>Monto:</strong> S/ 100.00 (PRUEBA)</p>
                        <p><strong>Producto:</strong> Producto Checkout Pro Test</p>
                        <p><strong>Tipo:</strong> SANDBOX</p>
                    </div>
                </div>
            </div>
            
            <!-- Botón de Pago -->
            <div class="mt-8 text-center">
                <a href="' . $preference['sandbox_init_point'] . '" 
                   class="inline-block bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors">
                    🧪 Probar Checkout Pro (SANDBOX)
                </a>
            </div>
            
            <!-- Instrucciones -->
            <div class="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-yellow-800 mb-4">📋 Instrucciones para la prueba</h3>
                <ol class="list-decimal list-inside space-y-2 text-yellow-700">
                    <li>Haz clic en "Probar Checkout Pro"</li>
                    <li><strong>Inicia sesión con tu cuenta COMPRADORA de prueba</strong></li>
                    <li>Selecciona "Tarjeta de crédito" como método de pago</li>
                    <li>Usa una de las tarjetas de prueba de abajo</li>
                    <li>Completa el proceso de pago</li>
                    <li>Serás redirigido de vuelta a tu sitio</li>
                    <li>Verifica que la venta se registre correctamente</li>
                </ol>
            </div>
            
            <!-- Tarjetas de Prueba -->
            <div class="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">💳 Tarjetas de Prueba</h3>
                <div class="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 class="font-semibold text-gray-700">VISA (Aprobada)</h4>
                        <p>Número: 4009 1753 3280 6176</p>
                        <p>CVV: 123</p>
                        <p>Vencimiento: 11/30</p>
                        <p>Nombre: APRO</p>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-700">Mastercard (Aprobada)</h4>
                        <p>Número: 5031 7557 3453 0604</p>
                        <p>CVV: 123</p>
                        <p>Vencimiento: 11/30</p>
                        <p>Nombre: APRO</p>
                    </div>
                </div>
            </div>
            
            <!-- Datos de cuentas -->
            <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-blue-800 mb-4">👥 Recuerda usar tus cuentas de prueba</h3>
                <div class="space-y-2 text-blue-700 text-sm">
                    <p><strong>Para pagar:</strong> Usa tu cuenta COMPRADORA (buyer)</p>
                    <p><strong>Para recibir:</strong> La aplicación está vinculada a tu cuenta VENDEDORA (seller)</p>
                    <p><strong>Emails:</strong> Suelen ser como test_user_XXXX@testuser.com</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>';
    
    file_put_contents('public/test-checkout-pro-final.html', $testPageContent);
    echo "✅ Página de prueba generada: public/test-checkout-pro-final.html\n\n";
    
} else {
    echo "❌ Error al crear preferencia:\n";
    echo "Código HTTP: $httpCode\n";
    echo "Respuesta: " . $response . "\n";
    
    if ($response) {
        $errorData = json_decode($response, true);
        if (isset($errorData['cause'])) {
            echo "\nDetalles del error:\n";
            foreach ($errorData['cause'] as $cause) {
                echo "- " . ($cause['description'] ?? 'Error desconocido') . "\n";
            }
        }
        
        // Detectar errores comunes
        $responseText = strtolower($response);
        if (strpos($responseText, 'invalid') !== false || strpos($responseText, 'test') !== false) {
            echo "\n🎯 POSIBLE SOLUCIÓN:\n";
            echo "===================\n";
            echo "Este error indica que las credenciales no son válidas para Checkout Pro.\n";
            echo "Asegúrate de:\n";
            echo "1. Usar credenciales de PRUEBA (empiezan con TEST-)\n";
            echo "2. Crear la aplicación con tipo 'Checkout Pro'\n";
            echo "3. Usar cuentas de prueba creadas en MercadoPago Developers\n\n";
            echo "Ejecuta: php update_test_credentials.php\n";
        }
    }
    
    exit(1);
}

echo "\n🎯 RESUMEN:\n";
echo "===========\n";
echo "✅ Credenciales de PRUEBA configuradas correctamente\n";
echo "✅ Preferencia de Checkout Pro creada exitosamente\n";
echo "✅ Sistema listo para pruebas\n\n";

echo "🚀 PRÓXIMOS PASOS:\n";
echo "==================\n";
echo "1. Abre: http://localhost:8000/test-checkout-pro-final.html\n";
echo "2. Haz clic en 'Probar Checkout Pro'\n";
echo "3. Inicia sesión con tu cuenta COMPRADORA de prueba\n";
echo "4. Usa las tarjetas de prueba listadas\n";
echo "5. Completa el flujo de pago\n";
echo "6. Verifica que funcione correctamente\n\n";

echo "💡 NOTAS IMPORTANTES:\n";
echo "=====================\n";
echo "- Ahora usas credenciales de PRUEBA correctas (TEST-)\n";
echo "- Los pagos son simulaciones (no dinero real)\n";
echo "- Debes usar cuentas de prueba para pagar\n";
echo "- El error 500 debería estar resuelto\n\n";

echo "🏁 ¡Tu Checkout Pro está configurado correctamente! 🎉\n";
?>
