<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\ItemPreset;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Illuminate\Support\Facades\Storage;

class ItemPresetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): View
    {
        $query = ItemPreset::with('item');

        // Filtro por item
        if ($request->filled('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        // Filtro por estado
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        // Búsqueda por nombre
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $presets = $query->ordered()->paginate(15);
        $items = Item::select('id', 'name')->orderBy('name')->get();

        return view('admin.item-presets.index', compact('presets', 'items'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request): View
    {
        $items = Item::select('id', 'name')->orderBy('name')->get();
        $selectedItemId = $request->get('item_id');

        return view('admin.item-presets.create', compact('items', 'selectedItemId'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'configuration' => 'nullable|json'
        ]);

        $data = $request->all();

        // Procesar la imagen
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('presets', 'public');
        }

        // Procesar configuración JSON
        if ($request->filled('configuration')) {
            $data['configuration'] = json_decode($request->configuration, true);
        }

        ItemPreset::create($data);

        return redirect()->route('admin.item-presets.index')
            ->with('success', 'Preset creado exitosamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(ItemPreset $itemPreset): View
    {
        $itemPreset->load('item');
        
        return view('admin.item-presets.show', compact('itemPreset'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ItemPreset $itemPreset): View
    {
        $items = Item::select('id', 'name')->orderBy('name')->get();
        
        return view('admin.item-presets.edit', compact('itemPreset', 'items'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ItemPreset $itemPreset): RedirectResponse
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'configuration' => 'nullable|json'
        ]);

        $data = $request->all();

        // Procesar la imagen
        if ($request->hasFile('image')) {
            // Eliminar imagen anterior si existe
            if ($itemPreset->image) {
                Storage::disk('public')->delete($itemPreset->image);
            }
            $data['image'] = $request->file('image')->store('presets', 'public');
        }

        // Procesar configuración JSON
        if ($request->filled('configuration')) {
            $data['configuration'] = json_decode($request->configuration, true);
        }

        $itemPreset->update($data);

        return redirect()->route('admin.item-presets.index')
            ->with('success', 'Preset actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ItemPreset $itemPreset): RedirectResponse
    {
        // Eliminar imagen si existe
        if ($itemPreset->image) {
            Storage::disk('public')->delete($itemPreset->image);
        }

        $itemPreset->delete();

        return redirect()->route('admin.item-presets.index')
            ->with('success', 'Preset eliminado exitosamente.');
    }

    /**
     * Cambiar estado activo/inactivo
     */
    public function toggleStatus(ItemPreset $itemPreset): RedirectResponse
    {
        $itemPreset->update(['is_active' => !$itemPreset->is_active]);

        $status = $itemPreset->is_active ? 'activado' : 'desactivado';
        
        return redirect()->back()
            ->with('success', "Preset {$status} exitosamente.");
    }

    /**
     * Obtener presets por item (para AJAX)
     */
    public function getByItem(Item $item)
    {
        $presets = $item->activePresets;
        
        return response()->json($presets);
    }
}
