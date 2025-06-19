<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Verificar la clase PaymentController
$reflection = new ReflectionClass('App\Http\Controllers\Api\PaymentController');
$methods = $reflection->getMethods();
echo 'Métodos en PaymentController que contengan "calculate":' . PHP_EOL;
foreach ($methods as $method) {
    if (strpos($method->name, 'calculate') !== false) {
        echo '- ' . $method->name . PHP_EOL;
    }
}

// Verificar el método PaymentMethod::calculateFee
try {
    $paymentMethod = new App\Models\PaymentMethod();
    if (method_exists($paymentMethod, 'calculateFee')) {
        echo 'PaymentMethod::calculateFee EXISTS' . PHP_EOL;
    } else {
        echo 'PaymentMethod::calculateFee DOES NOT EXIST' . PHP_EOL;
    }
    
    // Intentar llamar al método calculateFee
    $fee = $paymentMethod->calculateFee(100);
    echo 'calculateFee(100) returned: ' . $fee . PHP_EOL;
    
} catch (Exception $e) {
    echo 'Error testing PaymentMethod::calculateFee: ' . $e->getMessage() . PHP_EOL;
}

echo 'Verification complete.' . PHP_EOL;
