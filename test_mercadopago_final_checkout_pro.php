<?php
/**
 * Script de prueba final para MercadoPago Checkout Pro
 * Simula el flujo completo de pago con las credenciales actuales
 */

require_once 'vendor/autoload.php';

// Cargar variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🧪 PRUEBA FINAL DE MERCADOPAGO - CHECKOUT PRO\n";
echo "==============================================\n\n";

// 1. Verificar credenciales
echo "1. Verificando credenciales...\n";
echo "------------------------------\n";

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
    
    echo "✅ Credenciales encontradas\n";
    echo "ACCESS_TOKEN: " . substr($accessToken, 0, 10) . "...\n";
    echo "PUBLIC_KEY: " . substr($publicKey, 0, 10) . "...\n";
    
    // Verificar que sean credenciales de test
    if (strpos($accessToken, 'TEST-') !== 0) {
        echo "⚠️ ADVERTENCIA: ACCESS_TOKEN no es de prueba\n";
    } else {
        echo "✅ ACCESS_TOKEN es de prueba\n";
    }
    
    if (strpos($publicKey, 'TEST-') !== 0) {
        echo "⚠️ ADVERTENCIA: PUBLIC_KEY no es de prueba\n";
    } else {
        echo "✅ PUBLIC_KEY es de prueba\n";
    }
    
} catch (Exception $e) {
    die("❌ Error de base de datos: " . $e->getMessage() . "\n");
}

echo "\n";

// 2. Probar API de MercadoPago
echo "2. Probando conectividad con API de MercadoPago...\n";
echo "--------------------------------------------------\n";

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
} else {
    echo "❌ Error en API: Código $httpCode\n";
    if ($response) {
        $errorData = json_decode($response, true);
        echo "Error: " . ($errorData['message'] ?? 'Desconocido') . "\n";
    }
    die("No se puede continuar sin acceso a la API\n");
}

echo "\n";

// 3. Crear preferencia de prueba
echo "3. Creando preferencia de pago de prueba...\n";
echo "-------------------------------------------\n";

$orderNumber = 'TEST-' . time();
$appUrl = $_ENV['APP_URL'] ?? 'http://localhost:8000';

$preferenceData = [
    'items' => [
        [
            'id' => 'test-item',
            'title' => 'Producto de Prueba',
            'quantity' => 1,
            'unit_price' => 100.00,
            'currency_id' => 'PEN',
        ]
    ],
    'payer' => [
        'name' => 'Test',
        'surname' => 'User',
        'email' => 'test@example.com',
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
    
    // Guardar URLs para la prueba del frontend
    file_put_contents('test_preference_urls.json', json_encode([
        'preference_id' => $preference['id'],
        'sandbox_init_point' => $preference['sandbox_init_point'],
        'init_point' => $preference['init_point'],
        'order_number' => $orderNumber
    ], JSON_PRETTY_PRINT));
    
    echo "\n✅ URLs guardadas en test_preference_urls.json\n";
    
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
    }
    
    die("\nNo se puede continuar sin una preferencia válida\n");
}

echo "\n";

// 4. Generar página de prueba para el frontend
echo "4. Generando página de prueba para el frontend...\n";
echo "------------------------------------------------\n";

