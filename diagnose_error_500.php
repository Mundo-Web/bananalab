<?php
/**
 * Diagnóstico completo del error 500 en MercadoPago
 */

require_once 'vendor/autoload.php';

// Cargar variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🔍 DIAGNÓSTICO DEL ERROR 500 - MERCADOPAGO\n";
echo "==========================================\n\n";

// 1. Verificar conexión a base de datos
echo "1. Verificando conexión a base de datos...\n";
try {
    $servername = $_ENV['DB_HOST'] ?? 'localhost';
    $username = $_ENV['DB_USERNAME'] ?? 'root';
    $password = $_ENV['DB_PASSWORD'] ?? '';
    $dbname = $_ENV['DB_DATABASE'] ?? '';

    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conexión a base de datos exitosa\n\n";
} catch (Exception $e) {
    echo "❌ Error de conexión a base de datos: " . $e->getMessage() . "\n\n";
    exit(1);
}

// 2. Verificar tabla payment_methods
echo "2. Verificando tabla payment_methods...\n";
try {
    $stmt = $pdo->query("SELECT * FROM payment_methods WHERE slug = 'mercadopago'");
    $mercadopagoMethod = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($mercadopagoMethod) {
        echo "✅ Método MercadoPago encontrado (ID: {$mercadopagoMethod['id']})\n";
        echo "Estado: " . ($mercadopagoMethod['is_active'] ? 'Activo' : 'Inactivo') . "\n";
        echo "Configuración: " . (strlen($mercadopagoMethod['configuration']) > 0 ? 'Presente' : 'Vacía') . "\n";
        
        if ($mercadopagoMethod['configuration']) {
            $config = json_decode($mercadopagoMethod['configuration'], true);
            if ($config) {
                echo "Access Token: " . (isset($config['access_token']) ? 'Presente' : 'Faltante') . "\n";
                echo "Public Key: " . (isset($config['public_key']) ? 'Presente' : 'Faltante') . "\n";
            } else {
                echo "❌ Error: Configuración JSON inválida\n";
            }
        }
    } else {
        echo "❌ Método MercadoPago no encontrado\n";
    }
    echo "\n";
} catch (Exception $e) {
    echo "❌ Error al consultar payment_methods: " . $e->getMessage() . "\n\n";
}

