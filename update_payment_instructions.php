<?php
// Actualizar métodos de pago con instrucciones mejoradas y variables dinámicas
require_once 'vendor/autoload.php';

use App\Models\PaymentMethod;

try {
    // Load Laravel
    $app = require_once 'bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    
    echo "🚀 Actualizando métodos de pago con instrucciones mejoradas...\n\n";
    
    // Actualizar Yape
    $yapeMethod = PaymentMethod::where('slug', 'yape')->first();
    if ($yapeMethod) {
        $yapeMethod->update([
            'instructions' => [
                'title' => 'Pagar con Yape',
                'steps' => [
                    '📱 Abre tu app de <strong>Yape</strong>',
                    '🔍 Busca el número: <strong>{phone_number}</strong> o escanea el código QR',
                    '💰 Ingresa el monto exacto: <strong>S/ {amount}</strong>',
                    '📝 En el concepto puedes poner: "Compra BananaLab"',
                    '✅ Confirma el pago en tu app',
                    '📸 Toma captura de pantalla del comprobante',
                    '📤 Sube la imagen del comprobante usando el botón de abajo'
                ],
                'qr_display' => true,
                'show_phone' => true,
                'note' => 'El pago será validado automáticamente. Si tienes problemas, contáctanos por WhatsApp.'
            ]
        ]);
        echo "✅ Yape actualizado\n";
    }
    
    // Actualizar Plin
    $plinMethod = PaymentMethod::where('slug', 'plin')->first();
    if ($plinMethod) {
        $plinMethod->update([
            'instructions' => [
                'title' => 'Pagar con Plin',
                'steps' => [
                    '📱 Abre tu app de <strong>Plin</strong>',
                    '🔍 Busca el número: <strong>{phone_number}</strong> o escanea el código QR',
                    '💰 Ingresa el monto exacto: <strong>S/ {amount}</strong>',
                    '📝 En el concepto puedes poner: "Compra BananaLab"',
                    '✅ Confirma el pago en tu app',
                    '📸 Toma captura de pantalla del comprobante',
                    '📤 Sube la imagen del comprobante usando el botón de abajo'
                ],
                'qr_display' => true,
                'show_phone' => true,
                'note' => 'El pago será validado en máximo 30 minutos durante horario laboral.'
            ]
        ]);
        echo "✅ Plin actualizado\n";
    }
    
    // Actualizar Transferencia Bancaria
    $transferMethod = PaymentMethod::where('slug', 'transferencia-bancaria')->first();
    if ($transferMethod) {
        $transferMethod->update([
            'instructions' => [
                'title' => 'Datos para Transferencia Bancaria',
                'bank_info' => [
                    '<strong>🏦 Banco:</strong> {bank_name}',
                    '<strong>👤 Titular:</strong> {account_holder}',
                    '<strong>🆔 RUC/DNI:</strong> {document_number}',
                    '<strong>💳 Tipo de Cuenta:</strong> {account_type}',
                    '<strong>🔢 Número de Cuenta:</strong> {account_number}',
                    '<strong>🏧 CCI:</strong> {cci}',
                    '<strong>💱 Moneda:</strong> Soles ({currency})'
                ],
                'steps' => [
                    '🏦 Ingresa a tu banca online, app móvil o acércate a una agencia',
                    '💰 Realiza la transferencia por el monto exacto: <strong>S/ {amount}</strong>',
                    '📄 Guarda el voucher o comprobante de la operación',
                    '📤 Sube la imagen del voucher usando el botón de abajo',
                    '⏰ Espera la confirmación (verificamos en 24-48 horas máximo)'
                ],
                'note' => 'IMPORTANTE: El voucher debe mostrar claramente la fecha, hora, monto y número de operación. Sin esta información no podremos validar tu pago.'
            ]
        ]);
        echo "✅ Transferencia Bancaria actualizada\n";
    }
    
    // Actualizar Culqi
    $culqiMethod = PaymentMethod::where('slug', 'culqi')->first();
    if ($culqiMethod) {
        $culqiMethod->update([
            'instructions' => [
                'title' => 'Pago con Tarjeta de Crédito/Débito',
                'steps' => [
                    '💳 Ingresa los datos de tu tarjeta de crédito o débito',
                    '🔒 Todos los datos están protegidos con encriptación SSL',
                    '✅ Confirma el pago por: <strong>S/ {amount}</strong>',
                    '📧 Recibirás la confirmación por email inmediatamente'
                ],
                'note' => 'Aceptamos Visa, Mastercard y Diners. El cargo aparecerá como "CULQI*BANANALAB" en tu estado de cuenta.'
            ]
        ]);
        echo "✅ Culqi actualizado\n";
    }
    
    // Actualizar MercadoPago
    $mercadopagoMethod = PaymentMethod::where('slug', 'mercadopago')->first();
    if ($mercadopagoMethod) {
        $mercadopagoMethod->update([
            'instructions' => [
                'title' => 'Pago con MercadoPago',
                'steps' => [
                    '🛡️ Serás redirigido a la plataforma segura de MercadoPago',
                    '💳 Elige tu método favorito: tarjeta, efectivo, o saldo MP',
                    '✅ Confirma el pago por: <strong>S/ {amount}</strong>',
                    '🔄 Serás redirigido de vuelta automáticamente',
                    '📧 Recibirás la confirmación por email'
                ],
                'note' => 'Puedes pagar con tarjetas, efectivo en puntos autorizados, o saldo de MercadoPago.'
            ]
        ]);
        echo "✅ MercadoPago actualizado\n";
    }
    
    echo "\n🎉 ¡Todos los métodos de pago han sido actualizados con instrucciones mejoradas!\n";
    echo "📋 Las instrucciones ahora incluyen:\n";
    echo "   • Variables dinámicas ({phone_number}, {amount}, etc.)\n";
    echo "   • Iconos y emojis para mejor UX\n";
    echo "   • Pasos más claros y detallados\n";
    echo "   • Notas importantes específicas por método\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
