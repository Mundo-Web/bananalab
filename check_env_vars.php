<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Environment Variables Check ===\n";
echo "MERCADOPAGO_ACCESS_TOKEN: " . env('MERCADOPAGO_ACCESS_TOKEN') . "\n";
echo "MERCADOPAGO_PUBLIC_KEY: " . env('MERCADOPAGO_PUBLIC_KEY') . "\n";

echo "\n=== Config Values ===\n";
$config = config('services.mercadopago');
echo "access_token from config: " . $config['access_token'] . "\n";
echo "public_key from config: " . $config['public_key'] . "\n";

// Check if this matches what we see in database
echo "\n=== Database MercadoPago Settings ===\n";
$mp = App\Models\PaymentMethod::where('name', 'MercadoPago')->first();
if ($mp) {
    echo "DB public_key: " . ($mp->public_key ?? 'NULL') . "\n";
    echo "DB private_key: " . ($mp->private_key ?? 'NULL') . "\n";
    echo "DB is_sandbox: " . ($mp->is_sandbox ?? 'NULL') . "\n";
}