// 3. Simular la creación de preferencia paso a paso
echo "3. Simulando creación de preferencia...\n";
try {
    // Datos de prueba
    $testData = [
        'amount' => 100,
        'name' => 'Test User',
        'lastname' => 'Test',
        'email' => 'test@example.com',
        'phone' => '999999999',
        'cart' => [
            [
                'id' => 1,
                'name' => 'Producto Test',
                'final_price' => 100,
                'quantity' => 1
            ]
        ]
    ];
    
    echo "Datos de entrada: ✅\n";
    echo "Amount: {$testData['amount']}\n";
    echo "Email: {$testData['email']}\n";
    echo "Cart items: " . count($testData['cart']) . "\n\n";
    
    // Verificar que tenemos la configuración
    if (!$mercadopagoMethod || !$mercadopagoMethod['configuration']) {
        echo "❌ Error: No hay configuración de MercadoPago\n";
        exit(1);
    }
    
    $config = json_decode($mercadopagoMethod['configuration'], true);
    if (!$config || !isset($config['access_token'])) {
        echo "❌ Error: Configuración inválida o falta access_token\n";
        exit(1);
    }
    
    echo "✅ Configuración válida encontrada\n";
    
    // Configurar SDK de MercadoPago
    MercadoPago\MercadoPagoConfig::setAccessToken($config['access_token']);
    echo "✅ SDK configurado\n";
    
    // Generar número de orden
    $orderNumber = 'DIAG-' . time();
    echo "✅ Número de orden generado: $orderNumber\n";
    
    // Crear venta en base de datos
    $stmt = $pdo->prepare("SELECT id FROM sale_statuses WHERE name = 'Pendiente' LIMIT 1");
    $stmt->execute();
    $saleStatus = $stmt->fetch(PDO::FETCH_ASSOC);
    $statusId = $saleStatus ? $saleStatus['id'] : null;
    
    $stmt = $pdo->prepare("INSERT INTO sales (code, name, lastname, fullname, email, phone, amount, payment_status, status_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, NOW(), NOW())");
    $stmt->execute([
        $orderNumber,
        $testData['name'],
        $testData['lastname'],
        $testData['name'] . ' ' . $testData['lastname'],
        $testData['email'],
        $testData['phone'],
        $testData['amount'],
        $statusId
    ]);
    
    $saleId = $pdo->lastInsertId();
    echo "✅ Venta creada en BD (ID: $saleId)\n";
    
    // Preparar items para MercadoPago
    $items = [];
    foreach ($testData['cart'] as $cartItem) {
        $items[] = [
            'id' => (string) $cartItem['id'],
            'title' => $cartItem['name'],
            'quantity' => (int) $cartItem['quantity'],
            'unit_price' => round((float) $cartItem['final_price'], 2),
            'currency_id' => 'PEN',
        ];
    }
    echo "✅ Items preparados: " . count($items) . "\n";
    
    // URLs
    $appUrl = $_ENV['APP_URL'] ?? 'http://localhost:8000';
    $webhookUrl = $appUrl . '/api/mercadopago/webhook';
    
    // Crear preferencia
    $preferenceData = [
        'items' => $items,
        'payer' => [
            'name' => $testData['name'],
            'surname' => $testData['lastname'],
            'email' => $testData['email'],
        ],
        'back_urls' => [
            'success' => $appUrl . '/checkout/success?external_reference=' . $orderNumber,
            'failure' => $appUrl . '/checkout/failure?external_reference=' . $orderNumber,
            'pending' => $appUrl . '/checkout/pending?external_reference=' . $orderNumber,
        ],
        'external_reference' => $orderNumber,
        'notification_url' => $webhookUrl,
    ];
    
    echo "✅ Datos de preferencia preparados\n";
    echo "JSON Data:\n";
    echo json_encode($preferenceData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
    
    // Crear la preferencia
    $client = new MercadoPago\Client\Preference\PreferenceClient();
    echo "✅ Cliente de preferencia creado\n";
    
    echo "🔄 Enviando solicitud a MercadoPago...\n";
    $preference = $client->create($preferenceData);
    
    if ($preference && isset($preference->id)) {
        echo "✅ PREFERENCIA CREADA EXITOSAMENTE!\n";
        echo "ID: {$preference->id}\n";
        echo "Init Point: {$preference->init_point}\n";
        echo "Sandbox Init Point: {$preference->sandbox_init_point}\n";
    } else {
        echo "❌ Error: Preferencia no creada\n";
    }
    
} catch (MercadoPago\Exceptions\MPApiException $e) {
    echo "❌ Error de API MercadoPago:\n";
    echo "Código: " . $e->getApiResponse()->getStatusCode() . "\n";
    echo "Mensaje: " . $e->getMessage() . "\n";
    echo "Contenido: " . $e->getApiResponse()->getContent() . "\n";
    
    // Analizar el error específico
    $responseContent = json_decode($e->getApiResponse()->getContent(), true);
    if ($responseContent && isset($responseContent['message'])) {
        echo "\nAnálisis del error:\n";
        echo "Mensaje: " . $responseContent['message'] . "\n";
        
        if (isset($responseContent['cause'])) {
            echo "Causas:\n";
            foreach ($responseContent['cause'] as $cause) {
                echo "- " . ($cause['description'] ?? 'Sin descripción') . "\n";
            }
        }
        
        // Detectar si es problema de credenciales de cuenta de prueba
        if (strpos($responseContent['message'], 'test') !== false || 
            strpos($responseContent['message'], 'sandbox') !== false ||
            strpos($responseContent['message'], 'invalid') !== false) {
            echo "\n🎯 DIAGNÓSTICO:\n";
            echo "===============\n";
            echo "Este error indica que las credenciales son de una CUENTA DE PRUEBA.\n";
            echo "Necesitas credenciales de una CUENTA REAL de MercadoPago.\n\n";
            echo "SOLUCIÓN:\n";
            echo "1. Crea una cuenta REAL de MercadoPago (no de desarrollador)\n";
            echo "2. Activa las credenciales de PRODUCCIÓN desde esa cuenta\n";
            echo "3. Usa esas credenciales en tu aplicación\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error general: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🔍 RESUMEN DEL DIAGNÓSTICO:\n";
echo "===========================\n";
echo "Si ves errores relacionados con 'test', 'sandbox' o 'invalid credentials',\n";
echo "el problema es que estás usando credenciales de una cuenta de PRUEBA\n";
echo "en lugar de una cuenta REAL de MercadoPago.\n\n";
echo "Para Checkout Pro necesitas:\n";
echo "1. Una cuenta REAL de MercadoPago (no de desarrollador)\n";
echo "2. Activar las credenciales de PRODUCCIÓN\n";
echo "3. Usar esas credenciales en tu aplicación\n";
?>
