<?php
/**
 * Test directo del endpoint createPreference
 */

// Datos de prueba similares a los que está enviando el frontend
$testData = [
    'amount' => 200,
    'title' => 'Compra BananaLab',
    'description' => 'Productos BananaLab',
    'checkout_data' => [
        'user_id' => 1,
        'name' => 'Root',
        'lastname' => 'MundoWeb',
        'fullname' => 'Root MundoWeb',
        'email' => 'root@mundoweb.pe',
        'phone' => '',
        'country' => 'PE',
        'department' => '',
        'province' => '',
        'district' => '',
        'ubigeo' => '',
        'address' => '',
        'number' => '',
        'reference' => '',
        'comment' => '',
        'delivery' => 0,
        'invoiceType' => '',
        'documentType' => '',
        'document' => '',
        'businessName' => '',
        'cart' => []
    ]
];

// Hacer petición POST
$url = 'http://localhost:8000/api/mercadopago/preference';
$data = json_encode($testData);

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $data,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json',
        'X-Requested-With: XMLHttpRequest'
    ],
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

echo "🧪 TEST ENDPOINT MERCADOPAGO PREFERENCE\n";
echo "======================================\n\n";
echo "URL: $url\n";
echo "HTTP Code: $httpCode\n";
echo "Response:\n";
echo $response . "\n\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if (isset($data['init_point'])) {
        echo "✅ SUCCESS: Preferencia creada correctamente\n";
        echo "Preference ID: " . ($data['preference_id'] ?? 'N/A') . "\n";
        echo "Init Point: " . ($data['init_point'] ?? 'N/A') . "\n";
        echo "Sandbox Init Point: " . ($data['sandbox_init_point'] ?? 'N/A') . "\n";
    } else {
        echo "⚠️ Response OK but missing expected fields\n";
    }
} else {
    echo "❌ ERROR: HTTP $httpCode\n";
    
    // Try to decode error response
    $errorData = json_decode($response, true);
    if ($errorData) {
        echo "Error details: " . json_encode($errorData, JSON_PRETTY_PRINT) . "\n";
    }
}
