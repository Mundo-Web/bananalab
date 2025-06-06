<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Editor de Álbum - Prueba</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div class="min-h-screen">
        <div class="container mx-auto py-8 px-4">
            <h1 class="text-3xl font-bold text-center mb-8">Editor de Álbum - Prueba de Integración</h1>
            
            <!-- Formulario de prueba -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6 max-w-2xl mx-auto">
                <h2 class="text-xl font-semibold mb-4">Configuración</h2>
                
                <form id="editorForm" class="space-y-4">
                    <!-- Album ID -->
                    <div>
                        <label for="albumId" class="block text-sm font-medium mb-1">Album ID:</label>
                        <select id="albumId" name="albumId" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">Seleccionar álbum...</option>
                            @foreach(\App\Models\Album::take(10)->get() as $album)
                                <option value="{{ $album->id }}">{{ $album->id }} - {{ $album->title ?? 'Sin título' }}</option>
                            @endforeach
                        </select>
                        <p class="text-xs text-gray-500 mt-1">ID del álbum a editar</p>
                    </div>
                    
                    <!-- Item ID -->
                    <div>
                        <label for="itemId" class="block text-sm font-medium mb-1">Item ID:</label>
                        <select id="itemId" name="itemId" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">Seleccionar item...</option>
                            @foreach(\App\Models\Item::take(10)->get() as $item)
                                <option value="{{ $item->id }}">{{ $item->id }} - {{ $item->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    
                    <!-- Preset ID -->
                    <div>
                        <label for="presetId" class="block text-sm font-medium mb-1">Preset ID:</label>
                        <select id="presetId" name="presetId" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">Seleccionar preset...</option>
                            @foreach(\App\Models\ItemPreset::take(10)->get() as $preset)
                                <option value="{{ $preset->id }}">{{ $preset->id }} - {{ $preset->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    
                    <!-- Páginas -->
                    <div>
                        <label for="pages" class="block text-sm font-medium mb-1">Número de páginas:</label>
                        <input type="number" id="pages" name="pages" class="w-full px-3 py-2 border border-gray-300 rounded-md" 
                               value="10" min="1" max="50">
                    </div>
                    
                    <!-- Botones -->
                    <div class="flex gap-4">
                        <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                            Abrir Editor
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Iframe para vista previa del editor (opcional) -->
            <div id="previewContainer" class="hidden bg-white rounded-lg shadow-lg p-4">
                <h2 class="text-xl font-semibold mb-4">Vista Previa del Editor</h2>
                <div class="border border-gray-300 rounded-md overflow-hidden" style="height: 600px;">
                    <iframe id="editorPreview" width="100%" height="100%" frameborder="0"></iframe>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('editorForm');
            const previewContainer = document.getElementById('previewContainer');
            const editorPreview = document.getElementById('editorPreview');
            
            // Cuando el formulario se envía
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Recoger los valores del formulario
                const albumId = document.getElementById('albumId').value;
                const itemId = document.getElementById('itemId').value;
                const presetId = document.getElementById('presetId').value;
                const pages = document.getElementById('pages').value;
                
                // Validación básica
                if (!albumId || !itemId || !presetId || !pages) {
                    alert('Por favor completa todos los campos');
                    return;
                }
                
                // Construir URL para el editor
                const params = new URLSearchParams();
                params.append('albumId', albumId);
                params.append('itemId', itemId);
                params.append('presetId', presetId);
                params.append('pages', pages);
                
                const editorUrl = `/projects/bananalab/public/editor?${params.toString()}`;
                
                // Abrir en nueva pestaña
                window.open(editorUrl, '_blank');
                
                // O mostrar en iframe
                // previewContainer.classList.remove('hidden');
                // editorPreview.src = editorUrl;
            });
            
            // Auto-rellenar relaciones entre album, item y preset cuando se selecciona un álbum
            document.getElementById('albumId').addEventListener('change', function(e) {
                const albumId = e.target.value;
                if (!albumId) return;
                
                // Buscar el álbum actual para auto-rellenar item y preset
                const albums = @json(\App\Models\Album::with(['item', 'preset'])->take(10)->get());
                const selectedAlbum = albums.find(a => a.id == albumId);
                
                if (selectedAlbum) {
                    if (selectedAlbum.item_id) {
                        document.getElementById('itemId').value = selectedAlbum.item_id;
                    }
                    if (selectedAlbum.item_preset_id) {
                        document.getElementById('presetId').value = selectedAlbum.item_preset_id;
                    }
                }
            });
        });
    </script>
</body>
</html>
