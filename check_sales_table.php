<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== ESTRUCTURA DE LA TABLA SALES ===\n";

try {
    $columns = Illuminate\Support\Facades\DB::select('SHOW COLUMNS FROM sales');
    echo "Columnas encontradas:\n";
    foreach($columns as $column) {
        echo "- {$column->Field} ({$column->Type})\n";
    }
    
    echo "\n=== VERIFICANDO MODELO SALE ===\n";
    
    // Verificar el modelo Sale
    $sale = new App\Models\Sale();
    $fillable = $sale->getFillable();
    echo "Campos fillable en el modelo Sale:\n";
    foreach($fillable as $field) {
        echo "- {$field}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
