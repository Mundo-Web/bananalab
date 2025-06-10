<?php

namespace App\Http\Controllers;

use App\Models\Album;
use App\Models\Item;
use App\Models\ItemPreset;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Crypto;
use SoDe\Extend\Response;

class AlbumController extends Controller
{
    /**
     * Store a newly created album in storage.
     */
    public function store(Request $request)
    {
        $response = new Response();
        
        try {
            // Verificar que el usuario esté autenticado
            if (!Auth::check()) {
                $response->status = 401;
                $response->message = 'Debes iniciar sesión para guardar un álbum';
                return response($response->toArray(), $response->status);
            }

            // Validar los datos
            $request->validate([
                'item_id' => 'required|string',
                'item_preset_id' => 'required|string',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'pages' => 'required|integer|min:1',
                'cover_type' => 'required|string',
                'finish_type' => 'required|string',
                'cover_image' => 'nullable|file|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            ]);

            $user = Auth::user();
            $coverImagePath = null;

            // Procesar la imagen de portada si se proporciona
            if ($request->hasFile('cover_image')) {
                $coverImage = $request->file('cover_image');
                $uuid = Crypto::randomUUID();
                $ext = $coverImage->getClientOriginalExtension();
                $path = "images/albums/covers/{$uuid}.{$ext}";
                
                Storage::put($path, file_get_contents($coverImage));
                $coverImagePath = "{$uuid}.{$ext}";
            }

            // Crear el álbum
            $album = Album::create([
                'user_id' => $user->id,
                'item_id' => $request->item_id,
                'item_preset_id' => $request->item_preset_id,
                'title' => $request->title,
                'description' => $request->description,
                'cover_image_path' => $coverImagePath,
                'selected_pages' => $request->pages,
                'selected_cover_type' => $request->cover_type,
                'selected_finish' => $request->finish_type,
                'custom_options' => $request->custom_options ?? [],
                'status' => 'saved',
            ]);

            $response->status = 201;
            $response->message = 'Álbum guardado exitosamente';
            $response->data = [
                'album' => $album->load(['item', 'itemPreset']),
            ];

        } catch (Exception $e) {
            $response->status = 400;
            $response->message = $e->getMessage();
        }

        return response($response->toArray(), $response->status);
    }

    /**
     * Get the user's albums.
     */
    public function index(Request $request)
    {
        $response = new Response();
        
        try {
            // Verificar que el usuario esté autenticado
            if (!Auth::check()) {
                $response->status = 401;
                $response->message = 'Debes iniciar sesión para ver tus álbumes';
                return response($response->toArray(), $response->status);
            }

            $user = Auth::user();
            $albums = Album::with(['item', 'itemPreset'])
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            $response->status = 200;
            $response->message = 'Álbumes obtenidos exitosamente';
            $response->data = $albums;

        } catch (Exception $e) {
            $response->status = 400;
            $response->message = $e->getMessage();
        }

        return response($response->toArray(), $response->status);
    }

    /**
     * Get a specific album.
     */
    public function show(Request $request, $uuid)
    {
        $response = new Response();
        
        try {
            // Verificar que el usuario esté autenticado
            if (!Auth::check()) {
                $response->status = 401;
                $response->message = 'Debes iniciar sesión para ver este álbum';
                return response($response->toArray(), $response->status);
            }

            $user = Auth::user();
            $album = Album::with(['item', 'itemPreset'])
                ->where('id', $uuid)
                ->where('user_id', $user->id)
                ->first();

            if (!$album) {
                $response->status = 404;
                $response->message = 'Álbum no encontrado';
                return response($response->toArray(), $response->status);
            }

            $response->status = 200;
            $response->message = 'Álbum obtenido exitosamente';
            $response->data = $album;

        } catch (Exception $e) {
            $response->status = 400;
            $response->message = $e->getMessage();
        }

        return response($response->toArray(), $response->status);
    }

    /**
     * Get a specific album for testing (no auth required).
     * REMOVE IN PRODUCTION
     */
    public function showForTesting(Request $request, $id)
    {
        $response = new Response();
        
        try {
            // Try to find by ID or UUID
            $album = Album::where('id', $id)->orWhere('uuid', $id)->first();

            if (!$album) {
                // Return a mock album for testing
                $response->status = 200;
                $response->message = 'Álbum de prueba';
                $response->data = [
                    'id' => $id,
                    'uuid' => is_numeric($id) ? 'test-album-' . $id : $id,
                    'title' => 'Álbum de Prueba #' . $id,
                    'description' => 'Descripción del álbum de prueba',
                    'cover_image_path' => 'albums/test-cover.jpg',
                    'user_id' => 1,
                    'item_id' => 'test-item-uuid',
                    'item_preset_id' => 'test-preset-uuid',
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString()
                ];
            } else {
                $response->status = 200;
                $response->message = 'Álbum obtenido exitosamente';
                $response->data = $album;
            }

        } catch (Exception $e) {
            $response->status = 400;
            $response->message = $e->getMessage();
        }

        return response($response->toArray(), $response->status);
    }    /**
     * Get preset for testing - simple version
     */
    public function getPresetForTestingSimple(Request $request, $id)
    {
        return response([
            'status' => 200,
            'message' => 'Preset de prueba',
            'data' => [
                'id' => $id,
                'uuid' => 'test-preset-' . $id,
                'name' => 'Preset de Prueba #' . $id,
                'description' => 'Preset para testing',
                'cover_image' => 'https://picsum.photos/800/600?random=1',
                'content_layer_image' => 'https://picsum.photos/800/600?random=2', 
                'final_layer_image' => 'https://picsum.photos/800/600?random=3',
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString()
            ]
        ], 200);
    }

    /**
     * Serve cover image.
     */
    public function coverImage($uuid)
    {
        try {
            $album = Album::where('uuid', $uuid)->first();
            
            if (!$album || !$album->cover_image_path) {
                throw new Exception('Imagen no encontrada');
            }

            $content = Storage::get($album->cover_image_path);
            if (!$content) {
                throw new Exception('Imagen no encontrada');
            }

            return response($content, 200, [
                'Content-Type' => 'application/octet-stream',
                'Cache-Control' => 'public, max-age=31536000',
            ]);

        } catch (\Throwable $th) {
            return response('', 404);
        }
    }

    /**
     * Check if user is authenticated.
     */
    public function checkAuth()
    {
        $response = new Response();
        
        try {
            if (Auth::check()) {
                $response->status = 200;
                $response->message = 'Usuario autenticado';
                $response->data = [
                    'user' => Auth::user(),
                    'authenticated' => true,
                ];
            } else {
                $response->status = 401;
                $response->message = 'Usuario no autenticado';
                $response->data = [
                    'authenticated' => false,
                ];
            }

        } catch (Exception $e) {
            $response->status = 400;
            $response->message = $e->getMessage();
        }

        return response($response->toArray(), $response->status);
    }

    /**
     * Finalize album design and save design data.
     */
    public function finalizeDesign(Request $request, $uuid)
    {
        $response = new Response();
        
        try {
            // Verificar que el usuario esté autenticado
            if (!Auth::check()) {
                $response->status = 401;
                $response->message = 'Debes iniciar sesión para finalizar el diseño';
                return response($response->toArray(), $response->status);
            }

            $user = Auth::user();
            $album = Album::where('id', $uuid)
                ->where('user_id', $user->id)
                ->first();

            if (!$album) {
                $response->status = 404;
                $response->message = 'Álbum no encontrado';
                return response($response->toArray(), $response->status);
            }

            // Validar los datos del diseño
            $request->validate([
                'design_data' => 'required|array',
            ]);

            $designData = $request->design_data;
            
            // Verificar el tamaño de los datos antes de procesarlos
            $rawJsonSize = strlen(json_encode($designData));
            $sizeMB = round($rawJsonSize / (1024 * 1024), 2);
            
            Log::info("Procesando diseño de álbum {$uuid}. Tamaño: {$sizeMB} MB");

            // Si los datos son muy grandes, intentar comprimirlos
            $finalData = $designData;
            if ($rawJsonSize > 50 * 1024 * 1024) { // Más de 50MB
                $response->status = 413;
                $response->message = "El diseño es demasiado complejo ({$sizeMB} MB). Simplifique las imágenes y vuelva a intentar.";
                return response($response->toArray(), $response->status);
            }

            // Procesar y optimizar los datos del diseño
            if (isset($finalData['pages']) && is_array($finalData['pages'])) {
                foreach ($finalData['pages'] as &$page) {
                    if (isset($page['cells']) && is_array($page['cells'])) {
                        foreach ($page['cells'] as &$cell) {
                            if (isset($cell['elements']) && is_array($cell['elements'])) {
                                foreach ($cell['elements'] as &$element) {
                                    // Para elementos con imágenes base64, guardar solo metadatos
                                    if (isset($element['content']) && 
                                        is_string($element['content']) && 
                                        strpos($element['content'], 'data:image/') === 0) {
                                        
                                        // Guardar metadatos de la imagen
                                        $element['contentType'] = 'base64_image';
                                        $element['originalSize'] = strlen($element['content']);
                                        $element['contentHash'] = substr(md5($element['content']), 0, 16);
                                        
                                        // Reemplazar el contenido con un placeholder
                                        $element['content'] = '[BASE64_IMAGE_PLACEHOLDER]';
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Volver a verificar el tamaño después de la optimización
            $optimizedJsonSize = strlen(json_encode($finalData));
            $optimizedSizeMB = round($optimizedJsonSize / (1024 * 1024), 2);
            
            Log::info("Diseño optimizado para álbum {$uuid}. Tamaño final: {$optimizedSizeMB} MB");

            if ($optimizedJsonSize > 100 * 1024 * 1024) { // Más de 100MB incluso después de optimizar
                $response->status = 413;
                $response->message = "El diseño sigue siendo demasiado grande después de optimizar ({$optimizedSizeMB} MB).";
                return response($response->toArray(), $response->status);
            }

            // Guardar el diseño finalizado usando transacción
            DB::transaction(function () use ($album, $finalData) {
                $album->design_data = json_encode($finalData);
                $album->design_finalized_at = now();
                $album->status = 'finalized';
                $album->save();
            });

            $response->status = 200;
            $response->message = 'Diseño finalizado exitosamente';
            $response->data = [
                'album_id' => $album->id,
                'uuid' => $album->uuid,
                'status' => $album->status,
                'finalized_at' => $album->design_finalized_at,
                'design_size_mb' => $optimizedSizeMB
            ];

        } catch (\Illuminate\Database\QueryException $e) {
            Log::error("Error de base de datos al finalizar diseño: " . $e->getMessage());
            
            if (strpos($e->getMessage(), 'max_allowed_packet') !== false) {
                $response->status = 413;
                $response->message = 'El diseño es demasiado grande para ser guardado. Intente simplificar las imágenes.';
            } else {
                $response->status = 500;
                $response->message = 'Error de base de datos al guardar el diseño.';
            }
            
        } catch (\Exception $e) {
            Log::error("Error al finalizar diseño: " . $e->getMessage());
            $response->status = 400;
            $response->message = $e->getMessage();
        }

        return response($response->toArray(), $response->status);
    }
}
