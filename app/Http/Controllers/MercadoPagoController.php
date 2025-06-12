<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\SaleStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Exceptions\MPApiException;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Resources\Preference\Item as MPItem;
use MercadoPago\Client\Payment\PaymentClient;

class MercadoPagoController extends Controller
{
    /**
     * Helper para obtener configuración de MercadoPago
     */
    private function getMercadoPagoConfig()
    {
        $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')
            ->where('is_active', true)
            ->first();

        if (!$paymentMethod) {
            return null;
        }

        // Verificar si configuration ya es un array o string JSON
        $config = $paymentMethod->configuration;
        if (is_string($config)) {
            $config = json_decode($config, true);
        }

        return $config;
    }

    public function createPreference(Request $request)
    {
        try {
            // Log para depuración
            Log::info('CreatePreference Request Data:', $request->all());

            // Obtener configuración de MercadoPago desde la base de datos
            $config = $this->getMercadoPagoConfig();

            if (!$config) {
                return response()->json([
                    'message' => 'MercadoPago no está disponible',
                    'status' => false,
                ], 400);
            }

            // Configurar SDK de MercadoPago con datos de la DB
            MercadoPagoConfig::setAccessToken($config['access_token']);

            // Generar número de orden
            $orderNumber = $this->generateOrderNumber();

            // Extraer datos del cliente - priorizar checkout_data si existe
            $checkoutData = $request->checkout_data ?? [];
            $customer = $request->customer ?? [];
            
            $customerName = $checkoutData['name'] ?? $customer['name'] ?? $request->name ?? 'Cliente';
            $customerLastname = $checkoutData['lastname'] ?? $customer['lastname'] ?? $request->lastname ?? '';
            $customerEmail = $checkoutData['email'] ?? $customer['email'] ?? $request->email ?? 'test@example.com';
            $customerPhone = $checkoutData['phone'] ?? $customer['phone'] ?? $request->phone ?? '';

            // Crear registro de venta con estado "pendiente" ANTES de crear la preferencia
            $saleStatusPendiente = SaleStatus::getByName('Pendiente');

            $sale = Sale::create([
                'code' => $orderNumber,
                'user_id' => $checkoutData['user_id'] ?? $request->user_id ?? null,
                'name' => $customerName,
                'lastname' => $customerLastname,
                'fullname' => $customerName . ' ' . $customerLastname,
                'email' => $customerEmail,
                'phone' => $customerPhone,
                'country' => $checkoutData['country'] ?? $request->country ?? 'PE',
                'department' => $checkoutData['department'] ?? $request->department ?? '',
                'province' => $checkoutData['province'] ?? $request->province ?? '',
                'district' => $checkoutData['district'] ?? $request->district ?? '',
                'ubigeo' => $checkoutData['ubigeo'] ?? $request->ubigeo ?? '',
                'address' => $checkoutData['address'] ?? $request->address ?? '',
                'number' => $checkoutData['number'] ?? $request->number ?? '',
                'reference' => $checkoutData['reference'] ?? $request->reference ?? '',
                'comment' => $checkoutData['comment'] ?? $request->comment ?? '',
                'amount' => $request->amount ?? 0,
                'delivery' => $checkoutData['delivery'] ?? $request->delivery ?? 0,
                'payment_status' => 'pendiente',
                'status_id' => $saleStatusPendiente ? $saleStatusPendiente->id : null,
                'invoiceType' => $checkoutData['invoiceType'] ?? $request->invoiceType ?? '',
                'documentType' => $checkoutData['documentType'] ?? $request->documentType ?? '',
                'document' => $checkoutData['document'] ?? $request->document ?? '',
                'businessName' => $checkoutData['businessName'] ?? $request->businessName ?? '',
            ]);

             // Registrar detalles de la venta (sin afectar stock aún)
            $cart = $checkoutData['cart'] ?? $request->cart ?? $request->items ?? [];
            
            Log::info('Cart data:', ['cart' => $cart]);
            
            foreach ($cart as $item) {
                $itemId = is_array($item) ? $item['id'] ?? null : $item->id ?? null;
                $itemName = is_array($item) ? ($item['name'] ?? $item['title'] ?? null) : ($item->name ?? $item->title ?? null);
                $itemPrice = is_array($item) ? ($item['final_price'] ?? $item['unit_price'] ?? null) : ($item->final_price ?? $item->unit_price ?? null);
                $itemQuantity = is_array($item) ? $item['quantity'] ?? null : $item->quantity ?? null;

                if ($itemName && $itemPrice && $itemQuantity && $itemId) {
                    // Solo crear el detalle si tenemos un item_id válido
                    try {
                        SaleDetail::create([
                            'sale_id' => $sale->id,
                            'item_id' => $itemId,
                            'name' => $itemName,
                            'price' => $itemPrice,
                            'quantity' => $itemQuantity,
                        ]);
                    } catch (\Exception $e) {
                        // Si falla crear el detalle (ej: item_id no existe), continuar
                        \Illuminate\Support\Facades\Log::warning('No se pudo crear detalle de venta: ' . $e->getMessage());
                    }
                }
            }

            // Configurar items para MercadoPago
            $items = [];

            foreach ($cart as $cartItem) {
                $itemTitle = is_array($cartItem) ? ($cartItem['name'] ?? $cartItem['title'] ?? null) : ($cartItem->name ?? $cartItem->title ?? null);
                $itemPrice = is_array($cartItem) ? ($cartItem['final_price'] ?? $cartItem['unit_price'] ?? null) : ($cartItem->final_price ?? $cartItem->unit_price ?? null);
                $itemQuantity = is_array($cartItem) ? ($cartItem['quantity'] ?? null) : ($cartItem->quantity ?? null);
                $itemId = is_array($cartItem) ? ($cartItem['id'] ?? null) : ($cartItem->id ?? null);

                if ($itemTitle && $itemPrice && $itemQuantity) {
                    $items[] = [
                        'id' => $itemId ? (string) $itemId : 'item',
                        'title' => $itemTitle,
                        'quantity' => (int) $itemQuantity,
                        'unit_price' => round((float) $itemPrice, 2),
                        'currency_id' => 'PEN',
                    ];
                }
            }

            // Si no hay items del carrito, crear un item por defecto basado en el monto y título
            if (empty($items)) {
                $title = $request->title ?? 'Pago BananaLab';
                $description = $request->description ?? '';
                
                $items[] = [
                    'id' => 'default',
                    'title' => $title,
                    'description' => $description,
                    'quantity' => 1,
                    'unit_price' => round((float) $request->amount, 2),
                    'currency_id' => 'PEN',
                ];
            }

            // Agregar envío si existe
            $deliveryAmount = $checkoutData['delivery'] ?? $request->delivery ?? 0;
            if ($deliveryAmount > 0) {
                $items[] = [
                    'id' => 'delivery',
                    'title' => 'Costo de envío',
                    'quantity' => 1,
                    'unit_price' => round(max((float) $deliveryAmount, 0.1), 2),
                    'currency_id' => 'PEN',
                ];
            }

            // Use proper URLs - usar webhook real en sandbox también para recibir notificaciones
            $appUrl = config('app.url', 'http://localhost:8000');
            $webhookUrl = $appUrl . '/api/mercadopago/webhook';

            // En sandbox, forzar el email del comprador de prueba para evitar errores E216
            $payerEmail = $customerEmail;
            if ($config['sandbox'] ?? true) {
                $payerEmail = 'TESTUSER906372783@testuser.com';
                Log::info('MercadoPago Sandbox: Usando email de comprador de prueba', ['email' => $payerEmail]);
            } elseif ($config['force_test_email'] ?? false) {
                // Modo especial: producción pero con email de prueba forzado
                $payerEmail = 'TESTUSER906372783@testuser.com';
                Log::info('MercadoPago Producción con email de prueba forzado', ['email' => $payerEmail]);
            }

            // Configurar preferencia - versión simplificada que funciona en sandbox
            $preferenceData = [
                'items' => $items,
                'payer' => [
                    'name' => $customerName,
                    'surname' => $customerLastname,
                    'email' => $payerEmail,
                ],
                'back_urls' => [
                    'success' => $appUrl . '/checkout/success?external_reference=' . $orderNumber . '&payment_type=mercadopago',
                    'failure' => $appUrl . '/checkout/failure?external_reference=' . $orderNumber . '&payment_type=mercadopago',
                    'pending' => $appUrl . '/checkout/pending?external_reference=' . $orderNumber . '&payment_type=mercadopago',
                ],
                'external_reference' => $orderNumber,
                'notification_url' => $webhookUrl,
            ];

            // Crear preferencia
            $client = new PreferenceClient();

            // Guardar la preferencia
            try {
                $preference = $client->create($preferenceData);
            } catch (\MercadoPago\Exceptions\MPApiException $e) {
                // Log detallado del error de MercadoPago
                Log::error('Error MPApiException: ' . $e->getMessage());
                Log::error('Datos enviados: ' . json_encode($preferenceData, JSON_PRETTY_PRINT));
                Log::error('Response body: ' . ($e->getApiResponse() ? json_encode($e->getApiResponse()->getContent(), JSON_PRETTY_PRINT) : 'No response'));
                
                return response()->json([
                    'status' => false,
                    'message' => 'Error de MercadoPago: ' . $e->getMessage(),
                    'details' => $e->getApiResponse() ? $e->getApiResponse()->getContent() : []
                ], 400);
            } catch (\Exception $e) {
                // Log detallado del error de MercadoPago
                Log::error('Error en MercadoPago API: ' . $e->getMessage());
                Log::error('Datos enviados: ' . json_encode($preferenceData, JSON_PRETTY_PRINT));
                
                return response()->json([
                    'status' => false,
                    'message' => 'Error de MercadoPago: ' . $e->getMessage(),
                    'details' => []
                ], 400);
            }

            if (!$preference || !isset($preference->id)) {
                Log::error('MercadoPago: Preferencia creada pero sin ID válido');
                return response()->json([
                    'status' => false,
                    'message' => 'No se pudo crear la preferencia de pago - Sin ID válido',
                    'details' => []
                ], 400);
            }

            return response()->json([
                'status' => true,
                'preference_id' => $preference->id,
                'public_key' => $config['public_key'],
                'init_point' => $preference->init_point,
                'sandbox_init_point' => $preference->sandbox_init_point,
                'redirect_url' => ($config['sandbox'] ?? true) ? $preference->sandbox_init_point : $preference->init_point,
                'orderNumber' => $orderNumber,
                'cart' => $cart,
                'sale_id' => $sale->id,
                'is_sandbox' => $config['sandbox'] ?? true,
            ]);
        } catch (\Exception $e) {
            if (isset($sale)) {
                $sale->delete();
            }
            Log::error('Error general en createPreference: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json(
                [
                    'message' => 'Error al crear la preferencia de pago',
                    'status' => false,
                    'error' => $e->getMessage(),
                ],
                500,
            );
        }
    }

