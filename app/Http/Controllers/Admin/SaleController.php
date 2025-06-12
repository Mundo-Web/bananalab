<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleStatus;
use Illuminate\Http\Request;

class SaleController extends BasicController
{
    public $model = Sale::class;
    public $reactView = 'Admin/Sales';
    public function setReactViewProperties(Request $request)
    {
        return [
            'statuses' => SaleStatus::all(),
        ];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::with('status');
    }
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
    /**
     * Obtener venta por código
     */
    public function getByCode($code)
    {
        try {
            $sale = Sale::with(['status', 'details.item'])
                ->where('code', $code)
                ->first();

            if (!$sale) {
                return response()->json([
                    'status' => false,
                    'message' => 'Venta no encontrada'
                ], 404);
            }

            return response()->json([
                'status' => true,
                'sale' => $sale
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error obteniendo venta: ' . $e->getMessage()
            ], 500);
        }
    }
}
