<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== VERIFICANDO COLUMNA item_id EN sale_details ===\n";

try {
    $columns = Illuminate\Support\Facades\DB::select('SHOW COLUMNS FROM sale_details');
    foreach($columns as $column) {
        if($column->Field === 'item_id') {
            echo "item_id column details:\n";
            echo "- Type: {$column->Type}\n";
            echo "- Null: {$column->Null}\n";
            echo "- Default: {$column->Default}\n";
            echo "- Key: {$column->Key}\n";
            echo "- Extra: {$column->Extra}\n";
            break;
        }
    }
    
    // Verificar restricciones de clave foránea
    $constraints = Illuminate\Support\Facades\DB::select("
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = 'bananalab_db' 
        AND TABLE_NAME = 'sale_details' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    ");
    
    echo "\nRestricciones de clave foránea:\n";
    foreach($constraints as $constraint) {
        echo "- {$constraint->CONSTRAINT_NAME}: {$constraint->COLUMN_NAME} -> {$constraint->REFERENCED_TABLE_NAME}.{$constraint->REFERENCED_COLUMN_NAME}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
