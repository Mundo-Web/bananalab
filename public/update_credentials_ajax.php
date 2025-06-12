<?php
/**
 * Script AJAX para actualizar credenciales de MercadoPago
 */

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

if (!isset($_POST['action']) || $_POST['action'] !== 'update_credentials') {
    echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    exit;
}

$accessToken = trim($_POST['access_token'] ?? '');
$publicKey = trim($_POST['public_key'] ?? '');

// Validaciones
if (empty($accessToken) || empty($publicKey)) {
    echo json_encode(['success' => false, 'message' => 'Access Token y Public Key son requeridos']);
    exit;
}

if (strpos($accessToken, 'APP_USR-') !== 0) {
    echo json_encode(['success' => false, 'message' => 'El Access Token debe empezar con "APP_USR-"']);
    exit;
}

if (strpos($publicKey, 'APP_USR-') !== 0) {
    echo json_encode(['success' => false, 'message' => 'El Public Key debe empezar con "APP_USR-"']);
    exit;
}

$envFile = __DIR__ . '/../.env';

if (!file_exists($envFile)) {
    echo json_encode(['success' => false, 'message' => 'Archivo .env no encontrado']);
    exit;
}

try {
    // Respaldar archivo .env
    copy($envFile, $envFile . '.backup.' . date('Y-m-d-H-i-s'));
    
    // Leer contenido actual
    $envContent = file_get_contents($envFile);
    
    // Actualizar o agregar credenciales
    if (preg_match('/MERCADOPAGO_ACCESS_TOKEN=.*/', $envContent)) {
        $envContent = preg_replace('/MERCADOPAGO_ACCESS_TOKEN=.*/', "MERCADOPAGO_ACCESS_TOKEN=$accessToken", $envContent);
    } else {
        $envContent .= "\nMERCADOPAGO_ACCESS_TOKEN=$accessToken";
    }
    
    if (preg_match('/MERCADOPAGO_PUBLIC_KEY=.*/', $envContent)) {
        $envContent = preg_replace('/MERCADOPAGO_PUBLIC_KEY=.*/', "MERCADOPAGO_PUBLIC_KEY=$publicKey", $envContent);
    } else {
        $envContent .= "\nMERCADOPAGO_PUBLIC_KEY=$publicKey";
    }
    
    // Escribir archivo actualizado
    file_put_contents($envFile, $envContent);
    
    // Verificar credenciales con API de MercadoPago
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
        $message = 'Credenciales actualizadas y verificadas exitosamente';
        
        if (isset($accountData['is_test']) && $accountData['is_test']) {
            $message .= '. Es una cuenta de prueba (CORRECTO para sandbox)';
        } else {
            $message .= '. Verificar si es cuenta de prueba';
        }
        
        echo json_encode([
            'success' => true, 
            'message' => $message,
            'account_info' => [
                'id' => $accountData['id'] ?? 'N/A',
                'email' => $accountData['email'] ?? 'N/A',
                'is_test' => $accountData['is_test'] ?? false
            ]
        ]);
    } else {
        echo json_encode([
            'success' => true, 
            'message' => 'Credenciales actualizadas, pero no se pudo verificar con MercadoPago (HTTP ' . $httpCode . ')',
            'warning' => 'Verificar manualmente las credenciales'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
