<?php
/**
 * Script para actualizar credenciales de MercadoPago en base de datos
 */

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

if (!isset($_POST['action']) || $_POST['action'] !== 'update_database_credentials') {
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

try {
    $pdo = new PDO('mysql:host=localhost;dbname=bananalab_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener configuración actual
    $stmt = $pdo->prepare("SELECT configuration FROM payment_methods WHERE slug = 'mercadopago'");
    $stmt->execute();
    $configJson = $stmt->fetchColumn();
    
    if (!$configJson) {
        echo json_encode(['success' => false, 'message' => 'No se encontró configuración de MercadoPago']);
        exit;
    }
    
    $config = json_decode($configJson, true);
    if (!$config) {
        echo json_encode(['success' => false, 'message' => 'Error decodificando configuración actual']);
        exit;
    }
    
    // Actualizar credenciales
    $config['access_token'] = $accessToken;
    $config['public_key'] = $publicKey;
    $config['client_id'] = $publicKey; // A veces se usa como client_id
    
    // También actualizar campos de sandbox si existen
    if (isset($config['sandbox_access_token'])) {
        $config['sandbox_access_token'] = $accessToken;
    }
    if (isset($config['sandbox_public_key'])) {
        $config['sandbox_public_key'] = $publicKey;
    }
    
    $newConfigJson = json_encode($config);
    
    // Actualizar en base de datos
    $stmt = $pdo->prepare("UPDATE payment_methods SET configuration = ? WHERE slug = 'mercadopago'");
    $result = $stmt->execute([$newConfigJson]);
    
    if ($result) {
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
            echo json_encode([
                'success' => true,
                'message' => 'Credenciales actualizadas y verificadas exitosamente',
                'account_info' => [
                    'id' => $accountData['id'] ?? 'N/A',
                    'email' => $accountData['email'] ?? 'N/A',
                    'site_id' => $accountData['site_id'] ?? 'N/A',
                    'is_test' => $accountData['is_test'] ?? false
                ]
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Credenciales actualizadas pero no verificadas (HTTP ' . $httpCode . ')',
                'warning' => 'Verificar credenciales manualmente'
            ]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Error actualizando credenciales en base de datos']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
