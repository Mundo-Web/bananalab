<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $statuses = App\Models\SaleStatus::all();
    echo "Sale Statuses:\n";
    foreach($statuses as $status) {
        echo "ID: {$status->id} | Name: {$status->name} | Description: {$status->description}\n";
    }
    
    echo "\nPayment Methods:\n";
    $paymentMethods = App\Models\PaymentMethod::all();
    foreach($paymentMethods as $method) {
        echo "ID: {$method->id} | Name: {$method->name} | Active: " . ($method->is_active ? 'Yes' : 'No') . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
