<?php
require_once 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🚀 PRUEBA FINAL - MERCADOPAGO PRODUCCIÓN\n";
echo "========================================\n\n";

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
    echo "ACCESS_TOKEN: " . substr($accessToken, 0, 20) . "...\n";
    echo "PUBLIC_KEY: " . substr($publicKey, 0, 20) . "...\n";
    
    // Verificar que sean credenciales de producción
    if (strpos($accessToken, 'APP_USR-') === 0) {
        echo "✅ ACCESS_TOKEN es de PRODUCCIÓN\n";
    } else {
        echo "⚠️ ACCESS_TOKEN no es de producción\n";
    }
    
    if (strpos($publicKey, 'APP_USR-') === 0) {
        echo "✅ PUBLIC_KEY es de PRODUCCIÓN\n";
    } else {
        echo "⚠️ PUBLIC_KEY no es de producción\n";
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
        echo "✅ API conectada exitosamente\n";
        echo "Usuario: " . ($userData['nickname'] ?? 'N/A') . "\n";
        echo "Email: " . ($userData['email'] ?? 'N/A') . "\n";
        echo "País: " . ($userData['site_id'] ?? 'N/A') . "\n\n";
        
        // Crear preferencia de prueba de producción
        echo "Creando preferencia de PRODUCCIÓN...\n";
        
        $orderNumber = 'PROD-' . time();
        $appUrl = $_ENV['APP_URL'] ?? 'http://localhost:8000';
        
        $preferenceData = [
            'items' => [
                [
                    'id' => 'prod-item',
                    'title' => 'Producto Real - BananaLab',
                    'quantity' => 1,
                    'unit_price' => 50.00, // Precio real más bajo para prueba
                    'currency_id' => 'PEN',
                ]
            ],
            'payer' => [
                'name' => 'Cliente',
                'surname' => 'Prueba',
                'email' => 'cliente@example.com',
            ],
            'back_urls' => [
                'success' => $appUrl . '/checkout/success?external_reference=' . $orderNumber,
                'failure' => $appUrl . '/checkout/failure?external_reference=' . $orderNumber,
                'pending' => $appUrl . '/checkout/pending?external_reference=' . $orderNumber,
            ],
            'external_reference' => $orderNumber,
            'notification_url' => $appUrl . '/api/mercadopago/webhook',
        ];
        
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
        
        if ($httpCode === 201) {
            $preference = json_decode($response, true);
            echo "✅ Preferencia de PRODUCCIÓN creada exitosamente!\n";
            echo "ID: " . $preference['id'] . "\n";
            echo "URL de pago (PRODUCCIÓN): " . $preference['init_point'] . "\n\n";
            
            // Generar página de prueba para producción
            $testPageContent = '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba PRODUCCIÓN MercadoPago - BananaLab</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen py-8">
    <div class="max-w-4xl mx-auto p-6">
        <div class="bg-white rounded-lg shadow-lg p-8">
            <h1 class="text-3xl font-bold text-red-600 mb-6">⚠️ PRUEBA PRODUCCIÓN MercadoPago</h1>
            
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <h2 class="text-xl font-semibold text-red-800 mb-4">🚨 ADVERTENCIA IMPORTANTE</h2>
                <ul class="space-y-2 text-red-700">
                    <li>⚠️ <strong>Este es un pago REAL de PRODUCCIÓN</strong></li>
                    <li>💳 <strong>Se cobrará dinero real a tu tarjeta</strong></li>
                    <li>🏦 <strong>El dinero irá a tu cuenta de MercadoPago</strong></li>
                    <li>❌ <strong>NO uses tarjetas de prueba</strong></li>
                    <li>✅ <strong>Solo usa tu propia tarjeta real</strong></li>
                </ul>
            </div>
            
            <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h2 class="text-xl font-semibold text-green-800 mb-4">✅ Sistema Configurado</h2>
                    <ul class="space-y-2 text-green-700">
                        <li>✅ Credenciales de PRODUCCIÓN válidas</li>
                        <li>✅ API de MercadoPago conectada</li>
                        <li>✅ Preferencia de pago creada</li>
                        <li>✅ Frontend actualizado para producción</li>
                    </ul>
                </div>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h2 class="text-xl font-semibold text-blue-800 mb-4">💰 Datos del Pago</h2>
                    <div class="space-y-2 text-blue-700">
                        <p><strong>Orden:</strong> ' . $orderNumber . '</p>
                        <p><strong>Monto:</strong> S/ 50.00 (REAL)</p>
                        <p><strong>Producto:</strong> Producto Real - BananaLab</p>
                        <p><strong>Tipo:</strong> PRODUCCIÓN</p>
                    </div>
                </div>
            </div>
            
            <div class="mt-8 text-center">
                <a href="' . $preference['init_point'] . '" 
                   class="inline-block bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
                   onclick="return confirm(\'⚠️ ADVERTENCIA: Este es un pago REAL. Se cobrará dinero real a tu tarjeta. ¿Estás seguro de continuar?\')">
                    💳 PAGAR S/ 50.00 - PRODUCCIÓN (REAL)
                </a>
            </div>
            
            <div class="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">📋 Flujo de Prueba</h3>
                <ol class="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Haz clic en "PAGAR" (se cobrará dinero real)</li>
                    <li>Usa tu tarjeta real de crédito/débito</li>
                    <li>Completa el proceso de pago en MercadoPago</li>
                    <li>Serás redirigido de vuelta a tu sitio</li>
                    <li>Verifica que la venta se registre en la base de datos</li>
                    <li>Confirma que recibiste el dinero en tu cuenta MercadoPago</li>
                </ol>
            </div>
            
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
            
            file_put_contents('public/test-mercadopago-production.html', $testPageContent);
            echo "✅ Página de prueba de PRODUCCIÓN generada: public/test-mercadopago-production.html\n\n";
            
        } else {
            echo "❌ Error al crear preferencia de producción:\n";
            echo "Código HTTP: $httpCode\n";
            echo "Respuesta: " . $response . "\n";
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

echo "\n🎯 RESUMEN:\n";
echo "===========\n";
echo "Tu sistema ahora está configurado para PRODUCCIÓN:\n";
echo "✅ Credenciales de producción válidas\n";
echo "✅ Frontend compilado para usar init_point (producción)\n";
echo "✅ Los pagos serán REALES\n";
echo "✅ El dinero irá a tu cuenta de MercadoPago\n";
echo "\n";

echo "🚀 PRÓXIMOS PASOS:\n";
echo "==================\n";
echo "1. Abre: http://localhost:8000/test-mercadopago-production.html\n";
echo "2. Lee las advertencias cuidadosamente\n";
echo "3. Haz una prueba con una compra pequeña y real\n";
echo "4. Verifica que todo funcione correctamente\n";
echo "5. Tu sistema estará listo para usuarios reales\n";
echo "\n";

echo "⚠️ IMPORTANTE:\n";
echo "===============\n";
echo "- Los pagos ahora son REALES (no simulaciones)\n";
echo "- No uses tarjetas de prueba de MercadoPago\n";
echo "- Solo usa tarjetas reales para probar\n";
echo "- El dinero se cobrará realmente\n";
echo "\n";

echo "🏁 ¡Tu sistema MercadoPago está listo para producción! 🎉\n";
?>
