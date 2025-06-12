<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$mp = App\Models\PaymentMethod::where('name', 'MercadoPago')->first();
if ($mp) {
    echo 'PaymentMethod found:' . PHP_EOL;
    echo 'ID: ' . $mp->id . PHP_EOL;
    echo 'Name: ' . $mp->name . PHP_EOL;
    echo 'Slug: ' . ($mp->slug ?? 'NULL') . PHP_EOL;
    echo 'Is Active: ' . ($mp->is_active ? 'Yes' : 'No') . PHP_EOL;
    
    // Check all attributes
    echo "\nAll attributes:\n";
    foreach ($mp->getAttributes() as $key => $value) {
        echo "$key: " . ($value ?? 'NULL') . "\n";
    }
} else {
    echo 'PaymentMethod not found' . PHP_EOL;
}