    public function handleSuccess(Request $request)
    {
        try {
            // Los pagos exitosos serán manejados por el webhook
            // Aquí solo redirigimos al usuario con el external_reference
            $externalReference = $request->query('external_reference');
            
            if ($externalReference) {
                return redirect('/checkout/step/3?order=' . $externalReference . '&status=success');
            }
            
            return redirect('/checkout/step/3?status=success');
        } catch (\Exception $e) {
            return redirect('/cart?message=' . urlencode($e->getMessage()));
        }
    }

    public function handleFailure(Request $request)
    {
        $externalReference = $request->query('external_reference');
        return redirect('/cart?message=El pago ha sido rechazado&order=' . $externalReference);
    }

    public function handlePending(Request $request)
    {
        $externalReference = $request->query('external_reference');
        return redirect('/cart?message=Pago pendiente de confirmacion&order=' . $externalReference);
    }

    public function webhook(Request $request)
    {
        try {
            // Obtener configuración de MercadoPago
            $config = $this->getMercadoPagoConfig();
            
            if (!$config) {
                return response()->json(['status' => 'error'], 400);
            }
            
            // Configurar SDK de MercadoPago con datos de la DB
            MercadoPagoConfig::setAccessToken($config['access_token']);

            $data = $request->all();
            
            // Verificar si es una notificación de pago
            if ($data['type'] === 'payment' && isset($data['data']['id'])) {
                $paymentId = $data['data']['id'];
                
                $paymentClient = new PaymentClient();
                $payment = $paymentClient->get($paymentId);

                if ($payment && $payment->external_reference) {
                    $sale = Sale::where('code', $payment->external_reference)->first();
                    
                    if ($sale) {
                        if ($payment->status === 'approved') {
                            // Pago aprobado
                            $saleStatusPagado = SaleStatus::getByName('Pagado');
                            
                            $sale->update([
                                'culqi_charge_id' => $payment->id,
                                'payment_status' => 'pagado',
                                'status_id' => $saleStatusPagado ? $saleStatusPagado->id : null,
                            ]);

                            // Actualizar stock
                            $saleDetails = SaleDetail::where('sale_id', $sale->id)->get();
                            foreach ($saleDetails as $detail) {
                                Item::where('id', $detail->item_id)->decrement('stock', $detail->quantity);
                            }
                        } elseif ($payment->status === 'rejected') {
                            // Pago rechazado
                            $saleStatusRechazado = SaleStatus::getByName('Rechazado');
                            
                            $sale->update([
                                'payment_status' => 'rechazado',
                                'status_id' => $saleStatusRechazado ? $saleStatusRechazado->id : null,
                            ]);
                        }
                    }
                }
            }

            return response()->json(['status' => 'success'], 200);
        } catch (\Exception $e) {
            Log::error('MercadoPago Webhook Error: ' . $e->getMessage());
            return response()->json(['status' => 'error'], 500);
        }
    }

