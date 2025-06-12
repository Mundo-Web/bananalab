<?php
echo "=== TEST DIRECTO API MERCADOPAGO ===\n";

// Simular datos exactos del frontend
$postData = json_encode([
    'amount' => 200,
    'title' => 'Compra BananaLab',
    'description' => 'Productos BananaLab',
    'checkout_data' => [
        'items' => [
            [
                'id' => 1,
                'name' => 'Producto Test',
                'quantity' => 1,
                'price' => 200
            ]
        ],
        'customer' => [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+51987654321'
        ]
    ]
]);

// Headers como el frontend
$headers = [
    'Content-Type: application/json',
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest'
];

// URL de la API (probemos diferentes opciones)
$urls = [
    'http://localhost:8000/api/mercadopago/preference',
    'http://localhost/projects/bananalab/public/api/mercadopago/preference',
    'http://localhost/projects/bananalab/api/mercadopago/preference'
];

foreach ($urls as $url) {
    echo "� Probando URL: $url\n";
    
    // Configurar cURL
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postData,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);

    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    echo "📥 Status HTTP: $httpCode\n";

    if ($error) {
        echo "❌ Error cURL: $error\n";
        continue;
    }

    if ($httpCode === 200) {
        echo "✅ ¡ÉXITO! URL funcionando: $url\n";
        $responseData = json_decode($response, true);
        
        if (json_last_error() === JSON_ERROR_NONE && isset($responseData['status']) && $responseData['status']) {
            if (isset($responseData['sandbox_init_point'])) {
                echo "🎯 URL Sandbox: " . $responseData['sandbox_init_point'] . "\n";
            }
            echo "\n=== TARJETAS DE PRUEBA ===\n";
            echo "✅ APROBAR: 4009 1753 3280 7176, CVV: 123, Venc: 11/25, Nombre: APRO\n";
            echo "❌ RECHAZAR: 4000 0000 0000 0002, CVV: 123, Venc: 11/25, Nombre: OTHE\n";
            break;
        }
    } else {
        echo "❌ Error HTTP $httpCode\n";
    }
    echo "---\n";
}

echo "\n=== FIN ===\n";
?>
