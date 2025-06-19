#!/usr/bin/env php
<?php

// Test simple de credenciales MercadoPago
echo "🧪 Probando credenciales de MercadoPago..." . PHP_EOL;

$public_key = 'TEST-4f3f7d8e-2c1a-4b6d-9e8f-1a2b3c4d5e6f';
$access_token = 'TEST-123456789012345-061808-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t-123456789';

// Probar acceso a MercadoPago API
$url = 'https://api.mercadopago.com/v1/payment_methods';
$headers = [
    'Authorization: Bearer ' . $access_token,
    'Content-Type: application/json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode" . PHP_EOL;

if ($httpCode == 200) {
    $data = json_decode($response, true);
    echo "✅ Credenciales válidas!" . PHP_EOL;
    echo "Métodos de pago disponibles: " . count($data) . PHP_EOL;
} else if ($httpCode == 401) {
    echo "❌ Credenciales inválidas (401 Unauthorized)" . PHP_EOL;
    echo "Respuesta: $response" . PHP_EOL;
} else {
    echo "⚠️  Respuesta inesperada" . PHP_EOL;
    echo "Respuesta: $response" . PHP_EOL;
}
