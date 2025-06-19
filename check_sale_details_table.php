<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== ESTRUCTURA DE LA TABLA SALE_DETAILS ===\n";

try {
    $columns = Illuminate\Support\Facades\DB::select('SHOW COLUMNS FROM sale_details');
    echo "Columnas encontradas:\n";
    foreach($columns as $column) {
        echo "- {$column->Field} ({$column->Type})\n";
    }
    
    echo "\n=== VERIFICANDO MODELO SALEDETAIL ===\n";
    
    // Verificar el modelo SaleDetail
    $saleDetail = new App\Models\SaleDetail();
    $fillable = $saleDetail->getFillable();
    echo "Campos fillable en el modelo SaleDetail:\n";
    foreach($fillable as $field) {
        echo "- {$field}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
