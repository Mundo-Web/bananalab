<?php
/**
 * Script para probar el endpoint de MercadoPago Checkout API directamente
 */

require_once __DIR__ . '/vendor/autoload.php';

// Simular una request POST
$payload = [
    "user_id" => 1,
    "name" => "Root",
    "lastname" => "MundoWeb",
    "fullname" => "Root MundoWeb",
    "email" => "root@mundoweb.pe",
    "phone" => "",
    "country" => "Perú",
    "department" => "JUNIN",
    "province" => "CHANCHAMAYO",
    "district" => "PICHANAQUI",
    "ubigeo" => null,
    "address" => "Confianza que nace del conocimiento",
    "number" => "123",
    "comment" => "fgf",
    "reference" => "Ar eee",
    "amount" => 200,
    "delivery" => "100.00",
    "cart" => [
        [
            "id" => "album_3_1750274001369",
            "name" => "Mundo nuevo",
            "image" => "4a75007a-eadd-47d4-b3d1-904328227e2c.jpg",
            "price" => "100.00",
            "final_price" => "100.00",
            "discount" => "0.00",
            "slug" => "album-3-1750274001369",
            "quantity" => 1,
            "type" => "custom_album"
        ]
    ],
    "payment_method" => "mercadopago",
    "token" => "b32b68a5c2919cb89dbec10feef88db5",
    "payment_method_id" => "visa",
    "issuer_id" => null,
    "installments" => 1,
    "identification_type" => "DNI",
    "identification_number" => "123456789",
    "card_type" => "visa",
    "card_last_four" => "6176",
    "card_holder_name" => "APRO"
];

echo "🧪 TESTING MERCADOPAGO CHECKOUT API ENDPOINT\n";
echo str_repeat("=", 60) . "\n\n";

// Hacer request al endpoint
$url = 'http://localhost:8000/api/payments/mercadopago/checkout-api';
$headers = [
    'Content-Type: application/json',
    'Accept: application/json',
    // En un entorno real necesitarías el token CSRF
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_VERBOSE, 1);

echo "📤 Enviando request a: $url\n";
echo "📋 Payload enviado:\n";
echo json_encode($payload, JSON_PRETTY_PRINT) . "\n\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "📥 RESPUESTA:\n";
echo "HTTP Code: $httpCode\n";

if ($error) {
    echo "❌ cURL Error: $error\n";
} else {
    echo "Response Body:\n";
    
    if ($httpCode === 200) {
        echo "✅ Success!\n";
        $data = json_decode($response, true);
        if ($data) {
            echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
        } else {
            echo "Raw response: $response\n";
        }
    } else {
        echo "❌ Error HTTP $httpCode\n";
        echo "Response: $response\n";
        
        // Intentar parsear respuesta JSON de error
        $errorData = json_decode($response, true);
        if ($errorData) {
            echo "\nError Details:\n";
            echo json_encode($errorData, JSON_PRETTY_PRINT) . "\n";
        }
    }
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "📋 PRÓXIMOS PASOS:\n";
echo "1. Verificar que el servidor esté corriendo en localhost:8000\n";
echo "2. Revisar los logs de Laravel en storage/logs/\n";
echo "3. Comprobar que MercadoPago esté configurado correctamente\n";
echo "4. Verificar que el token de prueba sea válido\n";
