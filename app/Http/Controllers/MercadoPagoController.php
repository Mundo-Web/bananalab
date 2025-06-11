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
    public function createPreference(Request $request)
    {
        try {

            // Obtener configuración de MercadoPago desde la base de datos
            $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')
                ->where('is_active', true)
                ->first();

            if (!$paymentMethod) {
                return response()->json([
                    'message' => 'MercadoPago no está disponible',
                    'status' => false,
                ], 400);
            }

            $config = json_decode($paymentMethod->configuration, true);
            
            // Configurar SDK de MercadoPago con datos de la DB
            MercadoPagoConfig::setAccessToken($config['access_token']);

            // Generar número de orden
            $orderNumber = $this->generateOrderNumber();

            // Extraer datos del cliente (puede venir en $request->customer o directamente en $request)
            $customer = $request->customer ?? [];
            $customerName = $customer['name'] ?? $request->name ?? 'Cliente';
            $customerLastname = $customer['lastname'] ?? $request->lastname ?? '';
            $customerEmail = $customer['email'] ?? $request->email ?? 'test@example.com';
            $customerPhone = $customer['phone'] ?? $request->phone ?? '';

            // Crear registro de venta con estado "pendiente" ANTES de crear la preferencia
            $saleStatusPendiente = SaleStatus::getByName('Pendiente');

            $sale = Sale::create([
                'code' => $orderNumber,
                'user_id' => $request->user_id ?? null,
                'name' => $customerName,
                'lastname' => $customerLastname,
                'fullname' => $customerName . ' ' . $customerLastname,
                'email' => $customerEmail,
                'phone' => $customerPhone,
                'country' => $request->country ?? 'PE',
                'department' => $request->department ?? '',
                'province' => $request->province ?? '',
                'district' => $request->district ?? '',
                'ubigeo' => $request->ubigeo ?? '',
                'address' => $request->address ?? '',
                'number' => $request->number ?? '',
                'reference' => $request->reference ?? '',
                'comment' => $request->comment ?? '',
                'amount' => $request->amount ?? 0,
                'delivery' => $request->delivery ?? 0,
                'payment_status' => 'pendiente',
                'status_id' => $saleStatusPendiente ? $saleStatusPendiente->id : null,
                'invoiceType' => $request->invoiceType ?? '',
                'documentType' => $request->documentType ?? '',
                'document' => $request->document ?? '',
                'businessName' => $request->businessName ?? '',
            ]);

             // Registrar detalles de la venta (sin afectar stock aún)
            $cart = $request->cart ?? $request->items ?? [];
            
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

            // Si no hay items del carrito, crear un item por defecto basado en el monto
            if (empty($items)) {
                $items[] = [
                    'id' => 'default',
                    'title' => 'Pago',
                    'quantity' => 1,
                    'unit_price' => round((float) $request->amount, 2),
                    'currency_id' => 'PEN',
                ];
            }

            // Agregar envío si existe
            if ($request->delivery > 0) {
                $items[] = [
                    'id' => 'delivery',
                    'title' => 'Costo de envío',
                    'quantity' => 1,
                    'unit_price' => round(max((float) $request->delivery, 0.1), 2),
                    'currency_id' => 'PEN',
                ];
            }

            // Use public URLs for sandbox mode (MercadoPago requirement)
            $baseUrl = ($config['sandbox'] ?? true) ? 'https://httpbin.org' : config('app.url');
            $webhookUrl = ($config['sandbox'] ?? true) ? 'https://httpbin.org/post' : config('app.url') . '/api/mercadopago/webhook';

            // Configurar preferencia
            $preferenceData = [
                'items' => $items,
                'payment_methods' => [
                    'excluded_payment_methods' => [
                    ],
                    'excluded_payment_types' => [
                        ['id' => 'ticket'], // Excluye pagos en efectivo (Ripley, Banco Azteca, etc.)
                        ['id' => 'atm'], // Excluye pagos en cajeros
                    ],
                    'installments' => 6,
                    'default_installments' => 1,
                ],
                'payer' => [
                    'name' => $customerName,
                    'surname' => $customerLastname,
                    'email' => $customerEmail,
                    'phone' => [
                        'area_code' => '',
                        'number' => $customerPhone,
                    ],
                    'address' => [
                        'street_name' => $request->address ?? '',
                        'street_number' => $request->number ?? '',
                        'zip_code' => '',
                    ],
                ],
                'back_urls' => [
                    'success' => $baseUrl . '/status/200?payment_type=mercadopago&order=' . $orderNumber,
                    'failure' => $baseUrl . '/status/400?payment_type=mercadopago&order=' . $orderNumber,
                    'pending' => $baseUrl . '/status/202?payment_type=mercadopago&order=' . $orderNumber,
                ],
                'auto_return' => 'approved',
                'external_reference' => $orderNumber,
                'notification_url' => $webhookUrl,
                'expires' => true,
                'expiration_date_from' => now()->toISOString(),
                'expiration_date_to' => now()->addHours(24)->toISOString(),
            ];

            // Crear preferencia
            $client = new PreferenceClient();

            // Guardar la preferencia
            try {
                $preference = $client->create($preferenceData);
            } catch (\Exception $e) {
                // Log detallado del error de MercadoPago
                \Illuminate\Support\Facades\Log::error('Error en MercadoPago API: ' . $e->getMessage());
                \Illuminate\Support\Facades\Log::error('Datos enviados: ' . json_encode($preferenceData, JSON_PRETTY_PRINT));
                throw new \Exception('Error en la API de MercadoPago: ' . $e->getMessage());
            }

            if (!$preference || !isset($preference->id)) {
                throw new \Exception('No se pudo crear la preferencia de pago');
            }

            return response()->json([
                'status' => true,
                'preference_id' => $preference->id,
                'public_key' => $config['public_key'],
                'init_point' => $preference->init_point,
                'sandbox_init_point' => $preference->sandbox_init_point,
                'redirect_url' => $preference->init_point,
                'orderNumber' => $orderNumber,
                'cart' => $cart,
                'sale_id' => $sale->id,
            ]);
        } catch (\Exception $e) {
            if (isset($sale)) {
                $sale->delete();
            }
            return response()->json(
                [
                    'message' => 'Error al crear la preferencia de pago',
                    'status' => false,
                    'error' => $e->getMessage(),
                ],
                400,
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
            // Obtener configuración de MercadoPago desde la base de datos
            $paymentMethod = \App\Models\PaymentMethod::where('slug', 'mercadopago')
                ->where('is_active', true)
                ->first();

            if (!$paymentMethod) {
                return response()->json(['status' => 'error'], 400);
            }

            $config = json_decode($paymentMethod->configuration, true);
            
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
                'public_key' => $config['public_key'],
                'is_sandbox' => $config['sandbox'] ?? true,
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
}
