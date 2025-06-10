<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;

class SaleController extends BasicController
{
    public $model = Sale::class;
    public $reactView = 'Admin/Sales';

    /**
     * Obtener ventas pendientes de verificación
     */
    public function getPendingVerification()
    {
        try {
            $sales = Sale::where('payment_status', 'pendiente_verificacion')
                ->whereIn('payment_method', ['yape', 'transferencia'])
                ->whereNotNull('payment_proof_path')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => true,
                'sales' => $sales
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error obteniendo ventas pendientes: ' . $e->getMessage()
            ], 500);
        }
    }
}
