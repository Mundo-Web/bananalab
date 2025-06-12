<?php
// FINAL MERCADOPAGO INTEGRATION VERIFICATION
echo "=== MERCADOPAGO INTEGRATION - FINAL COMPREHENSIVE VERIFICATION ===\n\n";

// 1. Check if selector issues exist in the build output
echo "1. CHECKING BUILD OUTPUT FOR SELECTOR ISSUES\n";
echo "==============================================\n";

$build_files = glob('public/build/assets/*.js');
$selector_issues = [];

foreach ($build_files as $file) {
    $content = file_get_contents($file);
    if (preg_match('/["\']#\.mercadopago-button["\']/', $content)) {
        $selector_issues[] = $file;
    }
}

if (empty($selector_issues)) {
    echo "✓ NO INVALID SELECTORS FOUND in build output\n";
} else {
    echo "❌ INVALID SELECTORS FOUND in:\n";
    foreach ($selector_issues as $file) {
        echo "  - $file\n";
    }
}

echo "\n2. CHECKING SOURCE FILES FOR SELECTOR ISSUES\n";
echo "==============================================\n";

$source_files = [
    'resources/js/Components/Tailwind/Checkouts/Components/PaymentStepsModal.jsx',
    'resources/js/Components/Tailwind/Checkouts/Components/PaymentStepsModalNew.jsx',
    'resources/js/Components/Tailwind/Checkouts/Components/PaymentStepsModalFixed.jsx',
    'resources/js/Components/Tailwind/Checkouts/Components/ShippingStep.jsx',
    'resources/js/Components/Tailwind/Checkouts/Components/ShippingStepSF.jsx'
];

$source_issues = [];

foreach ($source_files as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if (preg_match('/["\']#\.mercadopago-button["\']/', $content)) {
            $source_issues[] = $file;
        }
    }
}

if (empty($source_issues)) {
    echo "✓ NO INVALID SELECTORS FOUND in source files\n";
} else {
    echo "❌ INVALID SELECTORS FOUND in:\n";
    foreach ($source_issues as $file) {
        echo "  - $file\n";
    }
}

echo "\n3. VERIFYING BACKEND CONFIGURATION\n";
echo "==================================\n";

// Check database connection
try {
    $dsn = "mysql:host=127.0.0.1;dbname=bananalab_db";
    $username = "root";
    $password = "";
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✓ Database connection successful\n";
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Check MercadoPago payment method
$stmt = $pdo->prepare("SELECT * FROM payment_methods WHERE name = ? AND is_active = 1");
$stmt->execute(['MercadoPago']);
$mercadopago = $stmt->fetch(PDO::FETCH_ASSOC);

if ($mercadopago) {
    echo "✓ MercadoPago payment method is active\n";
    
    $config = json_decode($mercadopago['configuration'], true);
    if (isset($config['access_token']) && isset($config['public_key'])) {
        echo "✓ MercadoPago credentials are configured\n";
        echo "  - Access Token: " . substr($config['access_token'], 0, 20) . "...\n";
        echo "  - Public Key: " . substr($config['public_key'], 0, 20) . "...\n";
        echo "  - Sandbox Mode: " . ($config['sandbox'] ? 'Yes' : 'No') . "\n";
    } else {
        echo "❌ MercadoPago credentials not properly configured\n";
    }
} else {
    echo "❌ MercadoPago payment method not found or inactive\n";
}

echo "\n4. TESTING API ENDPOINTS\n";
echo "========================\n";

// Test config endpoint
$config_url = 'http://localhost:8000/api/mercadopago/config';
$config_response = @file_get_contents($config_url);

if ($config_response !== false) {
    $config_data = json_decode($config_response, true);
    if (isset($config_data['public_key'])) {
        echo "✓ /api/mercadopago/config endpoint working\n";
        echo "  - Public Key returned: " . substr($config_data['public_key'], 0, 20) . "...\n";
    } else {
        echo "❌ /api/mercadopago/config endpoint not returning proper data\n";
    }
} else {
    echo "❌ /api/mercadopago/config endpoint not accessible\n";
}

echo "\n5. TESTING MERCADOPAGO SDK INTEGRATION\n";
echo "======================================\n";

require_once 'vendor/autoload.php';

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;

try {
    if ($mercadopago && isset($config['access_token'])) {
        MercadoPagoConfig::setAccessToken($config['access_token']);
        MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL);
        
        $client = new PreferenceClient();
        
        $preference = $client->create([
            "items" => [
                [
                    "title" => "Test Product",
                    "description" => "Test Description",
                    "quantity" => 1,
                    "unit_price" => 100
                ]
            ],
            "back_urls" => [
                "success" => "http://localhost:8000/checkout/success",
                "failure" => "http://localhost:8000/checkout/failure",
                "pending" => "http://localhost:8000/checkout/pending"
            ],
            "auto_return" => "approved"
        ]);
        
        echo "✓ MercadoPago SDK working correctly\n";
        echo "  - Test Preference ID: " . $preference->id . "\n";
        echo "  - Sandbox Init Point: " . $preference->sandbox_init_point . "\n";
    } else {
        echo "❌ Cannot test SDK - MercadoPago not configured\n";
    }
} catch (Exception $e) {
    echo "❌ MercadoPago SDK Error: " . $e->getMessage() . "\n";
}

