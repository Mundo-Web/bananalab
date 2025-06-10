<?php
header('Content-Type: application/json');

try {
    // Simple test to check if we can reach PaymentMethodController
    require_once __DIR__ . '/bootstrap/app.php';
    
    $app = require_once __DIR__ . '/bootstrap/app.php';
    
    // Test PaymentMethodController
    $controller = new App\Http\Controllers\Admin\PaymentMethodController();
    $response = $controller->getConfigTemplates();
    
    echo json_encode([
        'status' => 'success',
        'response' => $response->getData()
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?>
