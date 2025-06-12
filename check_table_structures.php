<?php

use Illuminate\Support\Facades\DB;

try {
    echo "=== ESTRUCTURA DE LA TABLA ITEMS ===\n";
    $itemsStructure = DB::select('DESCRIBE items');
    foreach ($itemsStructure as $column) {
        echo sprintf("%-20s %-20s %-10s %-10s %-10s %-20s\n", 
            $column->Field, 
            $column->Type, 
            $column->Null, 
            $column->Key, 
            $column->Default ?? 'NULL', 
            $column->Extra ?? ''
        );
    }
    
    echo "\n=== ESTRUCTURA DE LA TABLA ITEM_PRESETS ===\n";
    $presetsStructure = DB::select('DESCRIBE item_presets');
    foreach ($presetsStructure as $column) {
        echo sprintf("%-20s %-20s %-10s %-10s %-10s %-20s\n", 
            $column->Field, 
            $column->Type, 
            $column->Null, 
            $column->Key, 
            $column->Default ?? 'NULL', 
            $column->Extra ?? ''
        );
    }
    
    echo "\n=== VERIFICAR SI LA TABLA ALBUMS EXISTE ===\n";
    $tablesResult = DB::select("SHOW TABLES LIKE 'albums'");
    if (empty($tablesResult)) {
        echo "La tabla albums NO existe\n";
    } else {
        echo "La tabla albums SÍ existe - describiéndola:\n";
        $albumsStructure = DB::select('DESCRIBE albums');
        foreach ($albumsStructure as $column) {
            echo sprintf("%-20s %-20s %-10s %-10s %-10s %-20s\n", 
                $column->Field, 
                $column->Type, 
                $column->Null, 
                $column->Key, 
                $column->Default ?? 'NULL', 
                $column->Extra ?? ''
            );
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
