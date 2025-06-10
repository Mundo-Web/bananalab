<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PaymentController;

/*
|--------------------------------------------------------------------------
| Payment API Routes
|--------------------------------------------------------------------------
| Rutas para manejar diferentes métodos de pago
*/

// Grupo de rutas para pagos
Route::prefix('payments')->group(function () {
    
    // Procesar pago con MercadoPago
    Route::post('/mercadopago', [PaymentController::class, 'processMercadoPago']);
    
    // Procesar pago manual (Yape/Transferencia)
    Route::post('/manual', [PaymentController::class, 'processManualPayment']);
    
    // Obtener métodos de pago disponibles
    Route::get('/methods', [PaymentController::class, 'getPaymentMethods']);
    
    // Validar comprobante de pago (para admin)
    Route::post('/validate-proof', [PaymentController::class, 'validatePaymentProof'])->middleware('auth:admin');
    
    // Webhook de MercadoPago
    Route::post('/mercadopago/webhook', [PaymentController::class, 'mercadoPagoWebhook']);
    
    // Obtener estado de pago
    Route::get('/status/{orderId}', [PaymentController::class, 'getPaymentStatus']);
});
