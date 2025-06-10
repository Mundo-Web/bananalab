<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Item;
use App\Models\ItemPreset;
use Illuminate\Http\Request;

class ItemPresetReactController extends BasicController
{
    public $model = ItemPreset::class;
    public $reactView = 'Admin/ItemPresets';
    public $imageFields = ['image', 'cover_image', 'content_layer_image', 'final_layer_image', 'preview_image'];
    public $prefix4filter = 'item_presets';

    public function setReactViewProperties(Request $request)
    {
        $items = Item::select('id', 'name')->orderBy('name')->get();

        return [
            'items' => $items
        ];
    }    public function setPaginationInstance(Request $request, string $model)
    {
        $query = $model::select(['item_presets.*'])
            ->with(['item:id,name']);
            
        // Filtrar por item_id si se proporciona
        if ($request->filled('item_id')) {
            $query->where('item_id', $request->item_id);
        }
        
        return $query->orderBy('item_presets.sort_order')
            ->orderBy('item_presets.name');
    }

    /**
     * Get presets for a specific item (public endpoint)
     */    public function getByItemPublic(Request $request, Item $item)
    {
        try {
            $presets = $item->presets()
                ->where('is_active', true) // Solo presets activos
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();
                
            return response()->json([
                'success' => true,
                'data' => $presets
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar los presets: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific preset by ID (public endpoint)
     */
    public function getByIdPublic(Request $request, ItemPreset $preset)
    {
        try {
            // Solo devolver si el preset está activo
            if (!$preset->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Preset no encontrado o no disponible'
                ], 404);
            }

            // Cargar relación con item para obtener información adicional
            $preset->load('item:id,name');
            
            return response()->json([
                'success' => true,
                'data' => $preset
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar el preset: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get presets for a specific item
     */
    public function getItemPresets(Request $request, Item $item)
    {
        try {
            $presets = $item->presets()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();
                
            return response()->json([
                'success' => true,
                'data' => $presets
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar los presets: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Toggle preset status
     */
    public function toggleStatus(Request $request, Item $item, ItemPreset $preset)
    {
        try {
            // Verificar que el preset pertenece al item
            if ($preset->item_id !== $item->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'El preset no pertenece a este item'
                ], 400);
            }
            
            $preset->is_active = !$preset->is_active;
            $preset->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Estado actualizado correctamente',
                'data' => $preset
            ]);        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el estado: ' . $e->getMessage()
            ], 500);
        }    }

    /**
     * Override save method to handle item context and nested route
     */
    public function save(Request $request, \App\Models\Item $item = null, \App\Models\ItemPreset $preset = null): \Illuminate\Http\Response|\Illuminate\Routing\ResponseFactory
    {
        // Debug: Log all incoming data
        \Log::info('ItemPresetReactController::save - Datos recibidos', [
            'all_data' => $request->all(),
            'files' => $request->allFiles(),
            'item_id' => $item ? $item->id : null,
            'preset_id' => $preset ? $preset->id : null
        ]);
        
        try {
            // Si la ruta es anidada, el $item y $preset ya son modelos inyectados
            if ($item) {
                $request->merge(['item_id' => $item->id]);
                if ($preset) {
                    $request->merge(['id' => $preset->id]);
                }
            }
            // Llamar al método save del padre (create o update según 'id' en el request)
            return parent::save($request);
        } catch (\Exception $e) {
            \Log::error('ItemPresetReactController::save - Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response([
                'success' => false,
                'message' => 'Error al guardar el preset: ' . $e->getMessage()
            ], 500);
        }
    }


     public function getItemPublic(Request $request, $uuid)
    {
        try {
            // Solo devolver si el item está activo
         $item = Item::where('id', $uuid)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $item
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar el item: ' . $e->getMessage()
            ], 500);
        }
    }
}
