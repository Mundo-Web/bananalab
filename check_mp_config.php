<?php

use App\Models\PaymentMethod;

$mp = PaymentMethod::where('slug', 'mercadopago')->first();

if ($mp) {
    echo "=== CONFIGURACIÓN MERCADOPAGO ===" . PHP_EOL;
    echo "ID: " . $mp->id . PHP_EOL;
    echo "Nombre: " . $mp->name . PHP_EOL;
    echo "Activo: " . ($mp->is_active ? 'SÍ' : 'NO') . PHP_EOL;
    echo "Tipo: " . $mp->type . PHP_EOL;
    echo PHP_EOL;
    
    $config = json_decode($mp->configuration, true);
    
    if ($config) {
        echo "CONFIGURACIÓN ACTUAL:" . PHP_EOL;
        foreach ($config as $key => $value) {
            if (in_array($key, ['access_token', 'public_key'])) {
                // Mostrar solo los primeros 20 caracteres de las keys
                echo "$key: " . substr($value, 0, 20) . "..." . PHP_EOL;
            } else {
                echo "$key: $value" . PHP_EOL;
            }
        }
    } else {
        echo "CONFIGURACIÓN: NULL o vacía" . PHP_EOL;
    }
    
} else {
    echo "MercadoPago NO encontrado" . PHP_EOL;
}
