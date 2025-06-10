<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $methods = [
            [
                'name' => 'Culqi',
                'slug' => 'culqi',
                'display_name' => 'Tarjeta de Crédito/Débito',
                'description' => 'Pago seguro con Visa, Mastercard',
                'type' => 'gateway',
                'is_active' => true,
                'requires_proof' => false,
                'fee_percentage' => 3.99,
                'fee_fixed' => 0.30,
                'configuration' => [
                    'public_key' => 'pk_test_xxxxxxxx',
                    'secret_key' => 'sk_test_xxxxxxxx',
                    'currency' => 'PEN'
                ],
                'instructions' => null,
                'sort_order' => 1
            ],
            [
                'name' => 'MercadoPago',
                'slug' => 'mercadopago',
                'display_name' => 'MercadoPago',
                'description' => 'Pago online seguro',
                'type' => 'gateway',
                'is_active' => true,
                'requires_proof' => false,
                'fee_percentage' => 5.99,
                'fee_fixed' => 0.00,
                'configuration' => [
                    'access_token' => 'APP_USR-xxxxxxxx',
                    'public_key' => 'APP_USR-xxxxxxxx',
                    'webhook_url' => 'https://tudominio.com/webhook/mercadopago',
                    'sandbox' => true
                ],
                'instructions' => null,
                'sort_order' => 2
            ],
            [
                'name' => 'Yape',
                'slug' => 'yape',
                'display_name' => 'Yape',
                'description' => 'Pago móvil instantáneo',
                'type' => 'qr',
                'is_active' => true,
                'requires_proof' => true,
                'fee_percentage' => 0.00,
                'fee_fixed' => 0.00,
                'configuration' => [
                    'phone_number' => '+51 999 888 777',
                    'account_name' => 'BananaLab SAC',
                    'qr_code' => null
                ],
                'instructions' => [
                    'title' => 'Instrucciones para Yape:',
                    'steps' => [
                        'Realiza el Yape al número: +51 999 888 777',
                        'Monto exacto: S/ {amount}',
                        'Concepto: Pedido #{order_code}',
                        'Toma captura del comprobante',
                        'Sube la imagen en el formulario'
                    ],
                    'note' => 'El pago será verificado en 24 horas'
                ],
                'sort_order' => 3
            ],
            [
                'name' => 'Transferencia Bancaria',
                'slug' => 'transferencia',
                'display_name' => 'Transferencia Bancaria',
                'description' => 'Depósito o transferencia directa',
                'type' => 'manual',
                'is_active' => true,
                'requires_proof' => true,
                'fee_percentage' => 0.00,
                'fee_fixed' => 0.00,
                'configuration' => [
                    'bank_name' => 'Banco de Crédito del Perú (BCP)',
                    'account_type' => 'corriente',
                    'account_number' => '123-456789-0-12',
                    'cci' => '00212312345678901234',
                    'account_holder' => 'BananaLab SAC'
                ],
                'instructions' => [
                    'title' => 'Datos para Transferencia:',
                    'data' => [
                        'Banco: Banco de Crédito del Perú (BCP)',
                        'Tipo: Cuenta Corriente',
                        'Número: 123-456789-0-12',
                        'CCI: 00212312345678901234',
                        'Titular: BananaLab SAC',
                        'Monto: S/ {amount}'
                    ],
                    'steps' => [
                        'Realiza la transferencia con los datos mostrados',
                        'Guarda el voucher de la operación',
                        'Sube el comprobante en el formulario'
                    ],
                    'note' => 'El pago será verificado en 24-48 horas'
                ],
                'sort_order' => 4
            ]
        ];

        foreach ($methods as $method) {
            PaymentMethod::updateOrCreate(
                ['slug' => $method['slug']],
                $method
            );
        }
    }
}