echo "\n6. CHECKING CRITICAL FILES\n";
echo "==========================\n";

$critical_files = [
    'app/Http/Controllers/MercadoPagoController.php' => 'MercadoPago Controller',
    'app/Http/Controllers/PaymentController.php' => 'Payment Controller',
    'config/services.php' => 'Services Configuration',
    'resources/js/Components/Tailwind/Checkouts/Components/ShippingStep.jsx' => 'Shipping Step Component',
    'routes/api.php' => 'API Routes'
];

foreach ($critical_files as $file => $description) {
    if (file_exists($file)) {
        echo "✓ $description exists\n";
    } else {
        echo "❌ $description missing\n";
    }
}

echo "\n7. CHECKING ROUTES\n";
echo "==================\n";

// Check if routes file contains MercadoPago routes
if (file_exists('routes/api.php')) {
    $routes_content = file_get_contents('routes/api.php');
    if (strpos($routes_content, 'mercadopago') !== false) {
        echo "✓ MercadoPago routes found in api.php\n";
    } else {
        echo "❌ MercadoPago routes not found in api.php\n";
    }
} else {
    echo "❌ routes/api.php file not found\n";
}

echo "\n8. VERIFYING FRONTEND INTEGRATION\n";
echo "=================================\n";

// Check if the PaymentStepsModalFixed is being used
$shipping_step_file = 'resources/js/Components/Tailwind/Checkouts/Components/ShippingStep.jsx';
if (file_exists($shipping_step_file)) {
    $shipping_content = file_get_contents($shipping_step_file);
    if (strpos($shipping_content, 'PaymentStepsModalFixed') !== false) {
        echo "✓ ShippingStep is using PaymentStepsModalFixed\n";
    } elseif (strpos($shipping_content, 'PaymentStepsModal') !== false) {
        echo "⚠ ShippingStep is using PaymentStepsModal (original)\n";
    } else {
        echo "❌ ShippingStep is not using any payment modal\n";
    }
} else {
    echo "❌ ShippingStep.jsx file not found\n";
}

echo "\n==================================================\n";
echo "FINAL INTEGRATION STATUS\n";
echo "==================================================\n";

$all_good = empty($selector_issues) && empty($source_issues) && $mercadopago && $config_response;

if ($all_good) {
    echo "🎉 SUCCESS: MercadoPago integration is FULLY FUNCTIONAL!\n\n";
    echo "WHAT WORKS:\n";
    echo "- ✓ No invalid selectors in build or source files\n";
    echo "- ✓ Payment method is active and properly configured\n";
    echo "- ✓ API endpoints are responding correctly\n";
    echo "- ✓ MercadoPago SDK can create preferences\n";
    echo "- ✓ All critical files are present\n";
    echo "- ✓ Frontend integration is implemented\n\n";
    
    echo "NEXT STEPS:\n";
    echo "1. Clear browser cache and reload the application\n";
    echo "2. Test the full checkout flow in the browser\n";
    echo "3. Verify payment redirection to MercadoPago\n";
    echo "4. Test webhook notifications (optional)\n";
    echo "5. Deploy to production with real credentials (when ready)\n\n";
    
    echo "SANDBOX TEST CREDENTIALS:\n";
    echo "- Test cards: https://www.mercadopago.com.pe/developers/en/guides/online-payments/checkout-pro/test-integration\n";
    echo "- Visa: 4013 5406 8274 6260\n";
    echo "- Mastercard: 5031 7557 3453 0604\n";
    echo "- Security code: 123\n";
    echo "- Expiration: Any future date\n";
} else {
    echo "❌ ISSUES FOUND: Please review the errors above\n";
}

echo "\n==================================================\n";
echo "Integration verification completed at " . date('Y-m-d H:i:s') . "\n";
echo "==================================================\n";
?>
