<?php
echo "=== QUICK VERIFICATION AFTER FIX ===" . PHP_EOL;
echo "Checking if PaymentStepsModalNew references exist..." . PHP_EOL;

$files = [
    'resources/js/Components/Tailwind/Checkouts/Components/ShippingStep.jsx',
    'resources/js/Components/Tailwind/Checkouts/Components/ShippingStepSF.jsx'
];

foreach ($files as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if (strpos($content, 'PaymentStepsModalNew') !== false) {
            echo "❌ Found PaymentStepsModalNew in: " . $file . PHP_EOL;
        } else {
            echo "✅ No PaymentStepsModalNew in: " . basename($file) . PHP_EOL;
        }
        
        if (strpos($content, 'PaymentStepsModalFixed') !== false) {
            echo "✅ Found PaymentStepsModalFixed in: " . basename($file) . PHP_EOL;
        }
    }
}

echo PHP_EOL . "=== VERIFICATION COMPLETE ===" . PHP_EOL;
?>