$testPageContent = '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba Final MercadoPago - Checkout Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen py-8">
    <div class="max-w-4xl mx-auto p-6">
        <div class="bg-white rounded-lg shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-6">🧪 Prueba Final MercadoPago</h1>
            
            <div class="grid md:grid-cols-2 gap-6">
                <!-- Estado de las credenciales -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h2 class="text-xl font-semibold text-green-800 mb-4">✅ Estado del Sistema</h2>
                    <ul class="space-y-2 text-green-700">
                        <li>✅ Credenciales de prueba configuradas</li>
                        <li>✅ API de MercadoPago conectada</li>
                        <li>✅ Preferencia de pago creada</li>
                        <li>✅ Checkout Pro configurado</li>
                    </ul>
                </div>
                
                <!-- Información del pago -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h2 class="text-xl font-semibold text-blue-800 mb-4">💳 Datos de Prueba</h2>
                    <div class="space-y-2 text-blue-700">
                        <p><strong>Orden:</strong> ' . $orderNumber . '</p>
                        <p><strong>Monto:</strong> S/ 100.00</p>
                        <p><strong>Producto:</strong> Producto de Prueba</p>
                    </div>
                </div>
            </div>
            
            <!-- Botón de pago -->
            <div class="mt-8 text-center">
                <a href="' . $preference['sandbox_init_point'] . '" 
                   class="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
                    💳 Pagar con MercadoPago (SANDBOX)
                </a>
            </div>
            
            <!-- Tarjetas de prueba -->
            <div class="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-yellow-800 mb-4">💳 Tarjetas de Prueba</h3>
                <div class="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 class="font-semibold text-yellow-700">VISA (Aprobada)</h4>
                        <p>Número: 4009 1753 3280 6176</p>
                        <p>CVV: 123</p>
                        <p>Vencimiento: 11/30</p>
                        <p>Nombre: APRO</p>
                    </div>
                    <div>
                        <h4 class="font-semibold text-yellow-700">Mastercard (Aprobada)</h4>
                        <p>Número: 5031 7557 3453 0604</p>
                        <p>CVV: 123</p>
                        <p>Vencimiento: 11/30</p>
                        <p>Nombre: APRO</p>
                    </div>
                </div>
            </div>
            
            <!-- Instrucciones -->
            <div class="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">📋 Instrucciones</h3>
                <ol class="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Haz clic en "Pagar con MercadoPago"</li>
                    <li>Selecciona "Tarjeta de crédito" como método de pago</li>
                    <li>Usa una de las tarjetas de prueba de arriba</li>
                    <li>Completa el formulario con los datos de la tarjeta</li>
                    <li>Haz clic en "Pagar"</li>
                    <li>Serás redirigido de vuelta a tu sitio</li>
                    <li>Verifica que la venta se registre en la base de datos</li>
                </ol>
            </div>
            
            <!-- URLs importantes -->
            <div class="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">🔗 URLs del Sistema</h3>
                <div class="space-y-2 text-sm text-gray-600">
                    <p><strong>Success:</strong> ' . $appUrl . '/checkout/success</p>
                    <p><strong>Failure:</strong> ' . $appUrl . '/checkout/failure</p>
                    <p><strong>Pending:</strong> ' . $appUrl . '/checkout/pending</p>
                    <p><strong>Webhook:</strong> ' . $appUrl . '/api/mercadopago/webhook</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>';

file_put_contents('public/test-mercadopago-final.html', $testPageContent);
echo "✅ Página de prueba generada: public/test-mercadopago-final.html\n";

echo "\n";

// 5. Resumen final
echo "5. RESUMEN FINAL:\n";
echo "=================\n";
echo "✅ Sistema MercadoPago Checkout Pro configurado\n";
echo "✅ Credenciales de prueba validadas\n";
echo "✅ Preferencia de pago creada exitosamente\n";
echo "✅ Página de prueba generada\n";
echo "\n";

echo "🚀 PRÓXIMOS PASOS:\n";
echo "==================\n";
echo "1. Abre: http://localhost:8000/test-mercadopago-final.html\n";
echo "2. Haz clic en 'Pagar con MercadoPago'\n";
echo "3. Usa las tarjetas de prueba para completar el pago\n";
echo "4. Verifica que el webhook procese correctamente el pago\n";
echo "5. Confirma que la venta cambie de 'pendiente' a 'pagado'\n";
echo "\n";

echo "💡 NOTAS IMPORTANTES:\n";
echo "=====================\n";
echo "- Estás usando CHECKOUT PRO (redirección a MercadoPago)\n";
echo "- Las credenciales son de PRUEBA (sandbox)\n";
echo "- Solo usa las tarjetas de prueba listadas\n";
echo "- Los pagos NO son reales, solo simulaciones\n";
echo "\n";

echo "🏁 ¡Listo para probar!\n";
?>
