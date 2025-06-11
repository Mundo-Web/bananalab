<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SoDe\Extend\Crypto;

class PaymentMethodController extends BasicController
{
    public $model = PaymentMethod::class;
    public $reactView = 'Admin/PaymentMethodsAdmin';

    public $imageFields = ['icon'];
    // Usar hooks de BasicController para lógica personalizada
    public function beforeSave(Request $request)
    {
        $data = $request->except(['config_files']);

        // Convertir booleanos y valores numéricos
        $data['is_active'] = $request->boolean('is_active', true);
        $data['requires_proof'] = $request->boolean('requires_proof', false);
        $data['fee_percentage'] = $request->fee_percentage ?? 0;
        $data['fee_fixed'] = $request->fee_fixed ?? 0;
        $data['sort_order'] = $request->sort_order ?? 0;

        // Slug automático
        if (!isset($data['slug']) || empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }


        // Configuración JSON
        $configuration = [];
        if ($request->has('configuration')) {
            $configData = $request->configuration;
            if (is_string($configData)) {
                $configuration = json_decode($configData, true) ?? [];
            } else {
                $configuration = $configData ?? [];
            }
        }

        // Archivos de configuración (ej: QR)
        if ($request->hasFile('config_files')) {
            foreach ($request->file('config_files') as $fieldKey => $file) {
                if ($file && $file->isValid()) {
  

                    $uuid = Crypto::randomUUID();
                    $ext = $file->getClientOriginalExtension();
                    $path = "images/payment_method/{$uuid}.{$ext}";
                    Storage::put($path, file_get_contents($file));
                    $configuration[$fieldKey] = "{$uuid}.{$ext}";
                   
                }
            }
        }
        $data['configuration'] = json_encode($configuration, JSON_UNESCAPED_UNICODE);

        // Instrucciones JSON
        if ($request->has('instructions')) {
            $instructionsData = $request->instructions;
            if (is_string($instructionsData)) {
                $data['instructions'] = json_decode($instructionsData, true) ?? [];
            } else {
                $data['instructions'] = $instructionsData ?? [];
            }
        }

        return $data;
    }

