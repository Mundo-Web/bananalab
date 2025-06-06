// editor-test.js
// Este script simula el comportamiento del editor de álbumes

(function() {
    // Estado del editor
    let editorState = {
        albumData: null,
        presetData: null,
        pages: [],
        currentPage: 0,
        isLoading: true,
        loadError: null
    };
    
    // Función para obtener parámetros de la URL
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            albumId: params.get('albumId') || 'demo-album-123',
            itemId: params.get('itemId') || 'demo-item-456',
            presetId: params.get('presetId') || 'demo-preset-789',
            pages: parseInt(params.get('pages')) || 5
        };
    }
    
    // Función para cargar datos del álbum y preset
    async function loadAlbumData() {
        try {
            const params = getUrlParams();
            console.log('Editor params:', params);
            
            if (!params.albumId || !params.presetId) {
                throw new Error('Faltan parámetros requeridos');
            }

            // Cargar datos del álbum
            const albumResponse = await fetch(`/api/albums/${params.albumId}`);
            if (!albumResponse.ok) {
                throw new Error(`Error al cargar álbum: ${albumResponse.status}`);
            }
            
            const album = await albumResponse.json();
            editorState.albumData = album;
            
            // Cargar datos del preset
            const presetResponse = await fetch(`/api/item-presets/${params.presetId}`);
            if (!presetResponse.ok) {
                throw new Error(`Error al cargar preset: ${presetResponse.status}`);
            }
            
            const preset = await presetResponse.json();
            editorState.presetData = preset;
            
            // Crear páginas basadas en el preset
            createPagesFromPreset(preset, album, params.pages);
            
            // Marcar como cargado
            editorState.isLoading = false;
            
            // Renderizar la interfaz
            renderEditorUI();
            
        } catch (error) {
            console.error('Error loading album data:', error);
            editorState.loadError = error.message;
            editorState.isLoading = false;
            renderEditorUI();
        }
    }
    
    // Función para crear páginas basadas en el preset
    function createPagesFromPreset(preset, album, totalPages) {
        try {
            console.log('Creating pages from preset:', preset);
            const newPages = [];
            
            // 1. PÁGINA DE PORTADA (cover_image)
            const coverPage = {
                id: "page-cover",
                type: "cover",
                layout: "layout-1",
                cells: [{
                    id: "cell-cover-1",
                    elements: [
                        // Imagen base del preset
                        {
                            id: "cover-base",
                            type: "image",
                            content: `/storage/${preset.cover_image}`,
                            position: { x: 0, y: 0 },
                            size: { width: 100, height: 100 },
                            locked: true
                        },
                        // Imagen personalizada del álbum (si existe)
                        ...(album.cover_image_path ? [{
                            id: "cover-custom",
                            type: "image", 
                            content: `/storage/${album.cover_image_path}`,
                            position: { x: 10, y: 10 },
                            size: { width: 80, height: 80 }
                        }] : [])
                    ]
                }]
            };
            newPages.push(coverPage);

            // 2. PÁGINAS DE CONTENIDO (content_layer_image)
            for (let i = 1; i <= totalPages; i++) {
                const contentPage = {
                    id: `page-content-${i}`,
                    type: "content",
                    pageNumber: i,
                    layout: "layout-1",
                    cells: [{
                        id: `cell-content-${i}-1`,
                        elements: [
                            // Imagen base de contenido del preset
                            {
                                id: `content-base-${i}`,
                                type: "image",
                                content: `/storage/${preset.content_layer_image}`,
                                position: { x: 0, y: 0 },
                                size: { width: 100, height: 100 },
                                locked: true
                            }
                        ]
                    }]
                };
                newPages.push(contentPage);
            }

            // 3. PÁGINA FINAL/CONTRAPORTADA (final_layer_image)
            const finalPage = {
                id: "page-final",
                type: "final",
                layout: "layout-1", 
                cells: [{
                    id: "cell-final-1",
                    elements: [
                        // Imagen final del preset
                        {
                            id: "final-base",
                            type: "image",
                            content: `/storage/${preset.final_layer_image}`,
                            position: { x: 0, y: 0 },
                            size: { width: 100, height: 100 },
                            locked: true
                        }
                    ]
                }]
            };
            newPages.push(finalPage);

            console.log('Created pages:', newPages);
            editorState.pages = newPages;
            
        } catch (error) {
            console.error('Error creating pages:', error);
            throw error;
        }
    }
    
    // Función para obtener el título de la página actual
    function getCurrentPageTitle() {
        if (editorState.pages.length === 0) return "Cargando...";
        
        const page = editorState.pages[editorState.currentPage];
        if (!page) return "Página";
        
        switch (page.type) {
            case "cover":
                return "Portada";
            case "content":
                return `Página ${page.pageNumber}`;
            case "final":
                return "Contraportada";
            default:
                return `Página ${editorState.currentPage + 1}`;
        }
    }
    
    // Función para añadir una nueva página
    function addPage() {
        if (!editorState.presetData) return;
        
        // Encontrar el último número de página
        const contentPages = editorState.pages.filter(p => p.type === "content");
        const lastPageNumber = contentPages.length > 0 
            ? Math.max(...contentPages.map(p => p.pageNumber))
            : 0;
            
        const newPageNumber = lastPageNumber + 1;
        const newPageId = `page-content-${newPageNumber}`;
        
        const newPage = {
            id: newPageId,
            type: "content",
            pageNumber: newPageNumber,
            layout: "layout-1",
            cells: [{
                id: `cell-content-${newPageNumber}-1`,
                elements: [
                    {
                        id: `content-base-${newPageNumber}`,
                        type: "image",
                        content: `/storage/${editorState.presetData.content_layer_image}`,
                        position: { x: 0, y: 0 },
                        size: { width: 100, height: 100 },
                        locked: true
                    }
                ]
            }]
        };
        
        // Insertar antes de la página final
        const updatedPages = [...editorState.pages];
        const finalPageIndex = updatedPages.findIndex(p => p.type === "final");
        
        if (finalPageIndex > -1) {
            updatedPages.splice(finalPageIndex, 0, newPage);
        } else {
            updatedPages.push(newPage);
        }
        
        editorState.pages = updatedPages;
        
        // Navegar a la nueva página
        const newPageIndex = updatedPages.findIndex(p => p.id === newPageId);
        editorState.currentPage = newPageIndex;
        
        renderEditorUI();
    }
    
    // Función para eliminar la página actual
    function deleteCurrentPage() {
        if (editorState.pages.length <= 3) return; // Mínimo: portada + 1 contenido + final
        
        const currentPageData = editorState.pages[editorState.currentPage];
        
        // No permitir borrar portada ni contraportada
        if (currentPageData.type === "cover" || currentPageData.type === "final") {
            return;
        }
        
        const updatedPages = editorState.pages.filter((_, index) => index !== editorState.currentPage);
        editorState.pages = updatedPages;
        editorState.currentPage = Math.min(editorState.currentPage, updatedPages.length - 1);
        
        renderEditorUI();
    }
    
    // Cambiar la página actual
    function setCurrentPage(index) {
        if (index >= 0 && index < editorState.pages.length) {
            editorState.currentPage = index;
            renderEditorUI();
        }
    }
    
    // Renderizar la interfaz de usuario del editor
    function renderEditorUI() {
        const editorContainer = document.getElementById('editor-container');
        
        if (editorState.isLoading) {
            editorContainer.innerHTML = `
                <div class="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div class="bg-white p-8 rounded-lg shadow-lg text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <h2 class="text-xl font-semibold text-gray-800 mb-2">Cargando Editor</h2>
                        <p class="text-gray-600">Preparando tu álbum personalizado...</p>
                    </div>
                </div>
            `;
            return;
        }
        
        if (editorState.loadError) {
            editorContainer.innerHTML = `
                <div class="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div class="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                        <h2 class="text-xl font-semibold text-red-600 mb-2">Error</h2>
                        <p class="text-gray-600 mb-4">
                            ${editorState.loadError}
                        </p>
                        <div class="space-y-2">
                            <button 
                                onclick="window.location.reload()"
                                class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Reintentar
                            </button>
                            <button 
                                onclick="window.history.back()"
                                class="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                                Volver
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Renderizar el editor cargado
        const currentPageData = editorState.pages[editorState.currentPage];
        const pageTitle = getCurrentPageTitle();
        
        // Crear las miniaturas de páginas
        const pageThumbnails = editorState.pages.map((page, index) => {
            // Determinar el tipo de página para estilo y etiqueta
            let pageIcon = "";
            let pageColor = "bg-gray-100";
            let pageTitle = `Página ${index + 1}`;
            
            if (page.type === "cover") {
                pageIcon = "📖";
                pageColor = "bg-purple-100";
                pageTitle = "Portada";
            } else if (page.type === "content") {
                pageIcon = "📄";
                pageColor = "bg-blue-100";
                pageTitle = `Pág. ${page.pageNumber}`;
            } else if (page.type === "final") {
                pageIcon = "📚";
                pageColor = "bg-green-100";
                pageTitle = "Contraportada";
            }
            
            // Estilo para la página actualmente seleccionada
            const isActive = index === editorState.currentPage;
            const activeClass = isActive ? "border-purple-500 shadow-lg" : "border-transparent";
            
            return `
                <div
                    class="flex-shrink-0 w-40 p-4 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    onclick="window.editorApp.setCurrentPage(${index})"
                >
                    <div class="relative ${pageColor} h-48 rounded-md overflow-hidden border-2 transition-all ${activeClass}">
                        <div class="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
                            <span class="text-xs bg-white/90 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                ${pageIcon} ${pageTitle}
                            </span>
                            ${page.type === "content" ? `
                                <span class="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                    Editable
                                </span>
                            ` : ''}
                        </div>
                        <div class="w-full h-full flex items-center justify-center">
                            <div class="bg-white/40 text-center p-4 rounded">
                                <span>${pageTitle}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Renderizar la interfaz completa
        editorContainer.innerHTML = `
            <div class="bg-white">
                <div class="flex flex-col min-h-screen mx-auto max-w-[82rem]">
                    <!-- Header -->
                    <header class="border-b bg-white py-4 flex items-center justify-between px-6">
                        <div class="flex items-center gap-2">
                            <button class="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                                    <path d="m15 18-6-6 6-6"></path>
                                </svg>
                                Regresar
                            </button>
                        </div>
                        
                        <div class="text-center">
                            <h1 class="text-xl font-bold">Editar Álbum</h1>
                            <p class="text-sm text-gray-500">${editorState.albumData?.title || 'Mi álbum'}</p>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <button class="px-4 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                                Guardar
                            </button>
                        </div>
                    </header>
                    
                    <!-- Main content -->
                    <main class="flex-1 flex">
                        <!-- Canvas area -->
                        <div class="flex-1 p-6 bg-gray-50 flex items-center justify-center min-h-full">
                            <div class="bg-white shadow-lg overflow-hidden" style="width: 600px; height: 400px;">
                                <div class="flex items-center justify-center w-full h-full bg-gray-100 relative">
                                    <!-- Página actual simulada -->
                                    <div class="absolute inset-0 flex items-center justify-center ${currentPageData.type === 'cover' ? 'bg-purple-100' : currentPageData.type === 'final' ? 'bg-green-100' : 'bg-blue-100'}">
                                        <div class="text-center p-6 bg-white/50 rounded-lg">
                                            <h2 class="text-2xl font-bold">${pageTitle}</h2>
                                            <p class="text-gray-600">Tipo: ${currentPageData.type}</p>
                                            
                                            ${currentPageData.type === 'cover' ? 
                                                `<div class="mt-4 text-sm">Imagen base: ${editorState.presetData?.cover_image || 'N/A'}</div>` : 
                                                currentPageData.type === 'content' ? 
                                                `<div class="mt-4 text-sm">Imagen de contenido: ${editorState.presetData?.content_layer_image || 'N/A'}</div>` :
                                                `<div class="mt-4 text-sm">Imagen de contraportada: ${editorState.presetData?.final_layer_image || 'N/A'}</div>`
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Tools sidebar -->
                        <aside class="w-64 border-l bg-white p-4">
                            <div class="space-y-6">
                                <div>
                                    <h3 class="font-semibold mb-2">Herramientas</h3>
                                    <div class="grid grid-cols-3 gap-2">
                                        <button class="p-2 border rounded hover:bg-gray-50 flex flex-col items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                                                <circle cx="9" cy="9" r="2"></circle>
                                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                                            </svg>
                                            <span class="text-xs mt-1">Imagen</span>
                                        </button>
                                        <button class="p-2 border rounded hover:bg-gray-50 flex flex-col items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                                                <path d="M4 7V4h16v3"></path>
                                                <path d="M9 20h6"></path>
                                                <path d="M12 4v16"></path>
                                            </svg>
                                            <span class="text-xs mt-1">Texto</span>
                                        </button>
                                        <button class="p-2 border rounded hover:bg-gray-50 flex flex-col items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                                                <path d="M12 21a9 9 0 0 0 0-18"></path>
                                                <path d="M3 8a4.978 4.978 0 0 0-1 3v1a3 3 0 0 0 3 3"></path>
                                                <path d="M12 21a9 9 0 0 0 9-9"></path>
                                                <circle cx="19" cy="8" r="2"></circle>
                                                <circle cx="9" cy="8" r="2"></circle>
                                            </svg>
                                            <span class="text-xs mt-1">Forma</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </main>
                    
                    <!-- Footer - Page navigation -->
                    <aside class="max-w-5xl mt-6 mx-auto bg-white p-4 rounded-lg border">
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <h3 class="font-medium">Páginas</h3>
                                <div class="flex gap-2">
                                    <button
                                        class="p-1 rounded hover:bg-gray-100"
                                        onclick="window.editorApp.deleteCurrentPage()"
                                        title="Eliminar página"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            <line x1="10" x2="10" y1="11" y2="17"></line>
                                            <line x1="14" x2="14" y1="11" y2="17"></line>
                                        </svg>
                                    </button>
                                    <button
                                        class="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
                                        onclick="window.editorApp.addPage()"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                                            <path d="M5 12h14"></path>
                                            <path d="M12 5v14"></path>
                                        </svg>
                                        <span>Nueva página</span>
                                    </button>
                                </div>
                            </div>

                            <div class="flex overflow-x-auto gap-3 custom-scroll">
                                ${pageThumbnails}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        `;
    }
    
    // Inicialización
    function init() {
        // Crear un elemento raíz para el editor
        const editorRoot = document.createElement('div');
        editorRoot.id = 'editor-container';
        editorRoot.className = 'min-h-screen';
        document.body.appendChild(editorRoot);
        
        // Cargar datos del álbum y preset
        loadAlbumData();
        
        // Exponer métodos públicos
        window.editorApp = {
            addPage,
            deleteCurrentPage,
            setCurrentPage
        };
    }
    
    // Iniciar la aplicación
    init();
    
})();
