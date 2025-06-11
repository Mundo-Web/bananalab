<?php
// Test API endpoint directly via HTTP
echo "Testing API endpoint via file_get_contents...\n";

$baseUrl = 'http://localhost';
$endpoints = [
    '/bananalab/public/api/payments/methods',
    '/bananalab/api/payments/methods', 
    '/projects/bananalab/public/api/payments/methods',
    '/projects/bananalab/api/payments/methods'
];

foreach ($endpoints as $endpoint) {
    $url = $baseUrl . $endpoint;
    echo "\nTesting: $url\n";
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Accept: application/json',
                'Content-Type: application/json'
            ],
            'timeout' => 10
        ]
    ]);
    
    $result = @file_get_contents($url, false, $context);
    
    if ($result === false) {
        echo "❌ Failed to get response\n";
        $error = error_get_last();
        if ($error) {
            echo "Error: " . $error['message'] . "\n";
        }
    } else {
        echo "✅ Success! Response length: " . strlen($result) . " bytes\n";
        
        // Try to decode JSON
        $decoded = json_decode($result, true);
        if ($decoded) {
            echo "JSON Response:\n";
            if (isset($decoded['methods'])) {
                echo "Found " . count($decoded['methods']) . " payment methods\n";
            }
            echo json_encode($decoded, JSON_PRETTY_PRINT) . "\n";
        } else {
            echo "Raw response:\n" . substr($result, 0, 500) . "\n";
        }
        break; // Exit on first success
    }
}
?>
