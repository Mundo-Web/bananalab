<?php
require_once 'vendor/autoload.php';

// Test the payment system endpoints
$baseUrl = 'http://127.0.0.1:8000';

echo "=== TESTING BANANALAB PAYMENT SYSTEM ===\n\n";

// Test 1: Get active payment methods
echo "1. Testing GET /api/payments/methods\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/api/payments/methods');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json'
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response:\n";
$methods = json_decode($response, true);
echo json_encode($methods, JSON_PRETTY_PRINT) . "\n\n";

// Test 2: Process payment (simulate a test payment)
if ($httpCode === 200 && !empty($methods['data'])) {
    $firstMethod = $methods['data'][0];
    echo "2. Testing POST /api/payments/process with method: {$firstMethod['name']}\n";
    
    $paymentData = [
        'payment_method_id' => $firstMethod['id'],
        'amount' => 50.00,
        'sale_data' => [
            'customer_name' => 'Test Customer',
            'customer_email' => 'test@example.com',
            'items' => [
                ['id' => 1, 'quantity' => 1, 'price' => 50.00]
            ]
        ]
    ];
    
    // Add specific data based on payment method type
    if ($firstMethod['type'] === 'manual') {
        $paymentData['proof_file'] = 'test_proof.jpg';
        $paymentData['customer_notes'] = 'Test payment proof';
    } elseif ($firstMethod['type'] === 'qr') {
        $paymentData['reference_code'] = 'TEST' . time();
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . '/api/payments/process');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json'
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: $httpCode\n";
    echo "Response:\n";
    echo json_encode(json_decode($response, true), JSON_PRETTY_PRINT) . "\n\n";
}

// Test 3: Check database state
echo "3. Checking payment methods in database\n";
try {
    $pdo = new PDO('mysql:host=localhost;dbname=bananalab_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SELECT id, name, type, is_active, slug FROM payment_methods ORDER BY id");
    $dbMethods = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Payment methods in database:\n";
    foreach ($dbMethods as $method) {        echo "- ID: {$method['id']}, Name: {$method['name']}, Type: {$method['type']}, Active: " . 
             ($method['is_active'] ? 'Yes' : 'No') . ", Slug: {$method['slug']}\n";
    }
    
    // Check recent sales
    echo "\nRecent sales with payment info:\n";    $stmt = $pdo->query("SELECT s.id, s.amount, s.payment_method_id, pm.name as payment_method_name, s.created_at 
                         FROM sales s 
                         LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id 
                         ORDER BY s.created_at DESC LIMIT 3");
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($sales)) {
        echo "No sales found\n";
    } else {
        foreach ($sales as $sale) {
            echo "- Sale ID: {$sale['id']}, Amount: {$sale['amount']}, Payment Method: {$sale['payment_method_name']}, Date: {$sale['created_at']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}

echo "\n=== TEST COMPLETED ===\n";
?>
