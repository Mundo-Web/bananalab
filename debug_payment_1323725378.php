<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Crear una instancia mínima de Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== DEBUG PAGO MERCADOPAGO - OPERACIÓN #1323725378 ===\n\n";

try {
    // 1. Buscar ventas con payment_status diferente de 'pagado'
    echo "1. BUSCANDO VENTAS PENDIENTES O NO CONFIRMADAS:\n";
    $sales = \App\Models\Sale::where('payment_status', '!=', 'pagado')
        ->orderBy('created_at', 'desc')
        ->take(10)
        ->get();
    
    foreach ($sales as $sale) {
        echo "   - Venta ID: {$sale->id} | Código: {$sale->code} | Estado: {$sale->payment_status} | Fecha: {$sale->created_at}\n";
        echo "     Nombre: {$sale->fullname} | Email: {$sale->email} | Monto: {$sale->amount}\n";
        if ($sale->culqi_charge_id) {
            echo "     Payment ID: {$sale->culqi_charge_id}\n";
        }
        echo "\n";
    }

    // 2. Buscar en logs de webhooks recientes
    echo "2. VERIFICANDO LOGS DE WEBHOOK (últimos 50 registros):\n";
    $logFile = storage_path('logs/laravel.log');
    if (file_exists($logFile)) {
        $lines = file($logFile);
        $webhookLines = array_filter($lines, function($line) {
            return strpos($line, 'MercadoPago') !== false || 
                   strpos($line, 'webhook') !== false ||
                   strpos($line, '1323725378') !== false;
        });
        
        $recentWebhookLines = array_slice($webhookLines, -20);
        foreach ($recentWebhookLines as $line) {
            echo "   " . trim($line) . "\n";
        }
    } else {
        echo "   No se encontró archivo de logs\n";
    }

    // 3. Verificar configuración de MercadoPago
    echo "\n3. CONFIGURACIÓN DE MERCADOPAGO:\n";
    $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')->first();
    if ($paymentMethod) {
        echo "   Estado: " . ($paymentMethod->is_active ? "Activo" : "Inactivo") . "\n";
        $config = json_decode($paymentMethod->configuration, true);
        echo "   Sandbox: " . ($config['sandbox'] ? "Sí" : "No") . "\n";
        echo "   Access Token: " . substr($config['access_token'], 0, 20) . "...\n";
        echo "   Public Key: " . substr($config['public_key'], 0, 20) . "...\n";
    }

    // 4. Verificar rutas de webhooks y callbacks
    echo "\n4. VERIFICANDO RUTAS:\n";
    $appUrl = config('app.url', 'http://localhost:8000');
    echo "   App URL: {$appUrl}\n";
    echo "   Webhook URL: {$appUrl}/api/mercadopago/webhook\n";
    echo "   Success URL: {$appUrl}/checkout/success\n";

    // 5. Probar conexión con MercadoPago usando el payment ID de la operación
    echo "\n5. INTENTANDO CONSULTAR PAGO EN MERCADOPAGO:\n";
    if ($paymentMethod && $config['access_token']) {
        try {
            \MercadoPago\MercadoPagoConfig::setAccessToken($config['access_token']);
            
            // Intentar buscar pagos recientes
            $paymentClient = new \MercadoPago\Client\Payment\PaymentClient();
            
            // Como no tenemos el payment_id exacto, busquemos por external_reference
            echo "   Buscando pagos por external_reference...\n";
            
            // Buscar ventas recientes que puedan corresponder al pago
            $recentSales = \App\Models\Sale::where('created_at', '>', now()->subDays(1))
                ->orderBy('created_at', 'desc')
                ->get();
            
            foreach ($recentSales as $sale) {
                echo "   Verificando venta {$sale->code}...\n";
                try {
                    // Aquí necesitaríamos el payment_id específico para consultar
                    // Pero podemos verificar si hay algún payment_id asociado
                    if ($sale->culqi_charge_id) {
                        $payment = $paymentClient->get($sale->culqi_charge_id);
                        echo "     Payment ID: {$payment->id} | Status: {$payment->status} | Amount: {$payment->transaction_amount}\n";
                    }
                } catch (\Exception $e) {
                    echo "     Error al consultar pago: " . $e->getMessage() . "\n";
                }
            }
            
        } catch (\Exception $e) {
            echo "   Error al conectar con MercadoPago: " . $e->getMessage() . "\n";
        }
    }

    // 6. Buscar en la base de datos por la operación específica
    echo "\n6. BUSCANDO OPERACIÓN #1323725378 EN LA BASE DE DATOS:\n";
    $salesWithPaymentId = \App\Models\Sale::where('culqi_charge_id', 'LIKE', '%1323725378%')->get();
    if ($salesWithPaymentId->count() > 0) {
        foreach ($salesWithPaymentId as $sale) {
            echo "   ENCONTRADA: Venta ID {$sale->id} con payment_id: {$sale->culqi_charge_id}\n";
        }
    } else {
        echo "   No se encontró ninguna venta con la operación #1323725378\n";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== FIN DEL DEBUG ===\n";
