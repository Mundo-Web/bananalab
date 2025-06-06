<?php
require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Test data
echo "=== Testing Items and Presets ===\n";

// Check items
$items = App\Models\Item::take(5)->get();
echo "Items found: " . $items->count() . "\n";
foreach ($items as $item) {
    echo "Item ID: {$item->id} - Title: {$item->title}\n";
}

echo "\n=== Testing Presets ===\n";

// Check presets
$presets = App\Models\ItemPreset::take(5)->get();
echo "Presets found: " . $presets->count() . "\n";
foreach ($presets as $preset) {
    echo "Preset ID: {$preset->id} - Name: {$preset->name} - Item ID: {$preset->item_id}\n";
}

echo "\n=== Testing API Endpoint ===\n";

if ($items->count() > 0) {
    $firstItem = $items->first();
    echo "Testing with item ID: {$firstItem->id}\n";
      // Simulate the controller call
    $controller = new App\Http\Controllers\Admin\ItemPresetReactController();
    try {
        $request = new Illuminate\Http\Request();
        $response = $controller->getByItemPublic($request, $firstItem);
        echo "API Response: " . json_encode($response->getData()) . "\n";
    } catch (Exception $e) {
        echo "API Error: " . $e->getMessage() . "\n";
    }
}
?>
