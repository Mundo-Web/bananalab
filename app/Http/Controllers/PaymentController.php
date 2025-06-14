<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\SaleStatus;
use App\Models\Payment;
use App\Models\PaymentProof;
use App\Models\PaymentMethod;
use Culqi\Culqi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function getPaymentStatus($sale_id)
    {
        $sale = Sale::findOrFail($sale_id);
        return response()->json($sale);
    }

    public function charge(Request $request)
    {
        try {
            $culqi = new Culqi([
                'api_key' => config('services.culqi.secret_key'),
            ]);

            // Crear el intento de pago
            $charge = $culqi->Charges->create([
                "amount" => $request->amount * 100,
                "currency_code" => "PEN",
                "email" => $request->email,
                "source_id" => $request->token
            ]);

            // Validar si el pago fue exitoso
            if (!isset($charge->id) || ($charge->outcome->type ?? '') !== 'venta_exitosa') {
                return response()->json([
                    'message' => 'Pago fallido',
                    'status' => false,
                    'error' => $charge->outcome->user_message ?? 'Error desconocido'
                ], 400);
            }

            $saleStatusPagado = SaleStatus::getByName('Pagado');

            // Registrar la venta
            $sale = Sale::create([
                'code' => $request->orderNumber,
                'user_id' => $request->user_id,
                'name' => $request->name,
                'lastname' => $request->lastname,
                'fullname' => $request->fullname,
                'email' => $request->email,
                'phone' => $request->phone,
                'country' => $request->country,
                'department' => $request->department,
                'province' => $request->province,
                'district' => $request->district,
                'ubigeo' => $request->ubigeo,
                'address' => $request->address,
                'number' => $request->number,
                'reference' => $request->reference,
                'comment' => $request->comment,
                'amount' => $request->amount,
                'delivery' => $request->delivery,
                'culqi_charge_id' => $charge->id,
                'payment_status' => 'pagado',
                'status_id' => $saleStatusPagado ? $saleStatusPagado->id : null,
                'invoiceType' => $request->invoiceType,
                'documentType' => $request->documentType,
                'document' => $request->document,
                'businessName' => $request->businessName
            ]);

            // Registrar detalles de la venta y actualizar stock
            foreach ($request->cart as $item) {
                $itemId = is_array($item) ? $item['id'] ?? null : $item->id ?? null;
                $itemName = is_array($item) ? $item['name'] ?? null : $item->name ?? null;
                $itemPrice = is_array($item) ? $item['final_price'] ?? null : $item->final_price ?? null;
                $itemQuantity = is_array($item) ? $item['quantity'] ?? null : $item->quantity ?? null;

                SaleDetail::create([
                    'sale_id' => $sale->id,
                    'item_id' => $itemId,
                    'name' => $itemName,
                    'price' => $itemPrice,
                    'quantity' => $itemQuantity,
                ]);

                Item::where('id', $itemId)->decrement('stock', $itemQuantity);
            }

            return response()->json([
                'message' => 'Pago exitoso',
                'status' => true,
                'culqi_response' => $charge,
                'sale' => $request->cart,
                'code' => $request->orderNumber,
                'delivery' => $request->delivery
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error en el pago',
                'status' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Procesar pago con MercadoPago
     */
    public function processMercadoPago(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required',
                'amount' => 'required|numeric|min:0.01',
                'cart' => 'required|array',
                'email' => 'required|email',
                'name' => 'required|string',
                'lastname' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors()
                ], 400);
            }

            // Verificar que MercadoPago esté configurado
            if (!config('services.mercadopago.access_token') || !config('services.mercadopago.public_key')) {
                return response()->json([
                    'status' => false,
                    'message' => 'MercadoPago no está configurado correctamente'
                ], 500);
            }

            // Usar el MercadoPagoController para crear la preferencia
            $mercadoPagoController = new \App\Http\Controllers\MercadoPagoController();
            $preferenceResponse = $mercadoPagoController->createPreference($request);
            
            // Verificar si la preferencia se creó exitosamente
            $responseData = $preferenceResponse->getData(true);
            
            if (!$responseData['status']) {
                return response()->json([
                    'status' => false,
                    'message' => $responseData['message'] ?? 'Error al crear preferencia de MercadoPago'
                ], 400);
            }

            return response()->json([
                'status' => true,
                'message' => 'Preferencia de MercadoPago creada exitosamente',
                'sale' => [
                    'id' => $responseData['sale_id'],
                    'code' => $responseData['orderNumber']
                ],
                'delivery' => $request->delivery ?? 0,
                'code' => $responseData['orderNumber'],
                'payment_url' => $responseData['redirect_url'],
                'preference_id' => $responseData['preference_id'],
                'public_key' => $responseData['public_key']
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error procesando el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Procesar pago manual (Yape/Transferencia)
     */
    public function processManualPayment(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required',
                'amount' => 'required|numeric|min:0.01',
                'cart' => 'required|string', // JSON string
                'email' => 'required|email',
                'name' => 'required|string',
                'lastname' => 'required|string',
                'payment_method' => 'required|in:yape,transferencia',
                'payment_proof' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120' // 5MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors()
                ], 400);
            }

            $cart = json_decode($request->cart, true);
            if (!$cart) {
                return response()->json([
                    'status' => false,
                    'message' => 'Carrito inválido'
                ], 400);
            }

            $saleStatusPendiente = SaleStatus::getByName('Pendiente Verificación') ?? SaleStatus::first();

            // Crear la venta
            $sale = Sale::create([
                'code' => strtoupper($request->payment_method) . '_' . time() . '_' . $request->user_id,
                'user_id' => $request->user_id,
                'name' => $request->name,
                'lastname' => $request->lastname,
                'fullname' => $request->name . ' ' . $request->lastname,
                'email' => $request->email,
                'phone' => $request->phone ?? '',
                'country' => $request->country ?? 'Perú',
                'department' => $request->department,
                'province' => $request->province,
                'district' => $request->district,
                'ubigeo' => $request->ubigeo,
                'address' => $request->address,
                'number' => $request->number,
                'reference' => $request->reference,
                'comment' => $request->comment,
                'amount' => $request->amount,
                'delivery' => $request->delivery ?? 0,
                'payment_status' => 'pendiente_verificacion',
                'status_id' => $saleStatusPendiente->id,
                'payment_method' => $request->payment_method
            ]);

            // Registrar detalles de la venta
            foreach ($cart as $item) {
                SaleDetail::create([
                    'sale_id' => $sale->id,
                    'item_id' => $item['id'] ?? null,
                    'name' => $item['name'] ?? null,
                    'price' => $item['final_price'] ?? null,
                    'quantity' => $item['quantity'] ?? null,
                ]);
            }

            // Guardar comprobante de pago
            if ($request->hasFile('payment_proof')) {
                $file = $request->file('payment_proof');
                $filename = 'payment_proof_' . $sale->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('payment_proofs', $filename, 'public');

                // Crear registro en tabla de comprobantes (necesitarás crear esta tabla)
                // PaymentProof::create([...]);
                
                // Por ahora guardamos en la venta
                $sale->update(['payment_proof_path' => $path]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Orden creada. Pendiente de verificación del comprobante.',
                'sale' => $sale,
                'delivery' => $request->delivery ?? 0,
                'code' => $sale->code
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error procesando el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Procesar pago dinámico según método configurado
     */
    public function processPayment(Request $request)
    {
        try {
            // Validación básica
            $validator = Validator::make($request->all(), [
                'user_id' => 'required',
                'amount' => 'required|numeric|min:0.01',
                'cart' => 'required',
                'email' => 'required|email',
                'name' => 'required|string',
                'lastname' => 'required|string',
                'payment_method' => 'required|string',
                // Campos de dirección
                'department' => 'required|string',
                'province' => 'required|string',
                'district' => 'required|string',
                'address' => 'required|string',
                'reference' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors()
                ], 400);
            }

            // Buscar el método de pago en la base de datos
            $paymentMethod = PaymentMethod::where('slug', $request->payment_method)
                ->where('is_active', true)
                ->first();

            if (!$paymentMethod) {
                return response()->json([
                    'status' => false,
                    'message' => 'Método de pago no disponible'
                ], 400);
            }

            // Procesar según el tipo de método
            switch ($paymentMethod->type) {
                case 'gateway':
                    return $this->processGatewayPayment($request, $paymentMethod);
                    
                case 'qr':
                case 'manual':
                    return $this->processManualPaymentDynamic($request, $paymentMethod);
                    
                default:
                    return response()->json([
                        'status' => false,
                        'message' => 'Tipo de método de pago no soportado'
                    ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Error procesando pago: ' . $e->getMessage(), [
                'request' => $request->all(),
                'exception' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Procesar pago por gateway (Culqi, MercadoPago)
     */
    private function processGatewayPayment(Request $request, PaymentMethod $paymentMethod)
    {
        switch ($paymentMethod->slug) {
            case 'culqi':
                return $this->processCulqiPayment($request, $paymentMethod);
                
            case 'mercadopago':
                return $this->processMercadoPago($request);
                
            default:
                return response()->json([
                    'status' => false,
                    'message' => 'Gateway no soportado'
                ], 400);
        }
    }

    /**
     * Procesar pago con Culqi
     */
    private function processCulqiPayment(Request $request, PaymentMethod $paymentMethod)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Token de Culqi requerido',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $config = $paymentMethod->configuration;
            
            $culqi = new Culqi([
                'api_key' => $config['secret_key'] ?? config('services.culqi.secret_key'),
            ]);

            // Calcular el monto total con comisiones
            $amount = $request->amount;
            $fee = $paymentMethod->calculateFee($amount);
            $totalAmount = $amount + $fee;

            // Crear el intento de pago
            $charge = $culqi->Charges->create([
                "amount" => $totalAmount * 100, // Culqi maneja centavos
                "currency_code" => $config['currency'] ?? "PEN",
                "email" => $request->email,
                "source_id" => $request->token
            ]);

            // Validar si el pago fue exitoso
            if ($charge->outcome->type !== 'venta_exitosa') {
                return response()->json([
                    'message' => 'El pago no pudo ser procesado',
                    'status' => false,
                    'culqi_response' => $charge
                ], 400);
            }

            // Crear la venta
            $sale = $this->createSale($request, $paymentMethod, 'pagado');
            $sale->update([
                'culqi_charge_id' => $charge->id,
                'payment_status' => 'pagado'
            ]);

            // Registrar detalles y actualizar stock
            $this->processSaleDetails($sale, $request->cart);

            return response()->json([
                'status' => true,
                'message' => 'Pago exitoso',
                'culqi_response' => $charge,
                'sale' => $sale,
                'code' => $sale->code,
                'delivery' => $request->delivery ?? 0
            ]);

        } catch (\Exception $e) {
            Log::error('Error en pago Culqi: ' . $e->getMessage());
            
            return response()->json([
                'status' => false,
                'message' => 'Error en el pago con Culqi',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Procesar pago manual dinámico (Yape, transferencias, etc.)
     */
    private function processManualPaymentDynamic(Request $request, PaymentMethod $paymentMethod)
    {
        // Validar si requiere comprobante
        if ($paymentMethod->requires_proof) {
            $validator = Validator::make($request->all(), [
                'payment_proof' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120' // 5MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Comprobante de pago requerido',
                    'errors' => $validator->errors()
                ], 400);
            }
        }

        try {
            // Crear la venta con estado pendiente
            $sale = $this->createSale($request, $paymentMethod, 'pendiente_verificacion');

            // Subir comprobante si se proporciona
            if ($request->hasFile('payment_proof')) {
                $proofPath = $this->uploadPaymentProof($request->file('payment_proof'), $sale);
                $sale->update(['payment_proof_path' => $proofPath]);
            }

            // Registrar detalles de la venta (sin actualizar stock hasta verificación)
            $this->processSaleDetails($sale, $request->cart, false);

            return response()->json([
                'status' => true,
                'message' => 'Orden creada. Pendiente de verificación del comprobante.',
                'sale' => $sale,
                'delivery' => $request->delivery ?? 0,
                'code' => $sale->code
            ]);

        } catch (\Exception $e) {
            Log::error('Error en pago manual: ' . $e->getMessage());
            
            return response()->json([
                'status' => false,
                'message' => 'Error procesando el pago manual',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear venta en base de datos
     */
    private function createSale(Request $request, PaymentMethod $paymentMethod, string $paymentStatus)
    {
        $saleStatus = $paymentStatus === 'pagado' 
            ? SaleStatus::getByName('Pagado') ?? SaleStatus::first()
            : SaleStatus::getByName('Pendiente Verificación') ?? SaleStatus::first();

        // Calcular monto total con comisiones
        $amount = $request->amount;
        $fee = $paymentMethod->calculateFee($amount);
        $totalAmount = $amount + $fee;

        return Sale::create([
            'code' => strtoupper($paymentMethod->slug) . '_' . time() . '_' . $request->user_id,
            'user_id' => $request->user_id,
            'name' => $request->name,
            'lastname' => $request->lastname,
            'fullname' => $request->name . ' ' . $request->lastname,
            'email' => $request->email,
            'phone' => $request->phone ?? '',
            'country' => $request->country ?? 'Perú',
            'department' => $request->department,
            'province' => $request->province,
            'district' => $request->district,
            'ubigeo' => $request->ubigeo ?? null,
            'address' => $request->address,
            'number' => $request->number ?? '',
            'reference' => $request->reference,
            'comment' => $request->comment ?? '',
            'amount' => $totalAmount,
            'delivery' => $request->delivery ?? 0,
            'payment_status' => $paymentStatus,
            'status_id' => $saleStatus->id,
            'payment_method' => $paymentMethod->slug,
            'payment_method_id' => $paymentMethod->id,
            'payment_fee' => $fee,
            'invoiceType' => $request->invoiceType ?? null,
            'documentType' => $request->documentType ?? null,
            'document' => $request->document ?? null,
            'businessName' => $request->businessName ?? null,
        ]);
    }

    /**
     * Procesar detalles de la venta
     */
    private function processSaleDetails(Sale $sale, $cart, bool $updateStock = true)
    {
        // Convertir cart a array si es string JSON
        if (is_string($cart)) {
            $cart = json_decode($cart, true);
        }

        foreach ($cart as $item) {
            $itemId = is_array($item) ? ($item['id'] ?? null) : ($item->id ?? null);
            $itemName = is_array($item) ? ($item['name'] ?? null) : ($item->name ?? null);
            $itemPrice = is_array($item) ? ($item['final_price'] ?? null) : ($item->final_price ?? null);
            $itemQuantity = is_array($item) ? ($item['quantity'] ?? null) : ($item->quantity ?? null);

            SaleDetail::create([
                'sale_id' => $sale->id,
                'item_id' => $itemId,
                'name' => $itemName,
                'price' => $itemPrice,
                'quantity' => $itemQuantity,
            ]);

            // Actualizar stock solo si se especifica
            if ($updateStock && $itemId) {
                Item::where('id', $itemId)->decrement('stock', $itemQuantity);
            }
        }
    }

    /**
     * Subir comprobante de pago
     */
    private function uploadPaymentProof($file, Sale $sale)
    {
        $fileName = 'proof_' . $sale->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('payment_proofs', $fileName, 'public');
        
        return $path;
    }

    /**
     * Obtener métodos de pago disponibles
     */
    public function getPaymentMethods()
    {
        return response()->json([
            'status' => true,
            'methods' => [
                'culqi' => [
                    'name' => 'Tarjeta de Crédito/Débito',
                    'description' => 'Visa, Mastercard',
                    'enabled' => true,
                    'fees' => 0
                ],
                'mercadopago' => [
                    'name' => 'MercadoPago',
                    'description' => 'Pago online seguro',
                    'enabled' => true,
                    'fees' => 0
                ],
                'yape' => [
                    'name' => 'Yape',
                    'description' => 'Pago móvil',
                    'enabled' => true,
                    'fees' => 0,
                    'phone' => '+51 999 888 777'
                ],
                'transferencia' => [
                    'name' => 'Transferencia Bancaria',
                    'description' => 'Depósito o transferencia',
                    'enabled' => true,
                    'fees' => 0,
                    'bank_details' => [
                        'bank' => 'BCP',
                        'account' => '123-456789-0-12',
                        'cci' => '00212312345678901234',
                        'holder' => 'BananaLab SAC'
                    ]
                ]
            ]
        ]);
    }

    /**
     * Validar comprobante de pago (Admin)
     */
    public function validatePaymentProof(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'sale_id' => 'required|exists:sales,id',
                'status' => 'required|in:approved,rejected',
                'admin_notes' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors()
                ], 400);
            }

            $sale = Sale::findOrFail($request->sale_id);
            
            if ($request->status === 'approved') {
                $saleStatusPagado = SaleStatus::getByName('Pagado') ?? SaleStatus::first();
                
                $sale->update([
                    'payment_status' => 'pagado',
                    'status_id' => $saleStatusPagado->id,
                    'admin_notes' => $request->admin_notes
                ]);

                // Actualizar stock
                foreach ($sale->saleDetails as $detail) {
                    if ($detail->item_id) {
                        Item::where('id', $detail->item_id)->decrement('stock', $detail->quantity);
                    }
                }
            } else {
                $saleStatusRechazado = SaleStatus::getByName('Rechazado') ?? SaleStatus::first();
                
                $sale->update([
                    'payment_status' => 'rechazado',
                    'status_id' => $saleStatusRechazado->id,
                    'admin_notes' => $request->admin_notes
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Comprobante ' . ($request->status === 'approved' ? 'aprobado' : 'rechazado') . ' exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error validando comprobante: ' . $e->getMessage()
            ], 500);
        }
    }
}
