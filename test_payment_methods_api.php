<?php
// Test API endpoint directly
require_once 'vendor/autoload.php';

use App\Models\PaymentMethod;

// Test if we can access the model directly
try {
    echo "Testing PaymentMethod model...\n";
    
    // Load Laravel
    $app = require_once 'bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    
    // Get active payment methods
    $methods = PaymentMethod::active()->ordered()->get();
    
    echo "Found " . $methods->count() . " active payment methods:\n";
    
    foreach ($methods as $method) {
        echo "- ID: {$method->id}, Name: {$method->display_name}, Type: {$method->type}, Active: " . ($method->is_active ? 'Yes' : 'No') . "\n";
    }
    
    // Test the formatted response
    echo "\nTesting formatted response:\n";
    $formattedMethods = $methods->map(function ($method) {
        return [
            'id' => $method->id,
            'slug' => $method->slug,
            'name' => $method->display_name,
            'description' => $method->description,
            'type' => $method->type,
            'icon' => $method->getIconUrl(),
            'requires_proof' => $method->requires_proof,
            'fee_percentage' => $method->fee_percentage,
            'fee_fixed' => $method->fee_fixed,
            'instructions' => $method->instructions
        ];
    });
    
    echo json_encode($formattedMethods, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
