<?php
require_once __DIR__ . '/vendor/autoload.php';

// Configurar Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentMethod;

// Crear método Culqi
$culqi = new PaymentMethod();
$culqi->name = 'Culqi';
$culqi->slug = 'culqi';
$culqi->display_name = 'Tarjeta de Crédito/Débito';
$culqi->description = 'Visa, Mastercard';
$culqi->type = 'gateway';
$culqi->template_key = 'culqi';
$culqi->is_active = true;
$culqi->requires_proof = false;
$culqi->fee_percentage = 0;
$culqi->fee_fixed = 0;
$culqi->sort_order = 1;
$culqi->configuration = json_encode([
    'public_key' => 'pk_test_xxxxxxxxx',
    'currency' => 'PEN'
]);
$culqi->instructions = json_encode([
    'title' => 'Instrucciones para Culqi:',
    'steps' => [
        'Rellena los datos de tu tarjeta',
        'Confirma el pago',
        'Recibirás confirmación inmediata'
    ]
]);
$culqi->save();
echo "✅ Método Culqi creado\n";

// Crear método Yape
$yape = new PaymentMethod();
$yape->name = 'Yape';
$yape->slug = 'yape';
$yape->display_name = 'Yape';
$yape->description = 'Pago móvil';
$yape->type = 'qr';
$yape->template_key = 'yape';
$yape->is_active = true;
$yape->requires_proof = true;
$yape->fee_percentage = 0;
$yape->fee_fixed = 0;
$yape->sort_order = 2;
$yape->configuration = json_encode([
    'phone' => '+51 999 888 777',
    'qr_image' => null
]);
$yape->instructions = json_encode([
    'title' => 'Instrucciones para Yape:',
    'steps' => [
        'Realiza el Yape al número configurado',
        'Toma captura del comprobante',
        'Sube la imagen en el formulario'
    ],
    'show_phone' => true,
    'qr_display' => false
]);
$yape->save();
echo "✅ Método Yape creado\n";

// Crear método Plin
$plin = new PaymentMethod();
$plin->name = 'Plin';
$plin->slug = 'plin';
$plin->display_name = 'Plin';
$plin->description = 'Pago móvil';
$plin->type = 'qr';
$plin->template_key = 'plin';
$plin->is_active = true;
$plin->requires_proof = true;
$plin->fee_percentage = 0;
$plin->fee_fixed = 0;
$plin->sort_order = 3;
$plin->configuration = json_encode([
    'phone' => '+51 999 777 888',
    'qr_image' => null
]);
$plin->instructions = json_encode([
    'title' => 'Instrucciones para Plin:',
    'steps' => [
        'Realiza el Plin al número configurado',
        'Toma captura del comprobante',
        'Sube la imagen en el formulario'
    ],
    'show_phone' => true,
    'qr_display' => false
]);
$plin->save();
echo "✅ Método Plin creado\n";

// Crear método Transferencia Bancaria
$transferencia = new PaymentMethod();
$transferencia->name = 'Transferencia Bancaria';
$transferencia->slug = 'transferencia-bancaria';
$transferencia->display_name = 'Transferencia Bancaria';
$transferencia->description = 'Depósito o transferencia';
$transferencia->type = 'manual';
$transferencia->template_key = 'transferencia';
$transferencia->is_active = true;
$transferencia->requires_proof = true;
$transferencia->fee_percentage = 0;
$transferencia->fee_fixed = 0;
$transferencia->sort_order = 4;
$transferencia->configuration = json_encode([
    'bank_name' => 'BCP',
    'account_number' => '123-456789-0-12',
    'cci' => '00212312345678901234',
    'account_holder' => 'BananaLab SAC'
]);
$transferencia->instructions = json_encode([
    'title' => 'Datos para Transferencia:',
    'bank_info' => [
        '<strong>Banco:</strong> BCP',
        '<strong>Cuenta Corriente:</strong> 123-456789-0-12',
        '<strong>CCI:</strong> 00212312345678901234',
        '<strong>Titular:</strong> BananaLab SAC'
    ],
    'steps' => [
        'Realiza la transferencia con los datos proporcionados',
        'Guarda el voucher de la transferencia',
        'Sube el voucher en el formulario'
    ],
    'show_cci' => true,
    'note' => 'Sube el voucher de la transferencia en el formulario'
]);
$transferencia->save();
echo "✅ Método Transferencia Bancaria creado\n";

echo "\n🎉 Todos los métodos de pago han sido creados exitosamente!\n";
