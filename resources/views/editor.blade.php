<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Editor de Álbum - BananaLab</title>
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Estilos adicionales para el editor -->
    <style>
        .editor-container {
            position: relative;
            width: 100%;
            height: 100vh;
            overflow: hidden;
        }
        
        .editor-frame {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        
        .load-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }
        
        .spinner {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 6px solid #f3f3f3;
            border-top: 6px solid #9333ea;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .nav-bar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background-color: rgba(255, 255, 255, 0.95);
            border-bottom: 1px solid #e5e7eb;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 20;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .editor-content {
            padding-top: 60px;
            height: 100vh;
        }
    </style>
</head>
<body class="bg-white">
    <!-- Barra de navegación -->
    <div class="nav-bar">
        <div class="flex items-center space-x-4">
            <a href="/test-editor" class="flex items-center">
                <span class="text-xl font-bold text-purple-800">📖 BananaLab</span>
            </a>
            <span class="text-sm font-medium text-gray-500">Editor de Álbum</span>
        </div>
        <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500">
                ID: {{ $albumId }}
            </span>
            <a href="/test-editor" class="px-4 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md">
                Volver
            </a>
        </div>
    </div>

    <!-- Contenedor del editor -->
    <div class="editor-container">
        <!-- Overlay de carga -->
        <div id="loadOverlay" class="load-overlay">
            <div class="spinner"></div>
            <h2 class="text-xl font-semibold text-gray-700 mb-2">Cargando Editor</h2>
            <p class="text-gray-500">Preparando tu álbum personalizado...</p>
        </div>
        
        <!-- Contenido iframe -->
        <div class="editor-content">
            <div id="editorContainer"></div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const params = {
                albumId: "{{ $albumId }}",
                itemId: "{{ $itemId }}",
                presetId: "{{ $presetId }}",
                pages: {{ $pages }}
            };
            
            // Función para iniciar el editor
            function initEditor() {
                const container = document.getElementById('editorContainer');
                
                // Aquí normalmente cargaríamos el componente React
                // Pero para esta prueba, mostraremos un simulador
                
                // Simular carga del editor
                setTimeout(() => {
                    document.getElementById('loadOverlay').style.display = 'none';
                    
                    // Crear contenido del editor simulado
                    container.innerHTML = `
                        <div class="min-h-screen bg-gray-50 p-6">
                            <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                                <div class="p-4 bg-purple-100 border-b">
                                    <h2 class="text-xl font-bold">Editor de Álbum</h2>
                                    <p class="text-gray-600">Simulación del editor con parámetros reales</p>
                                </div>
                                <div class="p-6">
                                    <h3 class="text-lg font-semibold mb-4">Parámetros cargados:</h3>
                                    <div class="bg-gray-50 p-4 rounded-lg mb-6 font-mono text-sm">
                                        <p><span class="text-purple-600">albumId:</span> ${params.albumId}</p>
                                        <p><span class="text-purple-600">itemId:</span> ${params.itemId}</p>
                                        <p><span class="text-purple-600">presetId:</span> ${params.presetId}</p>
                                        <p><span class="text-purple-600">pages:</span> ${params.pages}</p>
                                    </div>
                                    
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <h4 class="font-medium mb-2">Estructura de páginas:</h4>
                                        <ul class="list-disc list-inside space-y-1 text-sm">
                                            <li><span class="font-semibold">Página 1:</span> Portada (cover_image)</li>
                                            ${Array.from({length: params.pages}).map((_, i) => 
                                                `<li><span class="font-semibold">Página ${i + 2}:</span> Contenido (content_layer_image)</li>`
                                            ).join('')}
                                            <li><span class="font-semibold">Página ${Number(params.pages) + 2}:</span> Contraportada (final_layer_image)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                                <div class="p-4 bg-blue-100 border-b">
                                    <h2 class="text-xl font-bold">Test de APIs</h2>
                                </div>
                                <div class="p-6">
                                    <div class="space-y-4">
                                        <button id="testAlbumApi" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                            Probar API de álbum
                                        </button>
                                        <button id="testPresetApi" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                                            Probar API de preset
                                        </button>
                                    </div>
                                    <div id="apiResults" class="mt-4 p-4 bg-gray-50 rounded min-h-[100px] font-mono text-sm"></div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Agregar controladores de eventos para botones de prueba API
                    document.getElementById('testAlbumApi').addEventListener('click', async () => {
                        const results = document.getElementById('apiResults');
                        results.innerHTML = 'Cargando datos del álbum...';
                        
                        try {
                            const response = await fetch(`/api/albums/${params.albumId}`);
                            const data = await response.json();
                            results.innerHTML = `<span class="text-green-600">✓ Éxito</span>\n${JSON.stringify(data, null, 2)}`;
                        } catch (error) {
                            results.innerHTML = `<span class="text-red-600">✗ Error</span>\n${error.message}`;
                        }
                    });
                    
                    document.getElementById('testPresetApi').addEventListener('click', async () => {
                        const results = document.getElementById('apiResults');
                        results.innerHTML = 'Cargando datos del preset...';
                        
                        try {
                            const response = await fetch(`/api/item-presets/${params.presetId}`);
                            const data = await response.json();
                            results.innerHTML = `<span class="text-green-600">✓ Éxito</span>\n${JSON.stringify(data, null, 2)}`;
                        } catch (error) {
                            results.innerHTML = `<span class="text-red-600">✗ Error</span>\n${error.message}`;
                        }
                    });
                    
                }, 1500);
            }
            
            // Iniciar el editor
            initEditor();
        });
    </script>
</body>
</html>