    // Si necesitas lógica después de guardar, puedes usar afterSave
    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        // Puedes devolver el modelo actualizado si lo necesitas
        return $jpa->fresh();
    }

    // El resto de métodos personalizados (getConfigTemplates, toggleStatus, reorder, etc.) se mantienen igual

    /**
     * Actualizar método de pago existente
     */
    public function update(Request $request, $id)
    {
        $request->merge(['id' => $id]);
        return $this->store($request);
    }

    /**
     * Obtener plantillas de configuración por tipo
     */    public function getConfigTemplates()
    {
        return response()->json([
            'status' => true,
            'templates' => [
                'culqi' => [
                    'type' => 'gateway',
                    'config' => [
                        'public_key' => [
                            'type' => 'text',
                            'label' => 'Clave Pública',
                            'required' => true,
                            'placeholder' => 'pk_test_xxxxxxxx'
                        ],
                        'secret_key' => [
                            'type' => 'password',
                            'label' => 'Clave Secreta',
                            'required' => true,
                            'placeholder' => 'sk_test_xxxxxxxx'
                        ],
                        'currency' => [
                            'type' => 'select',
                            'label' => 'Moneda',
                            'options' => ['PEN' => 'Soles', 'USD' => 'Dólares'],
                            'default' => 'PEN'
                        ]
                    ],
                    'instructions' => [
                        'title' => 'Instrucciones para Culqi:',
                        'steps' => [
                            'Rellena los datos de tu tarjeta',
                            'Confirma el pago',
                            'Recibirás confirmación inmediata'
                        ]
                    ]
                ],
                'mercadopago' => [
                    'type' => 'gateway',
                    'config' => [
                        'access_token' => [
                            'type' => 'password',
                            'label' => 'Access Token',
                            'required' => true,
                            'placeholder' => 'APP_USR-xxxxxxxx'
                        ],
                        'public_key' => [
                            'type' => 'text',
                            'label' => 'Public Key',
                            'required' => true,
                            'placeholder' => 'APP_USR-xxxxxxxx'
                        ],
                        'webhook_url' => [
                            'type' => 'url',
                            'label' => 'Webhook URL',
                            'placeholder' => 'https://tudominio.com/webhook/mercadopago'
                        ],
                        'sandbox' => [
                            'type' => 'boolean',
                            'label' => 'Modo Sandbox',
                            'default' => true
                        ]
                    ],
                    'instructions' => [
                        'title' => 'Instrucciones para MercadoPago:',
                        'steps' => [
                            'Selecciona tu método de pago preferido',
                            'Completa los datos solicitados',
                            'Confirma el pago'
                        ]
                    ]
                ],
                'yape' => [
                    'type' => 'qr',
                    'config' => [
                        'phone_number' => [
                            'type' => 'tel',
                            'label' => 'Número de Teléfono Yape',
                            'required' => true,
                            'placeholder' => '+51 999 888 777'
                        ],
                        'qr_code' => [
                            'type' => 'file',
                            'label' => 'Código QR Yape',
                            'accept' => 'image/*',
                            'help' => 'Sube tu código QR personal de Yape'
                        ],
                        'account_name' => [
                            'type' => 'text',
                            'label' => 'Nombre de la Cuenta',
                            'required' => true,
                            'placeholder' => 'BananaLab SAC'
                        ],
                        'instructions_text' => [
                            'type' => 'textarea',
                            'label' => 'Instrucciones Personalizadas',
                            'placeholder' => 'Instrucciones adicionales para el usuario'
                        ]
                    ],
                    'instructions' => [
                        'title' => 'Pagar con Yape',
                        'steps' => [
                            '📱 Abre tu app de Yape',
                            '📷 Escanea el código QR o busca el número: <strong>{phone_number}</strong>',
                            '💰 Ingresa el monto: <strong>S/ {amount}</strong>',
                            '✅ Confirma el pago',
                            '📸 Toma captura del comprobante',
                            '📤 Sube la imagen del comprobante'
                        ],
                        'qr_display' => true,
                        'show_phone' => true
                    ]
                ],
                'plin' => [
                    'type' => 'qr',
                    'config' => [
                        'phone_number' => [
                            'type' => 'tel',
                            'label' => 'Número de Teléfono Plin',
                            'required' => true,
                            'placeholder' => '+51 999 888 777'
                        ],
                        'qr_code' => [
                            'type' => 'file',
                            'label' => 'Código QR Plin',
                            'accept' => 'image/*',
                            'help' => 'Sube tu código QR personal de Plin'
                        ],
                        'account_name' => [
                            'type' => 'text',
                            'label' => 'Nombre de la Cuenta',
                            'required' => true,
                            'placeholder' => 'BananaLab SAC'
                        ]
                    ],
                    'instructions' => [
                        'title' => 'Pagar con Plin',
                        'steps' => [
                            '📱 Abre tu app de Plin',
                            '📷 Escanea el código QR o busca el número: <strong>{phone_number}</strong>',
                            '💰 Ingresa el monto: <strong>S/ {amount}</strong>',
                            '✅ Confirma el pago',
                            '📸 Toma captura del comprobante',
                            '📤 Sube la imagen del comprobante'
                        ],
                        'qr_display' => true,
                        'show_phone' => true
                    ]
                ],
                'transferencia_bancaria' => [
                    'type' => 'manual',
                    'config' => [
                        'bank_name' => [
                            'type' => 'select',
                            'label' => 'Banco',
                            'required' => true,
                            'options' => [
                                'BCP' => 'Banco de Crédito del Perú',
                                'BBVA' => 'BBVA Continental',
                                'Interbank' => 'Interbank',
                                'Scotiabank' => 'Scotiabank',
                                'BIF' => 'Banco Interamericano de Finanzas',
                                'Falabella' => 'Banco Falabella',
                                'Ripley' => 'Banco Ripley',
                                'Azteca' => 'Banco Azteca',
                                'ICBC' => 'ICBC Peru Bank',
                                'MiBanco' => 'MiBanco',
                                'Banbif' => 'Banbif',
                                'Citibank' => 'Citibank'
                            ]
                        ],
                        'account_type' => [
                            'type' => 'select',
                            'label' => 'Tipo de Cuenta',
                            'required' => true,
                            'options' => [
                                'corriente' => 'Cuenta Corriente',
                                'ahorros' => 'Cuenta de Ahorros',
                                'corriente_soles' => 'Cuenta Corriente Soles',
                                'ahorros_soles' => 'Cuenta Ahorros Soles',
                                'corriente_dolares' => 'Cuenta Corriente Dólares',
                                'ahorros_dolares' => 'Cuenta Ahorros Dólares'
                            ],
                            'default' => 'corriente_soles'
                        ],
                        'account_number' => [
                            'type' => 'text',
                            'label' => 'Número de Cuenta',
                            'required' => true,
                            'placeholder' => '123-456789-0-12'
                        ],
                        'cci' => [
                            'type' => 'text',
                            'label' => 'CCI (Código de Cuenta Interbancario)',
                            'required' => true,
                            'placeholder' => '00212312345678901234',
                            'help' => '20 dígitos del código CCI'
                        ],
                        'account_holder' => [
                            'type' => 'text',
                            'label' => 'Titular de la Cuenta',
                            'required' => true,
                            'placeholder' => 'BananaLab SAC'
                        ],
                        'document_number' => [
                            'type' => 'text',
                            'label' => 'RUC/DNI del Titular',
                            'placeholder' => '20123456789'
                        ],
                        'currency' => [
                            'type' => 'select',
                            'label' => 'Moneda',
                            'options' => [
                                'PEN' => 'Soles (S/)',
                                'USD' => 'Dólares ($)'
                            ],
                            'default' => 'PEN'
                        ]
                    ],
                    'instructions' => [
                        'title' => 'Datos para Transferencia Bancaria',
                        'bank_info' => [
                            'Banco: <strong>{bank_name}</strong>',
                            'Tipo de Cuenta: <strong>{account_type}</strong>',
                            'Número de Cuenta: <strong>{account_number}</strong>',
                            'CCI: <strong>{cci}</strong>',
                            'Titular: <strong>{account_holder}</strong>',
                            'RUC/DNI: <strong>{document_number}</strong>',
                            'Moneda: <strong>{currency}</strong>'
                        ],
                        'steps' => [
                            '🏦 Ingresa a tu banca online o ve a una agencia',
                            '💰 Realiza la transferencia por el monto: <strong>S/ {amount}</strong>',
                            '📄 Guarda el voucher de la operación',
                            '📤 Sube la imagen del voucher en el formulario',
                            '⏰ El pago será verificado en 24-48 horas'
                        ],
                        'note' => 'Importante: El voucher debe mostrar claramente la fecha, hora, monto y número de operación.'
                    ]
                ],
                'efectivo' => [
                    'type' => 'manual',
                    'config' => [
                        'contact_person' => [
                            'type' => 'text',
                            'label' => 'Persona de Contacto',
                            'required' => true,
                            'placeholder' => 'Juan Pérez'
                        ],
                        'contact_phone' => [
                            'type' => 'tel',
                            'label' => 'Teléfono de Contacto',
                            'required' => true,
                            'placeholder' => '+51 999 888 777'
                        ],
                        'pickup_address' => [
                            'type' => 'textarea',
                            'label' => 'Dirección de Recojo',
                            'required' => true,
                            'placeholder' => 'Av. Principal 123, Lima, Perú'
                        ],
                        'pickup_hours' => [
                            'type' => 'text',
                            'label' => 'Horarios de Atención',
                            'placeholder' => 'Lunes a Viernes de 9am a 6pm'
                        ],
                        'reference' => [
                            'type' => 'text',
                            'label' => 'Referencia',
                            'placeholder' => 'Frente al parque central'
                        ]
                    ],
                    'instructions' => [
                        'title' => 'Pago en Efectivo',
                        'contact_info' => [
                            'Persona de Contacto: <strong>{contact_person}</strong>',
                            'Teléfono: <strong>{contact_phone}</strong>',
                            'Dirección: <strong>{pickup_address}</strong>',
                            'Horarios: <strong>{pickup_hours}</strong>',
                            'Referencia: <strong>{reference}</strong>'
                        ],
                        'steps' => [
                            '📞 Llama al número: <strong>{contact_phone}</strong>',
                            '📅 Coordina fecha y hora de encuentro',
                            '📍 Dirígete a: <strong>{pickup_address}</strong>',
                            '💰 Entrega el monto exacto: <strong>S/ {amount}</strong>',
                            '🧾 Solicita tu recibo de pago'
                        ],
                        'note' => 'Coordina previamente para asegurar disponibilidad.'
                    ]
                ],
                'agente_bancario' => [
                    'type' => 'manual',
                    'config' => [
                        'bank_name' => [
                            'type' => 'select',
                            'label' => 'Red de Agentes',
                            'required' => true,
                            'options' => [
                                'BCP' => 'Agente BCP',
                                'BBVA' => 'Agente BBVA',
                                'Interbank' => 'Agente Interbank',
                                'Scotiabank' => 'Agente Scotiabank',
                                'kasnet' => 'Kasnet',
                                'tambo' => 'Tambo+',
                                'western_union' => 'Western Union'
                            ]
                        ],
                        'account_number' => [
                            'type' => 'text',
                            'label' => 'Número de Cuenta',
                            'required' => true,
                            'placeholder' => '123-456789-0-12'
                        ],
                        'account_holder' => [
                            'type' => 'text',
                            'label' => 'Titular de la Cuenta',
                            'required' => true,
                            'placeholder' => 'BananaLab SAC'
                        ],
                        'document_number' => [
                            'type' => 'text',
                            'label' => 'DNI/RUC del Titular',
                            'required' => true,
                            'placeholder' => '20123456789'
                        ]
                    ],
                    'instructions' => [
                        'title' => 'Pago por Agente Bancario',
                        'account_info' => [
                            'Red: <strong>{bank_name}</strong>',
                            'Cuenta: <strong>{account_number}</strong>',
                            'Titular: <strong>{account_holder}</strong>',
                            'DNI/RUC: <strong>{document_number}</strong>'
                        ],
                        'steps' => [
                            '🏪 Busca el agente {bank_name} más cercano',
                            '💰 Deposita el monto: <strong>S/ {amount}</strong>',
                            '👤 A nombre de: <strong>{account_holder}</strong>',
                            '🆔 DNI/RUC: <strong>{document_number}</strong>',
                            '📱 Cuenta: <strong>{account_number}</strong>',
                            '🧾 Conserva tu voucher de depósito',
                            '📤 Sube la foto del voucher'
                        ],
                        'note' => 'El depósito se procesará en tiempo real.'
                    ]
                ]
            ]
        ]);
    }

    /**
     * Cambiar estado activo/inactivo
     */
    public function toggleStatus($id)
    {
        try {
            $method = PaymentMethod::findOrFail($id);
            $method->update(['is_active' => !$method->is_active]);

            return response()->json([
                'status' => true,
                'message' => 'Estado actualizado exitosamente',
                'is_active' => $method->is_active
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error actualizando estado'
            ], 500);
        }
    }

    /**
     * Reordenar métodos
     */
    public function reorder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'methods' => 'required|array',
            'methods.*.id' => 'required|exists:payment_methods,id',
            'methods.*.sort_order' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            foreach ($request->methods as $methodData) {
                PaymentMethod::where('id', $methodData['id'])
                    ->update(['sort_order' => $methodData['sort_order']]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Orden actualizado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error actualizando orden'
            ], 500);
        }
    }

    /**
     * Obtener métodos activos para el frontend
     */
    public function getActiveForFrontend()
    {
        try {
            $methods = PaymentMethod::active()->ordered()->get();

            $formattedMethods = $methods->map(function ($method) {
                return [
                    'id' => $method->id,
                    'slug' => $method->slug,
                    'name' => $method->display_name,
                    'description' => $method->description,
                    'type' => $method->type,
                    'icon' => $method->getIconUrl(),
                    'requires_proof' => $method->requires_proof,
                    'fee_percentage' => $method->fee_percentage,
                    'fee_fixed' => $method->fee_fixed,
                    'configuration' => $this->getPublicConfig($method),
                    'instructions' => $method->instructions
                ];
            });

            return response()->json([
                'status' => true,
                'methods' => $formattedMethods
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error obteniendo métodos de pago'
            ], 500);
        }
    }

    /**
     * Obtener configuración pública (sin claves privadas)
     */    private function getPublicConfig($method)
    {
        $config = $method->configuration ?? [];
        
        // Ensure configuration is an array (might be stored as JSON string)
        if (is_string($config)) {
            $config = json_decode($config, true) ?? [];
        }
        
        $publicConfig = [];

        // Solo incluir datos públicos según el tipo
        switch ($method->type) {
            case 'gateway':
                if ($method->slug === 'culqi') {
                    $publicConfig['public_key'] = $config['public_key'] ?? '';
                    $publicConfig['currency'] = $config['currency'] ?? 'PEN';
                }
                break;

            case 'qr':
            case 'manual':
                // Incluir toda la configuración excepto claves sensibles
                $publicConfig = array_filter($config, function ($key) {
                    return !in_array($key, ['secret_key', 'access_token', 'private_key']);
                }, ARRAY_FILTER_USE_KEY);
                break;
        }

        return $publicConfig;
    }

    /**
     * Eliminar método de pago
     */
    public function destroy($id)
    {
        try {
            $method = PaymentMethod::findOrFail($id);

            // Eliminar icono si existe
            if ($method->icon) {
                Storage::disk('public')->delete('payment_icons/' . $method->icon);
            }

            $method->delete();

            return response()->json([
                'status' => true,
                'message' => 'Método de pago eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error eliminando método de pago: ' . $e->getMessage()
            ], 500);
        }
    }
}
