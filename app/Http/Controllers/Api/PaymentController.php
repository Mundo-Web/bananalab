<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Models\Sale;
use App\Models\SaleDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Obtener métodos de pago activos
     */
    public function getPaymentMethods()
    {
        try {
            $methods = PaymentMethod::active()->ordered()->get();
            
            return response()->json([
                'status' => true,
                'message' => 'Métodos de pago obtenidos exitosamente',
                'methods' => $methods->map(function ($method) {
                    return [
                        'id' => $method->id,
                        'name' => $method->name,
                        'slug' => $method->slug,
                        'display_name' => $method->display_name,
                        'description' => $method->description,
                        'icon_url' => $method->getIconUrl(),
                        'type' => $method->type,
                        'requires_proof' => $method->requires_proof,
                        'fee_percentage' => $method->fee_percentage,
                        'fee_fixed' => $method->fee_fixed,
                        'configuration' => $method->type === 'gateway' ? 
                            collect($method->configuration)->only(['public_key', 'sandbox'])->toArray() : 
                            $method->configuration,
                        'instructions' => $method->instructions,
                        'template_key' => $method->template_key,
                        'sort_order' => $method->sort_order
                    ];
                })
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al cargar métodos de pago',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**    /**
     * Procesar pago unificado
     */
    public function processPayment(Request $request)
    {
        try {
            // Convertir cart de JSON string a array si es necesario
            if ($request->has('cart') && is_string($request->cart)) {
                $cartData = json_decode($request->cart, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $request->merge(['cart' => $cartData]);
                }
            }

            // Validar datos básicos
            $request->validate([
                'payment_method' => 'required|string|exists:payment_methods,slug',
                'amount' => 'required|numeric|min:0.01',
                'cart' => 'required|array|min:1',
                'name' => 'required|string|max:255',
                'lastname' => 'required|string|max:255',
                'email' => 'required|email',
                'phone' => 'nullable|string',
                'department' => 'required|string',
                'province' => 'required|string',
                'district' => 'required|string',
                'address' => 'required|string',
                'reference' => 'nullable|string'
            ]);

            // Obtener método de pago
            $paymentMethod = PaymentMethod::where('slug', $request->payment_method)
                ->where('is_active', true)
                ->first();

            if (!$paymentMethod) {
                return response()->json([
                    'status' => false,
                    'message' => 'Método de pago no válido o inactivo'
                ], 400);
            }

            // Calcular comisiones
            $subtotal = $request->amount;
            $fee = $paymentMethod->calculateFee($subtotal);
            $total = $subtotal + $fee;

            // Validar archivo de comprobante si es requerido
            $proofPath = null;
            if ($paymentMethod->requires_proof) {
                if (!$request->hasFile('payment_proof')) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Este método de pago requiere subir comprobante'
                    ], 400);
                }

                $proofPath = $this->storePaymentProof($request->file('payment_proof'));
            }

            DB::beginTransaction();
            
            try {
                // Generar código de seguimiento único
                $trackingCode = 'BL-' . time() . '-' . strtoupper(Str::random(6));
                
                // Crear la venta
                $sale = Sale::create([
                    'code' => $trackingCode,
                    'user_id' => $request->user_id ?? Auth::id(),
                    'name' => $request->name,
                    'lastname' => $request->lastname,
                    'fullname' => trim($request->name . ' ' . $request->lastname),
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'country' => 'Perú',
                    'department' => $request->department,
                    'province' => $request->province,
                    'district' => $request->district,
                    'address' => $request->address,
                    'reference' => $request->reference,
                    'comment' => $request->comment ?? null,
                    'amount' => $total,
                    'delivery' => $request->delivery ?? 0,
                    'payment_method' => $paymentMethod->slug,
                    'payment_method_id' => $paymentMethod->id,
                    'payment_fee' => $fee,
                    'payment_proof_path' => $proofPath,
                    'invoiceType' => $request->invoiceType ?? 'boleta',
                    'documentType' => $request->documentType ?? 'dni',
                    'document' => $request->document ?? null,
                    'businessName' => $request->businessName ?? null,
                ]);                // Crear detalles de la venta (items del carrito)
                foreach ($request->cart as $item) {
                    $saleDetailData = [
                        'sale_id' => $sale->id,
                        'name' => $item['name'] ?? 'Item',
                        'quantity' => $item['quantity'] ?? 1,
                        'price' => $item['price'] ?? 0,
                        'colors' => json_encode($item), // Almacenar datos completos aquí
                    ];
                    
                    // Manejar según el tipo de producto
                    if (isset($item['type']) && $item['type'] === 'custom_album') {
                        // ÁLBUM PERSONALIZADO
                        $albumData = $item['album_data'] ?? [];
                        $presetData = $item['preset_data'] ?? [];
                        
                        $saleDetailData['item_id'] = $albumData['album_id'] ?? null; // ID del álbum base
                        $saleDetailData['album_id'] = $albumData['album_id'] ?? null;
                        $saleDetailData['preset_id'] = $presetData['id'] ?? null;
                        $saleDetailData['album_data'] = $albumData;
                        $saleDetailData['preset_data'] = $presetData;
                        
                        if (isset($item['pdf_path'])) {
                            $saleDetailData['pdf_path'] = $item['pdf_path'];
                        }
                        
                        $designNotes = [
                            'pages_count' => $albumData['pages_count'] ?? 0,
                            'selected_pages' => $albumData['selected_pages'] ?? 0,
                            'cover_type' => $albumData['selected_cover_type'] ?? 'dura',
                            'finish' => $albumData['selected_finish'] ?? 'mate',
                            'created_at' => $albumData['created_at'] ?? now()->toISOString(),
                        ];
                        $saleDetailData['design_notes'] = json_encode($designNotes);
                        
                    } else {
                        // PRODUCTO NORMAL
                        $saleDetailData['item_id'] = $item['id'] ?? null;
                    }
                    
                    \App\Models\SaleDetail::create($saleDetailData);
                }

                DB::commit();

                // Preparar respuesta según el tipo de método de pago
                $response = [
                    'status' => true,
                    'message' => $this->getSuccessMessage($paymentMethod),
                    'sale' => $sale,
                    'code' => $trackingCode,
                    'payment_method' => $paymentMethod->only(['name', 'type', 'slug'])
                ];

                // Para gateways, agregar datos específicos del pago
                if ($paymentMethod->type === 'gateway') {
                    $response['payment_data'] = $this->prepareGatewayPaymentData($paymentMethod, $sale);
                }

                return response()->json($response);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error procesando el pago',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener configuración de MercadoPago
     */
    public function getMercadoPagoConfig()
    {
        try {
            $method = PaymentMethod::where('slug', 'mercadopago')
                ->where('is_active', true)
                ->first();

            if (!$method) {
                return response()->json([
                    'status' => false,
                    'message' => 'MercadoPago no está disponible'
                ], 404);
            }

            return response()->json([
                'status' => true,
                'config' => [
                    'public_key' => $method->getConfig('public_key'),
                    'sandbox' => $method->getConfig('sandbox', false)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error obteniendo configuración de MercadoPago',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Webhook de MercadoPago
     */
    public function mercadoPagoWebhook(Request $request)
    {
        try {
            $type = $request->input('type');
            $data = $request->input('data');

            if ($type === 'payment') {
                $paymentId = $data['id'] ?? null;
                
                if ($paymentId) {
                    // Aquí procesarías la actualización del pago con la API de MercadoPago
                    // Por ahora solo registramos el webhook
                    \Log::info('MercadoPago Webhook received', [
                        'type' => $type,
                        'payment_id' => $paymentId,
                        'data' => $data
                    ]);
                }
            }

            return response()->json(['status' => 'ok']);
        } catch (\Exception $e) {
            \Log::error('MercadoPago Webhook error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);
            
            return response()->json(['error' => 'Internal error'], 500);
        }
    }

    /**
     * Almacenar comprobante de pago
     */
    private function storePaymentProof($file)
    {
        $extension = $file->getClientOriginalExtension();
        $filename = 'proof_' . time() . '_' . Str::random(8) . '.' . $extension;
        $path = $file->storeAs('payment_proofs', $filename, 'public');
        
        return $path;
    }

    /**
     * Obtener mensaje de éxito según el método de pago
     */
    private function getSuccessMessage(PaymentMethod $method)
    {
        switch ($method->type) {
            case 'gateway':
                return 'Pedido creado. Procede con el pago en ' . $method->name;
            case 'qr':
            case 'manual':
                return 'Pedido creado exitosamente. Verifica tu pago siguiendo las instrucciones.';
            default:
                return 'Pedido creado exitosamente.';
        }
    }

    /**
     * Preparar datos específicos para gateways de pago
     */
    private function prepareGatewayPaymentData(PaymentMethod $method, Sale $sale)
    {
        switch ($method->slug) {            case 'mercadopago':
                return [
                    'preference_data' => [
                        'external_reference' => $sale->code,
                        'back_urls' => [
                            'success' => $method->getConfig('success_url'),
                            'failure' => $method->getConfig('failure_url'),
                            'pending' => $method->getConfig('pending_url')
                        ],
                        'auto_return' => 'approved'
                    ]
                ];
            case 'culqi':
                return [
                    'public_key' => $method->getConfig('public_key'),
                    'amount' => $sale->total * 100, // Culqi usa centavos
                    'currency' => 'PEN'
                ];
            default:
                return [];
        }
    }

    /**
     * Procesar pago directo con MercadoPago (API)
     */
    public function mercadoPagoCheckoutApi(Request $request)
    {
        try {
            Log::info('MercadoPago Checkout API Request:', $request->all());
            
            // Validar datos del request (temporalmente más permisivo para debug)
            $validated = $request->validate([
                'token' => 'required|string',
                'payment_method_id' => 'required|string',
                'issuer_id' => 'nullable|string',
                'installments' => 'required|integer|min:1',
                'identification_type' => 'required|string',
                'identification_number' => 'required|string',
                'amount' => 'required|numeric|min:0.01',
                'cart' => 'required|array|min:1',
                'name' => 'required|string|max:255',
                'lastname' => 'required|string|max:255',
                'email' => 'required|email',
                'phone' => 'nullable|string',
                'department' => 'required|string',
                'province' => 'required|string',
                'district' => 'required|string',
                'address' => 'required|string',
                'reference' => 'nullable|string',
                // Campos adicionales opcionales
                'user_id' => 'nullable|integer',
                'fullname' => 'nullable|string',
                'country' => 'nullable|string',
                'ubigeo' => 'nullable',
                'number' => 'nullable|string',
                'comment' => 'nullable|string',
                'delivery' => 'nullable',
                'payment_method' => 'nullable|string',
                'card_type' => 'nullable|string',
                'card_last_four' => 'nullable|string',
                'card_holder_name' => 'nullable|string',
                'album_data' => 'nullable',
                'preset_data' => 'nullable',
                'invoiceType' => 'nullable|string',
                'documentType' => 'nullable|string',
                'document' => 'nullable|string',
                'businessName' => 'nullable|string'
            ]);

            Log::info('✅ Validation passed with validated data:', array_keys($validated));

            // Obtener método de pago MercadoPago
            $paymentMethod = PaymentMethod::where('slug', 'mercadopago')
                ->where('is_active', true)
                ->first();

            if (!$paymentMethod) {
                Log::error('❌ MercadoPago payment method not found or inactive');
                return response()->json([
                    'status' => false,
                    'message' => 'MercadoPago no está disponible'
                ], 400);
            }

            Log::info('✅ Payment method found:', ['id' => $paymentMethod->id]);

            // Verificar configuración de MercadoPago
            $accessToken = $paymentMethod->getConfig('access_token');
            if (!$accessToken) {
                Log::error('❌ MercadoPago access token not configured');
                return response()->json([
                    'status' => false,
                    'message' => 'MercadoPago no está configurado correctamente'
                ], 400);
            }

            Log::info('✅ Access token found:', ['token' => substr($accessToken, 0, 20) . '...']);            // Calcular totales
            $subtotal = $request->amount;
            $commission = $paymentMethod->calculateFee($subtotal);
            $total = $subtotal + $commission;Log::info('Calculated amounts:', [
                'subtotal' => $subtotal,
                'commission' => $commission,
                'total' => $total
            ]);            // Crear venta en la base de datos
            $sale = new Sale();
            $sale->code = 'BL-' . strtoupper(Str::random(8));
            $sale->payment_status = 'pendiente';
            $sale->payment_method_id = $paymentMethod->id;
            $sale->payment_method = 'mercadopago';
            $sale->amount = $subtotal;
            $sale->payment_fee = $commission;
            $sale->name = $request->name;
            $sale->lastname = $request->lastname;
            $sale->fullname = trim($request->name . ' ' . $request->lastname);
            $sale->email = $request->email;
            $sale->phone = $request->phone;
            $sale->department = $request->department;
            $sale->province = $request->province;
            $sale->district = $request->district;
            $sale->address = $request->address;
            $sale->reference = $request->reference;
            $sale->country = 'Perú';
            $sale->delivery = 0;
            $sale->save();            // Crear detalles de la venta
            foreach ($request->cart as $item) {
                $saleDetail = new SaleDetail();
                $saleDetail->sale_id = $sale->id;
                
                // Datos básicos del producto
                $saleDetail->name = $item['name'];
                $saleDetail->quantity = $item['quantity'];
                $saleDetail->price = $item['price'];
                
                // Manejar según el tipo de producto
                if (isset($item['type']) && $item['type'] === 'custom_album') {
                    // ÁLBUM PERSONALIZADO
                    $albumData = $item['album_data'] ?? [];
                    $presetData = $item['preset_data'] ?? [];
                    
                    // Asignar IDs específicos del álbum
                    $saleDetail->item_id = $albumData['album_id'] ?? null; // ID del álbum base
                    $saleDetail->album_id = $albumData['album_id'] ?? null;
                    $saleDetail->preset_id = $presetData['id'] ?? null;
                    
                    // Guardar datos completos del álbum diseñado
                    $saleDetail->album_data = $albumData;
                    $saleDetail->preset_data = $presetData;
                    
                    // Si hay un PDF generado, guardarlo
                    if (isset($item['pdf_path'])) {
                        $saleDetail->pdf_path = $item['pdf_path'];
                    }
                    
                    // Agregar notas del diseño
                    $designNotes = [
                        'pages_count' => $albumData['pages_count'] ?? 0,
                        'selected_pages' => $albumData['selected_pages'] ?? 0,
                        'cover_type' => $albumData['selected_cover_type'] ?? 'dura',
                        'finish' => $albumData['selected_finish'] ?? 'mate',
                        'created_at' => $albumData['created_at'] ?? now()->toISOString(),
                    ];
                    $saleDetail->design_notes = json_encode($designNotes);
                    
                    Log::info('💎 Álbum personalizado guardado:', [
                        'album_id' => $saleDetail->album_id,
                        'preset_id' => $saleDetail->preset_id,
                        'pages' => $albumData['pages_count'] ?? 0,
                        'pdf_path' => $saleDetail->pdf_path
                    ]);
                    
                } else {
                    // PRODUCTO NORMAL
                    $saleDetail->item_id = $item['id'] ?? null;
                }
                
                // Almacenar datos completos del item en colors para compatibilidad
                $saleDetail->colors = json_encode($item);
                $saleDetail->save();
            }Log::info('Sale created with ID: ' . $sale->id);

            // Configurar MercadoPago SDK
            Log::info('🔧 Configurando MercadoPago SDK...');
            \MercadoPago\SDK::setAccessToken($accessToken);            Log::info('✅ SDK configurado correctamente');

            // Crear pago con MercadoPago
            Log::info('💳 Creando objeto Payment de MercadoPago...');
            $payment = new \MercadoPago\Payment();
            $payment->transaction_amount = $total;
            $payment->token = $request->token;
            $payment->description = "Compra en BananaLab - Pedido #{$sale->code}";
            $payment->installments = $request->installments;
            $payment->payment_method_id = $request->payment_method_id;
            
            // Solo asignar issuer_id si no es null
            if ($request->issuer_id) {
                $payment->issuer_id = $request->issuer_id;
                Log::info('Issuer ID asignado:', ['issuer_id' => $request->issuer_id]);
            } else {
                Log::info('Issuer ID es null, omitiendo asignación');
            }
            
            $payment->external_reference = $sale->code;

            // Datos del pagador
            Log::info('👤 Configurando datos del pagador...');
            $payer = new \MercadoPago\Payer();
            $payer->first_name = $request->name;
            $payer->last_name = $request->lastname;
            $payer->email = $request->email;
            $payer->phone = (object)[
                'area_code' => '51',
                'number' => $request->phone ?? ''
            ];
            
            $payer->identification = (object)[
                'type' => $request->identification_type,
                'number' => $request->identification_number
            ];

            $payment->payer = $payer;

            Log::info('💰 Procesando pago con MercadoPago...', [
                'amount' => $total,
                'token' => substr($request->token, 0, 10) . '...',
                'payment_method_id' => $request->payment_method_id
            ]);

            // Procesar el pago
            $payment->save();Log::info('MercadoPago payment response:', [
                'id' => $payment->id,
                'status' => $payment->status,
                'status_detail' => $payment->status_detail
            ]);            // Actualizar el estado de la venta según la respuesta de MercadoPago
            $sale->culqi_charge_id = $payment->id; // Reutilizamos este campo para el payment_id de MercadoPago
            $sale->payment_status = $this->mapMercadoPagoStatus($payment->status);
            $sale->admin_notes = json_encode([
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'status_detail' => $payment->status_detail,
                'payment_method_id' => $payment->payment_method_id,
                'payment_type_id' => $payment->payment_type_id,
                'payment_data' => [
                    'token' => $request->token,
                    'payment_method_id' => $request->payment_method_id,
                    'issuer_id' => $request->issuer_id,
                    'installments' => $request->installments,
                    'identification_type' => $request->identification_type,
                    'identification_number' => $request->identification_number
                ]
            ]);

            if ($payment->status === 'approved') {
                $sale->verified_at = now();
            }

            $sale->save();

            // Respuesta exitosa
            return response()->json([
                'status' => true,
                'message' => $this->getMercadoPagoMessage($payment->status),                'data' => [
                    'sale_id' => $sale->id,
                    'tracking_code' => $sale->code,
                    'payment_id' => $payment->id,
                    'payment_status' => $payment->status,
                    'payment_status_detail' => $payment->status_detail,
                    'amount' => $total,
                    'approved' => $payment->status === 'approved'
                ]
            ]);

        } catch (\MercadoPago\MercadoPagoException $e) {            Log::error('MercadoPago API Error:', [
                'message' => $e->getMessage(),
                'code' => $e->getCode()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error en el procesamiento del pago: ' . $e->getMessage()
            ], 400);        } catch (\Exception $e) {
            Log::error('General error in MercadoPago checkout:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Error interno del servidor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear preferencia de MercadoPago
     */
    public function createMercadoPagoPreference(Request $request)
    {
        try {
            Log::info('Creating MercadoPago preference:', $request->all());

            $request->validate([
                'preference_data' => 'required|array',
                'order_code' => 'required|string'
            ]);

            // Obtener método de pago MercadoPago
            $paymentMethod = PaymentMethod::where('slug', 'mercadopago')
                ->where('is_active', true)
                ->first();

            if (!$paymentMethod) {
                return response()->json([
                    'status' => false,
                    'message' => 'MercadoPago no está disponible'
                ], 400);
            }

            // Configurar MercadoPago SDK
            \MercadoPago\SDK::setAccessToken($paymentMethod->getConfig('access_token'));

            // Crear preferencia
            $preference = new \MercadoPago\Preference();
            
            // Datos básicos
            $preference->external_reference = $request->order_code;
            $preference->statement_descriptor = "BANANALAB";
            
            // Items
            if (isset($request->preference_data['items'])) {
                foreach ($request->preference_data['items'] as $itemData) {
                    $item = new \MercadoPago\Item();
                    $item->title = $itemData['title'];
                    $item->description = $itemData['description'] ?? '';
                    $item->quantity = $itemData['quantity'];
                    $item->unit_price = $itemData['unit_price'];
                    $item->currency_id = $itemData['currency_id'] ?? 'PEN';
                    
                    $preference->items = [$item];
                }
            }

            // URLs de retorno
            if (isset($request->preference_data['back_urls'])) {
                $backUrls = new \MercadoPago\BackUrls();
                $backUrls->success = $request->preference_data['back_urls']['success'] ?? '';
                $backUrls->failure = $request->preference_data['back_urls']['failure'] ?? '';
                $backUrls->pending = $request->preference_data['back_urls']['pending'] ?? '';
                $preference->back_urls = $backUrls;
            }

            // Auto return
            if (isset($request->preference_data['auto_return'])) {
                $preference->auto_return = $request->preference_data['auto_return'];
            }

            // Notification URL
            if (isset($request->preference_data['notification_url'])) {
                $preference->notification_url = $request->preference_data['notification_url'];
            }

            // Datos del pagador
            if (isset($request->preference_data['payer'])) {
                $payer = new \MercadoPago\Payer();
                $payer->name = $request->preference_data['payer']['name'] ?? '';
                $payer->surname = $request->preference_data['payer']['surname'] ?? '';
                $payer->email = $request->preference_data['payer']['email'] ?? '';
                
                if (isset($request->preference_data['payer']['phone'])) {
                    $phone = new \MercadoPago\Phone();
                    $phone->area_code = $request->preference_data['payer']['phone']['area_code'] ?? '';
                    $phone->number = $request->preference_data['payer']['phone']['number'] ?? '';
                    $payer->phone = $phone;
                }
                
                $preference->payer = $payer;
            }

            // Métodos de pago
            if (isset($request->preference_data['payment_methods'])) {
                $paymentMethods = new \MercadoPago\PaymentMethods();
                
                if (isset($request->preference_data['payment_methods']['installments'])) {
                    $paymentMethods->installments = $request->preference_data['payment_methods']['installments'];
                }
                
                if (isset($request->preference_data['payment_methods']['default_installments'])) {
                    $paymentMethods->default_installments = $request->preference_data['payment_methods']['default_installments'];
                }
                
                $preference->payment_methods = $paymentMethods;
            }

            // Guardar preferencia
            $preference->save();

            Log::info('MercadoPago preference created:', [
                'id' => $preference->id,
                'init_point' => $preference->init_point
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Preferencia creada exitosamente',
                'preference_id' => $preference->id,
                'init_point' => $preference->init_point,
                'sandbox_init_point' => $preference->sandbox_init_point
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating MercadoPago preference:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error creando preferencia de pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener mensaje según estado de pago de MercadoPago
     */
    private function getMercadoPagoMessage($status)
    {
        switch ($status) {
            case 'approved':
                return '¡Pago aprobado exitosamente!';
            case 'pending':
                return 'Pago pendiente de confirmación';
            case 'in_process':
                return 'Pago en proceso de verificación';
            case 'rejected':
                return 'Pago rechazado. Por favor, verifica los datos de tu tarjeta';
            default:
                return 'Estado de pago: ' . $status;
        }
    }

    /**
     * Mapear estado de MercadoPago al enum de la base de datos
     */
    private function mapMercadoPagoStatus($status)
    {
        switch ($status) {
            case 'approved':
                return 'pagado';
            case 'rejected':
            case 'cancelled':
                return 'fallido';
            case 'pending':
            case 'in_process':
            default:
                return 'pendiente';
        }
    }
}