    public function getConfig()
    {
        try {
            $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')
                ->where('is_active', true)
                ->first();

            if (!$paymentMethod) {
                return response()->json([
                    'status' => false,
                    'message' => 'MercadoPago no está disponible'
                ], 400);
            }

            $config = json_decode($paymentMethod->configuration, true);

            return response()->json([
                'status' => true,
                'config' => [
                    'public_key' => $config['public_key'],
                    'access_token' => $config['access_token'], // Solo para uso interno
                    'is_sandbox' => $config['sandbox'] ?? true,
                    'country' => 'PE',
                    'locale' => 'es-PE'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al obtener configuración: ' . $e->getMessage()
            ], 500);
        }
    }

    private function generateOrderNumber()
    {
        $numeroOrden = '';
        for ($i = 0; $i < 12; $i++) {
            $digitoAleatorio = mt_rand(0, 9);
            $numeroOrden .= $digitoAleatorio;
        }
        return $numeroOrden;
    }

    public function getOrder(Request $request)
    {
        
        try {

            $order = Sale::where('code', $request->code) ->first();
            
            if (!$order) {
                return response()->json(
                    [
                        'status' => false,
                        'message' => 'Orden no encontrada',
                    ],
                    404,
                );
            }

            // Obtener los detalles de la venta
            $saleDetails = SaleDetail::where('sale_id', $order->id)->get();


            // Obtener los items con sus imágenes
            $items = [];
            foreach ($saleDetails as $detail) {
                $item = Item::select('name', 'image', 'color')
                            ->where('id', $detail->item_id)
                            ->first();
                
                if ($item) {
                    $items[] = [
                        'id' => $detail->item_id,
                        'name' => $detail->name ?? $item->name,
                        'image' => $item->image,
                        'color' => $detail->colors ?? $item->color,
                        'quantity' => $detail->quantity,
                        'price' => $detail->price,
                    ];
                } else {
                    // Si el item fue eliminado, usar los datos del detalle
                    $items[] = [
                        'id' => $detail->item_id,
                        'name' => $detail->name,
                        'image' => null,
                        'color' => $detail->colors,
                        'quantity' => $detail->quantity,
                        'price' => $detail->price,
                    ];
                }
            }
            
        // Formatear la respuesta
        $response = [
                'status' => true,
                'order' => [
                    'code' => $order->code,
                    'created_at' => $order->created_at->format('d/m/Y H:i'),
                    'payment_status' => $order->payment_status,
                    'amount' => $order->amount,
                    'delivery' => $order->delivery,
                    'shipping_address' => [
                        'address' => $order->address,
                        'department' => $order->department,
                        'province' => $order->province,
                        'district' => $order->district,
                        'reference' => $order->reference,
                    ],
                    'customer' => [
                        'name' => $order->name,
                        'lastname' => $order->lastname,
                        'email' => $order->email,
                        'phone' => $order->phone,
                    ],
                    'items' => $items,
                    'invoice_info' => [
                        'invoiceType' => $order->invoiceType,
                        'documentType' => $order->documentType,
                        'document' => $order->document,
                        'businessName' => $order->businessName,
                    ],
                ],
            ];

            return response()->json($response);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al obtener los detalles de la orden',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar estado del pago cuando el usuario regresa de MercadoPago
     */
    public function verifyPaymentStatus(Request $request)
    {
        try {
            $orderNumber = $request->query('external_reference') ?? $request->query('order');
            $paymentId = $request->query('payment_id');
            
            if (!$orderNumber) {
                return response()->json([
                    'status' => false,
                    'message' => 'Número de orden requerido'
                ], 400);
            }

            // Buscar la venta
            $sale = Sale::where('code', $orderNumber)->first();
            
            if (!$sale) {
                return response()->json([
                    'status' => false,
                    'message' => 'Venta no encontrada'
                ], 404);
            }

            // Si ya está pagada, devolver status
            if ($sale->payment_status === 'pagado') {
                return response()->json([
                    'status' => true,
                    'payment_status' => 'approved',
                    'order_number' => $orderNumber,
                    'sale_id' => $sale->id
                ]);
            }

            // Si tenemos payment_id, verificar con MercadoPago
            if ($paymentId) {
                // Obtener configuración de MercadoPago
                $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')
                    ->where('is_active', true)
                    ->first();

                if ($paymentMethod) {
                    $config = json_decode($paymentMethod->configuration, true);
                    MercadoPagoConfig::setAccessToken($config['access_token']);

                    $paymentClient = new PaymentClient();
                    $payment = $paymentClient->get($paymentId);

                    if ($payment && $payment->external_reference === $orderNumber) {
                        if ($payment->status === 'approved') {
                            // Actualizar venta como pagada
                            $saleStatusPagado = SaleStatus::getByName('Pagado');
                            
                            $sale->update([
                                'culqi_charge_id' => $payment->id,
                                'payment_status' => 'pagado',
                                'status_id' => $saleStatusPagado ? $saleStatusPagado->id : null,
                            ]);

                            // Actualizar stock
                            $saleDetails = SaleDetail::where('sale_id', $sale->id)->get();
                            foreach ($saleDetails as $detail) {
                                Item::where('id', $detail->item_id)->decrement('stock', $detail->quantity);
                            }

                            return response()->json([
                                'status' => true,
                                'payment_status' => 'approved',
                                'order_number' => $orderNumber,
                                'sale_id' => $sale->id
                            ]);
                        } else {
                            return response()->json([
                                'status' => true,
                                'payment_status' => $payment->status,
                                'order_number' => $orderNumber,
                                'sale_id' => $sale->id
                            ]);
                        }
                    }
                }
            }

            // Devolver estado actual de la venta
            return response()->json([
                'status' => true,
                'payment_status' => $sale->payment_status,
                'order_number' => $orderNumber,
                'sale_id' => $sale->id
            ]);

        } catch (\Exception $e) {
            Log::error('Error verificando estado de pago: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Error al verificar el pago'
            ], 500);
        }
    }

    /**
     * Crear preferencia de prueba para testing
     */
    public function createTestPreference(Request $request)
    {
        try {
            // Obtener configuración de MercadoPago
            $config = $this->getMercadoPagoConfig();
            
            if (!$config) {
                return response()->json([
                    'message' => 'MercadoPago no está disponible',
                    'status' => false,
                ], 400);
            }
            
            // Configurar SDK de MercadoPago
            MercadoPagoConfig::setAccessToken($config['access_token']);
            
            $client = new PreferenceClient();

            // Datos de prueba
            $preferenceData = [
                "items" => [
                    [
                        "title" => "Producto de prueba - Test Final Checkout Pro",
                        "quantity" => 1,
                        "unit_price" => 100.00,
                        "currency_id" => "PEN"
                    ]
                ],
                "payer" => [
                    "email" => "test_buyer_123@testuser.com"
                ],
                "back_urls" => [
                    "success" => url('/mercadopago/success'),
                    "failure" => url('/mercadopago/failure'),
                    "pending" => url('/mercadopago/pending')
                ],
                "auto_return" => "approved",
                "external_reference" => "test_" . time()
            ];

            $preference = $client->create($preferenceData);

            return response()->json([
                'status' => true,
                'id' => $preference->id,
                'init_point' => $preference->init_point,
                'sandbox_init_point' => $preference->sandbox_init_point,
                'external_reference' => $preference->external_reference
            ]);

        } catch (MPApiException $e) {
            Log::error('Error MercadoPago API: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Error de MercadoPago: ' . $e->getMessage(),
                'details' => $e->getApiResponse()
            ], 500);
        } catch (\Exception $e) {
            Log::error('Error general en test preference: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Error interno: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar credenciales actuales
     */
    public function verifyCredentials()
    {
        try {
            $config = $this->getMercadoPagoConfig();
            
            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'MercadoPago no configurado'
                ]);
            }

            $accessToken = $config['access_token'] ?? '';

            // Verificar cuenta con API
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => "https://api.mercadopago.com/users/me",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    "Authorization: Bearer $accessToken",
                    "Content-Type: application/json"
                ],
                CURLOPT_TIMEOUT => 10
            ]);

            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);

            if ($httpCode === 200) {
                $userData = json_decode($response, true);
                return response()->json([
                    'success' => true,
                    'user_data' => $userData,
                    'credentials_type' => str_starts_with($accessToken, 'APP_USR-') ? 'production' : 'test'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Error en API: ' . $httpCode,
                    'response' => $response
                ]);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Test de conectividad API
     */
    public function testAPI()
    {
        try {
            $startTime = microtime(true);
            
            $config = $this->getMercadoPagoConfig();
            
            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'MercadoPago no configurado'
                ]);
            }

            $accessToken = $config['access_token'] ?? '';

            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => "https://api.mercadopago.com/users/me",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    "Authorization: Bearer $accessToken",
                    "Content-Type: application/json"
                ],
                CURLOPT_TIMEOUT => 10
            ]);

            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);

            $endTime = microtime(true);
            $responseTime = round(($endTime - $startTime) * 1000, 2);

            return response()->json([
                'success' => $httpCode === 200,
                'status' => $httpCode === 200 ? 'OK' : 'ERROR',
                'response_time' => $responseTime,
                'http_code' => $httpCode
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Procesar pago usando Checkout API de MercadoPago (más simple que Checkout Pro)
     */
    public function processCheckoutApi(Request $request)
    {
        try {
            Log::info('MercadoPago Checkout API Request:', $request->all());

            // Obtener configuración de MercadoPago
            $config = $this->getMercadoPagoConfig();
            if (!$config) {
                return response()->json([
                    'message' => 'MercadoPago no está disponible',
                    'status' => false,
                ], 400);
            }

            // Configurar SDK
            MercadoPagoConfig::setAccessToken($config['access_token']);

            // Generar número de orden
            $orderNumber = $this->generateOrderNumber();

            // Extraer datos del cliente
            $checkoutData = $request->all();
            $cart = json_decode($request->cart, true) ?? [];

            // Crear venta en base de datos
            $saleStatusPendiente = SaleStatus::getByName('Pendiente');
            
            $sale = Sale::create([
                'code' => $orderNumber,
                'user_id' => $checkoutData['user_id'] ?? null,
                'name' => $checkoutData['name'] ?? 'Cliente',
                'lastname' => $checkoutData['lastname'] ?? '',
                'fullname' => ($checkoutData['name'] ?? 'Cliente') . ' ' . ($checkoutData['lastname'] ?? ''),
                'email' => $checkoutData['email'] ?? 'test@example.com',
                'phone' => $checkoutData['phone'] ?? '',
                'country' => $checkoutData['country'] ?? 'PE',
                'department' => $checkoutData['department'] ?? '',
                'province' => $checkoutData['province'] ?? '',
                'district' => $checkoutData['district'] ?? '',
                'address' => $checkoutData['address'] ?? '',
                'number' => $checkoutData['number'] ?? '',
                'reference' => $checkoutData['reference'] ?? '',
                'comment' => $checkoutData['comment'] ?? '',
                'amount' => $request->amount ?? 0,
                'delivery' => $checkoutData['delivery'] ?? 0,
                'payment_status' => 'pendiente',
                'status_id' => $saleStatusPendiente ? $saleStatusPendiente->id : null,
            ]);

            // Crear detalles de la venta
            $totalItems = 0;
            foreach ($cart as $cartItem) {
                $item = Item::find($cartItem['id']);
                if ($item) {
                    SaleDetail::create([
                        'sale_id' => $sale->id,
                        'item_id' => $item->id,
                        'quantity' => $cartItem['quantity'],
                        'price' => $cartItem['price'],
                        'total' => $cartItem['price'] * $cartItem['quantity'],
                    ]);
                    $totalItems += $cartItem['quantity'];
                }
            }

            // Crear pago usando PaymentClient (Checkout API)
            $client = new PaymentClient();
            
            $paymentData = [
                "transaction_amount" => floatval($request->amount),
                "token" => $request->token, // Token generado desde el frontend
                "description" => "Compra en " . env('APP_NAME', 'Bananalab') . " - Orden #" . $orderNumber,
                "installments" => intval($request->installments ?? 1),
                "payment_method_id" => $request->payment_method_id,
                "issuer_id" => $request->issuer_id ?? null,
                "payer" => [
                    "email" => $checkoutData['email'] ?? 'test@example.com',
                    "identification" => [
                        "type" => $request->identification_type ?? "DNI",
                        "number" => $request->identification_number ?? "12345678"
                    ]
                ],
                "external_reference" => $orderNumber,
                "notification_url" => url('/api/mercadopago/webhook'),
                "metadata" => [
                    "sale_id" => $sale->id,
                    "order_number" => $orderNumber
                ]
            ];

            Log::info('MercadoPago Payment Data:', $paymentData);

            $payment = $client->create($paymentData);

            Log::info('MercadoPago Payment Response:', [
                'id' => $payment->id,
                'status' => $payment->status,
                'status_detail' => $payment->status_detail
            ]);

            // Actualizar la venta con información del pago
            $sale->update([
                'payment_id' => $payment->id,
                'payment_status' => $payment->status,
                'payment_detail' => json_encode($payment)
            ]);

            // Determinar el estado de la venta basado en el estado del pago
            if ($payment->status === 'approved') {
                $approvedStatus = SaleStatus::getByName('Aprobado');
                if ($approvedStatus) {
                    $sale->update(['status_id' => $approvedStatus->id]);
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Pago procesado exitosamente',
                'sale' => $sale,
                'code' => $orderNumber,
                'delivery' => $sale->delivery,
                'payment_id' => $payment->id,
                'payment_status' => $payment->status,
                'payment_url' => null // No hay URL de redirección con Checkout API
            ]);

        } catch (MPApiException $e) {
            Log::error('MercadoPago API Error:', [
                'message' => $e->getMessage(),
                'status_code' => $e->getStatusCode(),
                'api_response' => $e->getApiResponse()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error en MercadoPago: ' . $e->getMessage(),
                'details' => $e->getApiResponse()
            ], 400);

        } catch (\Exception $e) {
            Log::error('MercadoPago Checkout API Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error procesando el pago: ' . $e->getMessage()
            ], 500);
        }
    }
}
