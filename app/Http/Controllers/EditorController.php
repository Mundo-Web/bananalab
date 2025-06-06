<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Album;
use App\Models\ItemPreset;

class EditorController extends Controller
{
    /**
     * Muestra el editor de álbum.
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function show(Request $request)
    {
        // Validar los parámetros requeridos
        $request->validate([
            'albumId' => 'required|string',
            'itemId' => 'required|string',
            'presetId' => 'required|string',
            'pages' => 'sometimes|integer|min:1|max:100',
        ]);

        // Renderizar la vista con Inertia
        return Inertia::render('Editor', [
            'albumId' => $request->albumId,
            'itemId' => $request->itemId,
            'presetId' => $request->presetId,
            'pages' => $request->pages ?? 20,
        ]);
    }
}
