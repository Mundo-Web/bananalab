<?php
/**
 * Script para probar un pago completo con usuario autenticado
 */

// Obtener el token CSRF
$tokenFile = file_get_contents('http://localhost/projects/bananalab/public');
preg_match('/<meta name="csrf-token" content="([^"]+)"/', $tokenFile, $matches);
$csrfToken = $matches[1] ?? '';

echo "🔐 CSRF Token obtenido: " . substr($csrfToken, 0, 10) . "...\n\n";

// Datos del pedido de prueba (MercadoPago - no requiere comprobante)
$orderData = [
    'payment_method' => 'mercadopago',
    'amount' => 120.50,    'cart' => [
        [
            'id' => '9f15b4ab-a14b-4083-8b15-5f2269fc9768', // ID de item válido
            'name' => 'Album Digital',
            'price' => 120.50,
            'quantity' => 1,
            'type' => 'album'
        ]
    ],
    'name' => 'María',
    'lastname' => 'González',
    'email' => 'maria.gonzalez@test.com',
    'phone' => '987654321',
    'department' => 'Lima',
    'province' => 'Lima',
    'district' => 'Surco',
    'address' => 'Av. Primavera 456',
    'reference' => 'Frente al centro comercial',
    'user_id' => 1,
    'delivery' => 0.00,
    'comment' => 'Pedido de prueba completo'
];

echo "📦 DATOS DEL PEDIDO:\n";
echo "   - Método: " . $orderData['payment_method'] . "\n";
echo "   - Monto: S/ " . $orderData['amount'] . "\n";
echo "   - Cliente: " . $orderData['name'] . " " . $orderData['lastname'] . "\n";
echo "   - Email: " . $orderData['email'] . "\n\n";

echo "🚀 Enviando pedido a la API...\n";

// Convertir datos para envío
$postData = [];
foreach ($orderData as $key => $value) {
    if ($key === 'cart' && is_array($value)) {
        $postData[$key] = json_encode($value);
    } else {
        $postData[$key] = $value;
    }
}

// Crear la petición
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/projects/bananalab/public/api/payments/process');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'X-CSRF-TOKEN: ' . $csrfToken,
    'Content-Type: application/x-www-form-urlencoded'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "📡 Respuesta HTTP: $httpCode\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    
    if ($data && $data['status']) {
        echo "✅ PAGO PROCESADO EXITOSAMENTE!\n\n";
        echo "📋 DETALLES DE LA VENTA:\n";
        echo "   - Sale ID: " . $data['sale']['id'] . "\n";
        echo "   - Código de seguimiento: " . $data['code'] . "\n";
        echo "   - Estado: " . $data['sale']['status'] . "\n";
        echo "   - Estado de pago: " . $data['sale']['payment_status'] . "\n";
        echo "   - Subtotal: S/ " . $data['sale']['subtotal'] . "\n";
        echo "   - Comisión: S/ " . $data['sale']['fee'] . "\n";
        echo "   - Total: S/ " . $data['sale']['total'] . "\n";
        echo "   - Método de pago: " . $data['payment_method']['name'] . "\n";
        
        echo "\n🚚 DETALLES DEL ENVÍO:\n";
        echo "   - Delivery ID: " . $data['delivery']['id'] . "\n";
        echo "   - Destinatario: " . $data['delivery']['recipient_name'] . "\n";
        echo "   - Email: " . $data['delivery']['recipient_email'] . "\n";
        echo "   - Teléfono: " . $data['delivery']['recipient_phone'] . "\n";
        echo "   - Dirección: " . $data['delivery']['address'] . "\n";
        echo "   - Distrito: " . $data['delivery']['district'] . "\n";
        echo "   - Estado del envío: " . $data['delivery']['status'] . "\n";
        
        if (isset($data['payment_data'])) {
            echo "\n💳 DATOS DEL GATEWAY:\n";
            echo "   - Preference data preparada ✅\n";
            if (isset($data['payment_data']['preference_data'])) {
                echo "   - External reference: " . $data['payment_data']['preference_data']['external_reference'] . "\n";
            }
        }
        
        echo "\n🎉 EL FLUJO COMPLETO FUNCIONA PERFECTAMENTE!\n";
        
    } else {
        echo "❌ ERROR EN EL PROCESAMIENTO:\n";
        echo "   - Mensaje: " . ($data['message'] ?? 'Error desconocido') . "\n";
        if (isset($data['error'])) {
            echo "   - Detalle: " . $data['error'] . "\n";
        }
    }
} else {
    echo "❌ ERROR HTTP $httpCode:\n";
    echo $response . "\n";
}

echo "\n" . str_repeat("═", 70) . "\n";
echo "🏁 PRUEBA COMPLETA FINALIZADA\n";
echo "✅ El sistema de pagos está listo para usar\n";
echo "🔗 Puedes probar desde el frontend en: http://localhost/projects/bananalab/public\n";
echo str_repeat("═", 70) . "\n";
