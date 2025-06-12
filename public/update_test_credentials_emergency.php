<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../vendor/autoload.php';

// Cargar la configuración de Laravel
$app = require_once '../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['public_key']) || !isset($input['access_token'])) {
        throw new Exception('Datos incompletos');
    }

    $publicKey = trim($input['public_key']);
    $accessToken = trim($input['access_token']);

    // Validar que sean credenciales de TEST
    if (!str_starts_with($publicKey, 'TEST-') || !str_starts_with($accessToken, 'TEST-')) {
        throw new Exception('Las credenciales deben empezar con "TEST-" para funcionar en sandbox');
    }

    // Buscar el método de pago MercadoPago
    $paymentMethod = PaymentMethod::where('slug', 'mercadopago')->first();

    if (!$paymentMethod) {
        throw new Exception('MercadoPago no encontrado en base de datos');
    }

    // Configuración actualizada con credenciales de TEST
    $newConfig = [
        'public_key' => $publicKey,
        'access_token' => $accessToken,
        'sandbox' => true,  // Forzar sandbox con credenciales TEST
    ];

    // Actualizar configuración
    $paymentMethod->configuration = json_encode($newConfig);
    $paymentMethod->save();

    echo json_encode([
        'success' => true,
        'message' => 'Credenciales de TEST actualizadas exitosamente',
        'config' => [
            'public_key' => substr($publicKey, 0, 20) . '...',
            'access_token' => substr($accessToken, 0, 20) . '...',
            'sandbox' => true
        ]
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
