<?php
// Test the specific endpoint that returns 500
$url = 'http://localhost/projects/bananalab/public/api/payments/methods';

echo "Testing: $url\n";

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => [
            'Accept: application/json',
            'Content-Type: application/json'
        ],
        'timeout' => 10,
        'ignore_errors' => true // Get response even on error
    ]
]);

$result = file_get_contents($url, false, $context);
$headers = $http_response_header ?? [];

echo "Response headers:\n";
foreach ($headers as $header) {
    echo "  $header\n";
}

echo "\nResponse body:\n";
echo $result . "\n";

// Check Laravel logs
echo "\n=== Checking Laravel logs ===\n";
$logPath = __DIR__ . '/storage/logs/laravel.log';
if (file_exists($logPath)) {
    $logs = file_get_contents($logPath);
    $lines = explode("\n", $logs);
    
    // Get last 20 lines
    $recentLines = array_slice($lines, -20);
    foreach ($recentLines as $line) {
        if (!empty(trim($line))) {
            echo $line . "\n";
        }
    }
} else {
    echo "Laravel log file not found at: $logPath\n";
}
?>
