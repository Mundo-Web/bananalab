<?php

namespace App\Http\Controllers;

use App\Models\Album;
use App\Models\Item;
use App\Models\ItemPreset;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
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
            }            // Validar los datos
            $request->validate([
                'item_id' => 'required|string', // Cambié a string porque son UUIDs
                'item_preset_id' => 'required|string', // Cambié a string porque son UUIDs
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'pages' => 'required|integer|min:1', // Corregido el nombre del campo
                'cover_type' => 'required|string', // Corregido el nombre del campo
                'finish_type' => 'required|string', // Corregido el nombre del campo
                'cover_image' => 'nullable|file|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            ]);

            $user = Auth::user();
            $coverImagePath = null;

            // Procesar la imagen de portada si se proporciona
            if ($request->hasFile('cover_image')) {
                $coverImage = $request->file('cover_image');
                $uuid = Crypto::randomUUID();
                $ext = $coverImage->getClientOriginalExtension();
                $path = "albums/covers/{$uuid}.{$ext}";
                
                Storage::put($path, file_get_contents($coverImage));
                $coverImagePath = $path;
            }            // Crear el álbum
            $album = Album::create([
                'user_id' => $user->id,
                'item_id' => $request->item_id,
                'item_preset_id' => $request->item_preset_id,
                'title' => $request->title,
                'description' => $request->description,
                'cover_image_path' => $coverImagePath,
                'selected_pages' => $request->pages, // Corregido el nombre del campo
                'selected_cover_type' => $request->cover_type, // Corregido el nombre del campo
                'selected_finish' => $request->finish_type, // Corregido el nombre del campo
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
                ->where('uuid', $uuid)
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
            $response->message = $e->getMessage();        }

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
                    'item_preset_id' => 'test-preset-uuid',                'created_at' => now()->toISOString(),                'updated_at' => now()->toISOString()
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
    }

    /**
     * Get a specific item preset for testing (no auth required).
     * REMOVE IN PRODUCTION
     */
    public function getPresetForTesting(Request $request, $id)
    {
        $response = new Response();
        
        try {
            // Return a mock preset for testing
            $response->status = 200;
            $response->message = 'Preset de prueba';
            $response->data = [
                'id' => $id,
                'uuid' => is_numeric($id) ? 'test-preset-' . $id : $id,
                'name' => 'Preset de Prueba #' . $id,
                'description' => 'Descripción del preset de prueba',
                'cover_image' => 'https://picsum.photos/800/600?random=1',
                'content_layer_image' => 'https://picsum.photos/800/600?random=2', 
                'final_layer_image' => 'https://picsum.photos/800/600?random=3',
                'layout_config' => [
                    'width' => 800,
                    'height' => 600,
                    'margins' => [20, 20, 20, 20],
                    'photo_zones' => [
                        [
                            'id' => 'zone-1',
                            'x' => 50,
                            'y' => 50,
                            'width' => 300,
                            'height' => 200,
                            'type' => 'photo'
                        ],
                        [
                            'id' => 'zone-2', 
                            'x' => 400,
                            'y' => 50,
                            'width' => 300,
                            'height' => 200,
                            'type' => 'photo'
                        ]
                    ],
                    'text_zones' => [
                        [
                            'id' => 'text-1',
                            'x' => 50,
                            'y' => 300,
                            'width' => 650,
                            'height' => 100,
                            'type' => 'text',
                            'placeholder' => 'Añade tu texto aquí...'
                        ]
                    ]
                ],
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString()
            };

        } catch (Exception $e) {
            $response->status = 400;
            $response->message = $e->getMessage();
        }

        return response($response->toArray(), $response->status);
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
                'Cache-Control' => 'public, max-age=31536000', // Cache por 1 año
            ]);

        } catch (\Throwable $th) {
            // Retornar imagen por defecto o 404
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
}
