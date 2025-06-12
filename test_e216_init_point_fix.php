<?php
/**
 * Test directo del endpoint de preferencia para verificar URLs generadas
 */

echo "=== TEST ENDPOINT PREFERENCIA MERCADOPAGO ===\n\n";

// Simular datos de prueba
$testData = [
    'amount' => 100,
    'title' => 'Producto de Prueba E216',
    'description' => 'Test para error E216',
    'checkout_data' => [
        'name' => 'Test',
        'lastname' => 'User',
        'email' => 'test@test.com',
        'phone' => '987654321',
        'cart' => [
            [
                'title' => 'Producto Test',
                'quantity' => 1,
                'unit_price' => 100
            ]
        ]
    ]
];

echo "1. DATOS DE PRUEBA:\n";
echo "   - Amount: {$testData['amount']}\n";
echo "   - Title: {$testData['title']}\n";
echo "   - Email: {$testData['checkout_data']['email']}\n\n";

echo "2. ENVIANDO PETICIÓN AL ENDPOINT...\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/mercadopago/preference');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "3. RESPUESTA DEL SERVIDOR:\n";
echo "   - HTTP Code: $httpCode\n";

if ($error) {
    echo "   - cURL Error: $error\n";
    exit;
}

if ($httpCode !== 200) {
    echo "   - Error HTTP: $httpCode\n";
    echo "   - Response: $response\n";
    exit;
}

$data = json_decode($response, true);

if (!$data) {
    echo "   - Error decodificando JSON\n";
    echo "   - Raw response: $response\n";
    exit;
}

echo "   - Status: " . ($data['status'] ? 'Success' : 'Error') . "\n";

if (!$data['status']) {
    echo "   - Error Message: " . ($data['message'] ?? 'Unknown error') . "\n";
    echo "   - Full Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    exit;
}

echo "\n4. URLS GENERADAS:\n";

if (isset($data['init_point'])) {
    echo "   ✅ init_point (PRODUCCIÓN): {$data['init_point']}\n";
} else {
    echo "   ❌ init_point: NO DISPONIBLE\n";
}

if (isset($data['sandbox_init_point'])) {
    echo "   ✅ sandbox_init_point (SANDBOX): {$data['sandbox_init_point']}\n";
} else {
    echo "   ❌ sandbox_init_point: NO DISPONIBLE\n";
}

if (isset($data['preference_id'])) {
    echo "   ✅ preference_id: {$data['preference_id']}\n";
} else {
    echo "   ❌ preference_id: NO DISPONIBLE\n";
}

echo "\n5. ANÁLISIS DEL PROBLEMA E216:\n";

// Determinar cuál URL debería usarse
if (isset($data['init_point']) && isset($data['sandbox_init_point'])) {
    echo "   📊 AMBAS URLs disponibles\n";
    echo "   🎯 Para SANDBOX (cuentas de prueba): usar sandbox_init_point\n";
    echo "   🎯 Para PRODUCCIÓN (cuentas reales): usar init_point\n\n";
    
    echo "   ⚠️  PROBLEMA IDENTIFICADO:\n";
    echo "   El frontend está usando init_point (producción) con credenciales de cuenta de prueba.\n";
    echo "   Esto causa el error E216 'invalid esc' porque hay inconsistencia.\n\n";
    
    echo "   🔧 SOLUCIÓN:\n";
    echo "   Cambiar el frontend para usar sandbox_init_point cuando se usen cuentas de prueba.\n";
    
} elseif (isset($data['sandbox_init_point'])) {
    echo "   ✅ Solo sandbox_init_point disponible (configuración correcta para pruebas)\n";
} elseif (isset($data['init_point'])) {
    echo "   ⚠️  Solo init_point disponible (puede causar problemas con cuentas de prueba)\n";
} else {
    echo "   ❌ NO hay URLs de pago disponibles\n";
}

echo "\n6. PRUEBA MANUAL:\n";

if (isset($data['sandbox_init_point'])) {
    echo "   🧪 Prueba el flujo completo:\n";
    echo "   1. Abre: {$data['sandbox_init_point']}\n";
    echo "   2. Usa tarjeta: 4009 1753 3280 6176\n";
    echo "   3. CVV: 123, Fecha: 11/28\n";
    echo "   4. Email: diferente al vendedor (TESTUSER906372783@testuser.com)\n";
    echo "   5. Nombre: Test User\n";
    echo "   6. DNI: 12345678\n\n";
    
    echo "   ❗ IMPORTANTE: NO uses el mismo email del vendedor\n";
}

echo "\n7. CÓDIGO FRONTEND A CORREGIR:\n";
echo "   Archivo: PaymentStepsModalFixed.jsx\n";
echo "   Línea: ~84\n";
echo "   Cambiar de:\n";
echo "   const redirectUrl = preferenceData.init_point || preferenceData.sandbox_init_point;\n";
echo "   \n";
echo "   A:\n";
echo "   const redirectUrl = preferenceData.sandbox_init_point || preferenceData.init_point;\n";

echo "\n=== FIN DEL TEST ===\n";
?>
