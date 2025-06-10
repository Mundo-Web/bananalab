<?php
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    // Aumentar max_allowed_packet a 100MB
    DB::statement('SET GLOBAL max_allowed_packet = 104857600;');
    echo "max_allowed_packet configurado a 100MB exitosamente.\n";
    
    // Verificar la configuración actual
    $result = DB::select('SHOW VARIABLES LIKE "max_allowed_packet"');
    foreach($result as $row) {
        echo "Configuración actual: {$row->Variable_name} = {$row->Value}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
