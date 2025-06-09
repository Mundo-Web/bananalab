import { useState, useRef, useCallback, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import LayerPanel from "./components/Elements/LayerPanel";
import {
    Undo2,
    Redo2,
    Trash2,
    ChevronLeft,
    ImageIcon,
    Type,
    Eye,
    Plus,
    FlipHorizontal,
    FlipVertical,
    Copy,
    Book,
    Lock,
    Pencil,
} from "lucide-react";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { layouts } from "./constants/layouts";
import { imageMasks } from "./constants/masks";
import { filterPresets } from "./constants/filters";
import Button from "./components/UI/Button";

import Slider from "./components/UI/Slider";
import EditableCell from "./components/Elements/EditableCell";
import LayoutSelector from "./components/Elements/LayoutSelector";
import { AdvancedSettings } from "./components/Editor/AdvancedSettings";
import { FilterPresets } from "./components/Editor/FilterPresets";
import { FilterControls } from "./components/Editor/FilterControls";
import { MaskSelector } from "./components/Elements/MaskSelector";
import TextToolbar from "./components/Elements/TextToolbar";
import WorkspaceControls from "./components/Elements/WorkspaceControls";
import BookPreviewModal from "./components/Editor/BookPreview";
import Global from "../../../Utils/Global";

// Componente principal del editor
export default function EditorLibro({ albumId, itemId, presetId, pages: initialPages }) {
    // Estados para el álbum y preset
    const [albumData, setAlbumData] = useState(null);
    const [presetData, setPresetData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Estado inicial de páginas - se actualizará cuando carguemos el preset
    const [pages, setPages] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const [activeTab, setActiveTab] = useState("elements");
    const [filterTab, setFilterTab] = useState("basic");
    const [history, setHistory] = useState([JSON.stringify(pages)]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [previewMode, setPreviewMode] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [pageThumbnails, setPageThumbnails] = useState({});
    // Añade estos estados al principio del componente EditorLibro
    const [textToolbarVisible, setTextToolbarVisible] = useState(false);
    const [textEditingOptions, setTextEditingOptions] = useState({
        elementId: null,
        cellId: null,
    });
    const [isBookPreviewOpen, setIsBookPreviewOpen] = useState(false);

    // Función para obtener parámetros del componente o de la URL como fallback
    const getParams = () => {
        // Si se proporcionaron props, usarlos
        if (albumId && itemId && presetId) {
            return {
                albumId,
                itemId,
                presetId,
                pages: initialPages || 20
            };
        }

        // Fallback: obtener de la URL
        const params = new URLSearchParams(window.location.search);
        return {
            albumId: params.get('album'),
            itemId: params.get('item'),
            presetId: params.get('preset'),
            pages: parseInt(params.get('pages')) || 20
        };
    };

    // Función para cargar datos del álbum y preset
    const loadAlbumData = async () => {
        try {
            setIsLoading(true);
            setLoadError(null);
            const params = getParams();

            console.log('🔍 Editor params:', params);

            if (!params.albumId || !params.presetId) {
                throw new Error('Faltan parámetros requeridos: albumId y presetId');
            }


            // Determinar la URL base correcta
            const baseUrl = window.location.origin.includes('bananalab')
                ? '/projects/bananalab/public'
                : '';

            // Siempre usar los endpoints REALES para traer datos de la base de datos
            const albumEndpoint = `${baseUrl}/api/albums/${params.albumId}`;
            const presetEndpoint = `${baseUrl}/api/item-presets/${params.presetId}`;

            console.log('🌐 Using endpoints:', { albumEndpoint, presetEndpoint, baseUrl });

            // Cargar datos del álbum
            console.log('📚 Cargando álbum...');
            const albumResponse = await fetch(albumEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            console.log('📚 Album response status:', albumResponse.status);

            if (!albumResponse.ok) {
                const errorText = await albumResponse.text();
                console.error('❌ Album response error:', errorText);
                throw new Error(`Error al cargar álbum: ${albumResponse.status} ${albumResponse.statusText}`);
            }

            const albumResponseData = await albumResponse.json();
            console.log('✅ Album response data:', albumResponseData);

            // Extraer datos del álbum (puede estar en .data o directamente en la respuesta)
            const album = albumResponseData.data || albumResponseData;
            console.log('📚 Album loaded:', album);
            setAlbumData(album);

            // Cargar datos del preset
            console.log('🎨 Cargando preset...');
            const presetResponse = await fetch(presetEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            console.log('🎨 Preset response status:', presetResponse.status);

            if (!presetResponse.ok) {
                const errorText = await presetResponse.text();
                console.error('❌ Preset response error:', errorText);
                throw new Error(`Error al cargar preset: ${presetResponse.status} ${presetResponse.statusText}`);
            }

            const presetResponseData = await presetResponse.json();
            console.log('✅ Preset response data:', presetResponseData);

            // Extraer datos del preset (puede estar en .data o directamente en la respuesta)
            const preset = presetResponseData.data || presetResponseData;
            console.log('🎨 Preset loaded:', preset);
            setPresetData(preset);

            // Crear páginas basadas en el preset y álbum
            console.log('📄 Creando páginas...');
            await createPagesFromPreset(preset, album, params.pages);

        } catch (error) {
            console.error('💥 Error loading album data:', error);
            setLoadError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para crear páginas basadas en el preset
    const createPagesFromPreset = (preset, album, totalPages) => {
        try {
            console.log('Creating pages from preset:', preset);
            console.log('Album data:', album);
            console.log('Total pages requested:', totalPages);

            const newPages = [];

            // Validar que el preset tenga las imágenes necesarias
            if (!preset.cover_image || !preset.content_layer_image || !preset.final_layer_image) {
                throw new Error('El preset no tiene todas las imágenes requeridas');
            }

            // Función helper para obtener la URL correcta de la imagen
            const getImageUrl = (imagePath) => {
                if (imagePath.startsWith('http')) {
                    return imagePath; // URL externa (datos de prueba)
                }
                return imagePath.startsWith('/storage/') ? imagePath : `/storage/${imagePath}`;
            };
            console.log(preset)
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
                            content: `/storage/images/item_preset/${preset.cover_image}`,
                            position: { x: 0, y: 0 },
                            size: { width: 100, height: 100 },
                            filters: {},
                            mask: "none",
                            zIndex: 1,
                            locked: true // No editable
                        },
                        // Imagen personalizada del álbum (si existe)
                        ...(album.cover_image_path ? [{
                            id: "cover-custom",
                            type: "image",
                            content: `/storage/images/albums/covers/${album.cover_image_path}`,
                            position: { x: 10, y: 10 },
                            size: { width: 80, height: 80 },
                            filters: {},
                            mask: "none",
                            zIndex: 2
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
                                content: `/storage/images/item_preset/${preset.content_layer_image}`,
                                position: { x: 0, y: 0 },
                                size: { width: 100, height: 100 },
                                filters: {},
                                mask: "none",
                                zIndex: 1,
                                locked: true // Base no editable
                            }
                            // Aquí el usuario podrá agregar más elementos
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
                            content: `/storage/images/item_preset/${preset.final_layer_image}`,
                            position: { x: 0, y: 0 },
                            size: { width: 100, height: 100 },
                            filters: {},
                            mask: "none",
                            zIndex: 1,
                            locked: true // No editable
                        }
                    ]
                }]
            };

            newPages.push(finalPage);

            console.log('✅ Created pages:', newPages);
            setPages(newPages);
            setCurrentPage(0); // Empezar en la portada

            // Si hay canvas_config en el preset, cambiar automáticamente a "preset"
            if (preset.canvas_config) {
                console.log('📐 Canvas config found, setting workspace to preset dimensions');
                setWorkspaceSize("preset");
            }

        } catch (error) {
            console.error('❌ Error creating pages:', error);
            throw error;
        }
    };

    // Efecto para cargar datos al montar el componente
    useEffect(() => {
        loadAlbumData();
    }, []);

    // Función para obtener el título de la página actual
    const getCurrentPageTitle = () => {
        if (pages.length === 0) return "Cargando...";

        const page = pages[currentPage];
        if (!page) return "Página";

        switch (page.type) {
            case "cover":
                return "Portada";
            case "content":
                return `Página ${page.pageNumber}`;
            case "final":
                return "Contraportada";
            default:
                return `Página ${currentPage + 1}`;
        }
    };

    // Función para verificar si la página actual es editable
    const isCurrentPageEditable = () => {
        if (pages.length === 0) return false;
        const page = pages[currentPage];
        // La portada y contraportada tienen elementos bloqueados, pero se pueden agregar elementos
        return page?.type === "content";
    };

    // Modifica la función getSelectedElement para que use useCallback
    const getSelectedElement = useCallback(() => {
        if (!selectedElement || !selectedCell || pages.length === 0) return null;

        const currentPageData = pages[currentPage];
        if (!currentPageData) return null;

        const cell = currentPageData.cells.find(
            (cell) => cell.id === selectedCell
        );
        if (!cell) return null;
        return cell.elements.find((el) => el.id === selectedElement);
    }, [selectedElement, selectedCell, pages, currentPage]);

    // Añade esta función para manejar la selección de elementos
    const handleSelectElement = (elementId, cellId) => {
        // Verificar si el elemento está bloqueado
        if (cellId) {
            const cell = pages[currentPage].cells.find(cell => cell.id === cellId);
            const element = cell?.elements.find(el => el.id === elementId);

            if (element?.locked) {
                console.log('Elemento bloqueado, no se puede seleccionar');
                // Mostrar mensaje temporal (opcional)
                const message = document.createElement('div');
                message.className = 'fixed top-4 right-4 bg-amber-100 border border-amber-400 text-amber-700 px-4 py-2 rounded-lg z-50';
                message.textContent = 'Este elemento es parte del diseño base y no se puede editar';
                document.body.appendChild(message);
                setTimeout(() => {
                    if (document.body.contains(message)) {
                        document.body.removeChild(message);
                    }
                }, 3000);
                return;
            }
        }

        // Siempre actualizar la celda seleccionada si se proporciona
        if (cellId) {
            setSelectedCell(cellId);
        }

        // Actualizar el elemento seleccionado
        setSelectedElement(elementId);

        // Manejo del toolbar
        if (elementId) {
            const cell = pages[currentPage].cells.find(
                (cell) => cell.id === (cellId || selectedCell)
            );
            const element = cell?.elements.find((el) => el.id === elementId);

            if (element?.type === "image") {
                setSelectedImage(element);
                console.log(selectedImage);
            } else if (element?.type === "text") {
                setTextToolbarVisible(true);
                setTextEditingOptions({
                    elementId,
                    cellId: cellId || selectedCell,
                });
            } else {
                setTextToolbarVisible(false);
            }
        } else {
            setTextToolbarVisible(false);
            setSelectedImage(null);
        }
    };

    // Obtener el layout actual
    const getCurrentLayout = () => {
        if (pages.length === 0) return layouts[0];

        const currentPageData = pages[currentPage];
        if (!currentPageData) return layouts[0];

        return (
            layouts.find((layout) => layout.id === currentPageData.layout) ||
            layouts[0]
        );
    };

    // Actualizar el estado de las páginas
    const updatePages = (newPages) => {
        setPages(newPages);
        // Actualizar el historial
        const newHistory = [
            ...history.slice(0, historyIndex + 1),
            JSON.stringify(newPages),
        ];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // Cambiar el layout de la página actual
    const changeLayout = (layoutId) => {
        const selectedLayout = layouts.find((l) => l.id === layoutId);
        if (!selectedLayout) return;

        const updatedPages = [...pages];
        const currentPageData = updatedPages[currentPage];

        // Crear nuevas celdas basadas en el layout seleccionado
        const newCells = Array.from({ length: selectedLayout.cells }).map(
            (_, index) => {
                const existingCell = currentPageData.cells[index];
                return (
                    existingCell || {
                        id: `cell-${currentPageData.id}-${index + 1}`,
                        elements: [],
                    }
                );
            }
        );

        updatedPages[currentPage] = {
            ...currentPageData,
            layout: layoutId,
            cells: newCells,
        };

        updatePages(updatedPages);
        setSelectedElement(null);
        setSelectedCell(null);
    };

    // Añadir una nueva página de contenido
    const addPage = () => {
        if (!presetData) return;

        // Encontrar el último número de página de contenido
        const contentPages = pages.filter(p => p.type === "content");
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
                    // Imagen base de contenido del preset
                    {
                        id: `content-base-${newPageNumber}`,
                        type: "image",
                        content: `/storage/${presetData.content_layer_image}`,
                        position: { x: 0, y: 0 },
                        size: { width: 100, height: 100 },
                        filters: {},
                        mask: "none",
                        zIndex: 1,
                        locked: true // Base no editable
                    }
                ]
            }]
        };

        // Insertar antes de la página final
        const updatedPages = [...pages];
        const finalPageIndex = updatedPages.findIndex(p => p.type === "final");

        if (finalPageIndex > -1) {
            updatedPages.splice(finalPageIndex, 0, newPage);
        } else {
            updatedPages.push(newPage);
        }

        updatePages(updatedPages);

        // Navegar a la nueva página
        const newPageIndex = updatedPages.findIndex(p => p.id === newPageId);
        setCurrentPage(newPageIndex);
    };

    // Eliminar la página actual (solo páginas de contenido)
    const deleteCurrentPage = () => {
        if (pages.length <= 3) return; // Mínimo: portada + 1 contenido + final

        const currentPageData = pages[currentPage];

        // No permitir borrar portada ni contraportada
        if (currentPageData.type === "cover" || currentPageData.type === "final") {
            console.log('No se puede eliminar la portada o contraportada');
            return;
        }

        // Confirmar eliminación
        if (!confirm(`¿Estás seguro de eliminar la ${currentPageData.type === "content" ? `página ${currentPageData.pageNumber}` : "página"}?`)) {
            return;
        }

        const updatedPages = pages.filter((_, index) => index !== currentPage);
        updatePages(updatedPages);
        setCurrentPage(Math.min(currentPage, updatedPages.length - 1));
    };

    // Duplicar la página actual (solo páginas de contenido)
    const duplicateCurrentPage = () => {
        const currentPageData = pages[currentPage];

        // Solo duplicar páginas de contenido
        if (currentPageData.type !== "content") {
            console.log('Solo se pueden duplicar páginas de contenido');
            return;
        }

        // Crear una copia de la página actual
        const lastPageNumber = Math.max(...pages.filter(p => p.type === "content").map(p => p.pageNumber));
        const newPageNumber = lastPageNumber + 1;

        const newPage = {
            ...JSON.parse(JSON.stringify(currentPageData)),
            id: `page-content-${newPageNumber}`,
            pageNumber: newPageNumber,
            cells: currentPageData.cells.map(cell => ({
                ...cell,
                id: `cell-content-${newPageNumber}-${cell.id.split('-').pop()}`,
                elements: cell.elements.map(element => ({
                    ...element,
                    id: `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                }))
            }))
        };

        // Insertar antes de la página final
        const updatedPages = [...pages];
        const finalPageIndex = updatedPages.findIndex(p => p.type === "final");

        if (finalPageIndex > -1) {
            updatedPages.splice(finalPageIndex, 0, newPage);
        } else {
            updatedPages.push(newPage);
        }

        updatePages(updatedPages);

        // Navegar a la nueva página
        const newPageIndex = updatedPages.findIndex(p => p.id === newPage.id);
        setCurrentPage(newPageIndex);
    };

    // Añadir un elemento a una celda
    const addElementToCell = (cellId, element) => {
        const updatedPages = [...pages];
        const cellIndex = updatedPages[currentPage].cells.findIndex(
            (cell) => cell.id === cellId
        );

        if (cellIndex !== -1) {
            updatedPages[currentPage].cells[cellIndex].elements.push(element);
            updatePages(updatedPages);
            setSelectedElement(element.id);
            setSelectedCell(cellId);
        }
    };

    // Actualizar un elemento en una celda
    const updateElementInCell = (
        cellId,
        elementId,
        updates,
        isDuplicate = false
    ) => {
        const updatedPages = [...pages];
        const cellIndex = updatedPages[currentPage].cells.findIndex(
            (cell) => cell.id === cellId
        );

        if (cellIndex !== -1) {
            if (isDuplicate) {
                // Añadir como nuevo elemento
                updatedPages[currentPage].cells[cellIndex].elements.push({
                    ...updatedPages[currentPage].cells[cellIndex].elements.find(
                        (el) => el.id === elementId
                    ),
                    ...updates,
                });
            } else {
                // Actualizar elemento existente
                const elementIndex = updatedPages[currentPage].cells[
                    cellIndex
                ].elements.findIndex((el) => el.id === elementId);

                if (elementIndex !== -1) {
                    updatedPages[currentPage].cells[cellIndex].elements[
                        elementIndex
                    ] = {
                        ...updatedPages[currentPage].cells[cellIndex].elements[
                        elementIndex
                        ],
                        ...updates,
                    };
                }
            }
            updatePages(updatedPages);
        }
    };

    // Eliminar un elemento de una celda
    const deleteElementFromCell = (cellId, elementId) => {
        const updatedPages = [...pages];
        const cellIndex = updatedPages[currentPage].cells.findIndex(
            (cell) => cell.id === cellId
        );

        if (cellIndex !== -1) {
            updatedPages[currentPage].cells[cellIndex].elements = updatedPages[
                currentPage
            ].cells[cellIndex].elements.filter((el) => el.id !== elementId);
            updatePages(updatedPages);

            if (selectedElement === elementId) {
                setSelectedElement(null);
            }
        }
    };

    // Deshacer
    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setPages(JSON.parse(history[historyIndex - 1]));
            setSelectedElement(null);
            setSelectedCell(null);
        }
    };

    // Rehacer
    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setPages(JSON.parse(history[historyIndex + 1]));
            setSelectedElement(null);
            setSelectedCell(null);
        }
    };

    // Vista previa de la página actual
    const togglePreview = () => {
        setPreviewMode(!previewMode);
    };

    // Añadir texto desde el botón
    const handleAddText = () => {
        const newId = `text-${Date.now()}`;
        const newElement = {
            id: newId,
            type: "text",
            content: "Haz clic para editar",
            position: { x: 0.05, y: 0.05 }, // Posición en porcentajes para responsividad
            style: {
                fontSize: "16px",
                fontFamily: "Arial",
                color: "#000000",
                fontWeight: "normal",
                fontStyle: "normal",
                textDecoration: "none",
                textAlign: "left",
                backgroundColor: "transparent",
                padding: "8px",
                borderRadius: "0px",
                border: "none",
                opacity: 1,
            },
        };

        if (selectedCell) {
            // Añadir a la celda seleccionada
            addElementToCell(selectedCell, newElement);
        } else {
            // Si no hay celda seleccionada, no hacer nada o mostrar un mensaje
            console.log("Selecciona una celda primero");
        }
    };

    // Aplicar filtro predefinido
    const applyFilterPreset = (preset) => {
        if (!selectedElement || !selectedCell) return;

        updateElementInCell(selectedCell, selectedElement, {
            filters: {
                ...getSelectedElement()?.filters,
                ...preset,
            },
        });
    };

    const [workspaceSize, setWorkspaceSize] = useState("preset");

    // Función para obtener las dimensiones del área de trabajo
    const getWorkspaceDimensions = () => {
        // Si hay preset con canvas_config, usar esas dimensiones
        if (presetData?.canvas_config) {
            const canvasConfig = typeof presetData.canvas_config === 'string'
                ? JSON.parse(presetData.canvas_config)
                : presetData.canvas_config;

            // Siempre asumir que width y height vienen en centímetros
            let widthCm = canvasConfig.width;
            let heightCm = canvasConfig.height;
            let widthPx = widthCm * 37.8;
            let heightPx = heightCm * 37.8;

            if (widthPx && heightPx) {
                const maxScreenWidth = window.innerWidth * 0.6; // 60% del ancho de pantalla
                const maxScreenHeight = window.innerHeight * 0.7; // 70% del alto de pantalla

                // Calcular escala para que quepa en pantalla manteniendo proporción
                const scaleX = maxScreenWidth / widthPx;
                const scaleY = maxScreenHeight / heightPx;
                const scale = Math.min(scaleX, scaleY, 1); // No agrandar más del tamaño original

                return {
                    width: Math.round(widthPx * scale),
                    height: Math.round(heightPx * scale),
                    originalWidth: widthCm,
                    originalHeight: heightCm,
                    scale: scale,
                    unit: 'cm',
                    originalWidthPx: Math.round(widthPx),
                    originalHeightPx: Math.round(heightPx)
                };
            }
        }

        // Fallback a tamaños predefinidos si no hay canvas_config
        const predefinedSizes = {
            "square": { width: 600, height: 600 },
            "landscape": { width: 1280, height: 720 },
            "portrait": { width: 600, height: 800 },
            "wide": { width: 1200, height: 600 },
            "tall": { width: 540, height: 960 },
            "preset": { width: 800, height: 600 } // Default si no hay preset
        };

        const size = predefinedSizes[workspaceSize] || predefinedSizes.preset;

        // Aplicar escalado también a tamaños predefinidos
        const maxScreenWidth = window.innerWidth * 0.6;
        const maxScreenHeight = window.innerHeight * 0.7;

        const scaleX = maxScreenWidth / size.width;
        const scaleY = maxScreenHeight / size.height;
        const scale = Math.min(scaleX, scaleY, 1);

        return {
            width: Math.round(size.width * scale),
            height: Math.round(size.height * scale),
            originalWidth: size.width,
            originalHeight: size.height,
            scale: scale,
            unit: 'px'
        };
    };

    // Estado para las dimensiones calculadas
    const [workspaceDimensions, setWorkspaceDimensions] = useState({ width: 800, height: 600 });

    // Actualizar dimensiones cuando cambie el preset o el tamaño del workspace
    useEffect(() => {
        const dimensions = getWorkspaceDimensions();
        setWorkspaceDimensions(dimensions);
    }, [presetData, workspaceSize]);

    // Actualizar dimensiones cuando cambie el tamaño de la ventana
    useEffect(() => {
        const handleResize = () => {
            const dimensions = getWorkspaceDimensions();
            setWorkspaceDimensions(dimensions);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [presetData, workspaceSize]);

    useEffect(() => {
        const generateThumbnails = async () => {
            const newThumbnails = {};

            await Promise.all(
                pages.map(async (page, index) => {
                    const pageElement = document.getElementById(
                        `page-${page.id}`
                    );
                    if (pageElement) {
                        try {
                            // Calcula el tamaño real del elemento
                            const rect = pageElement.getBoundingClientRect();
                            const width = Math.round(rect.width);
                            const height = Math.round(rect.height);
                            const scale = window.devicePixelRatio || 1;
                            const canvas = await html2canvas(pageElement, {
                                scale,
                                width,
                                height,
                                logging: false,
                                useCORS: true,
                                allowTaint: true,
                                ignoreElements: (element) => {
                                    return element.classList.contains(
                                        "ignore-thumbnail"
                                    );
                                },
                            });
                            newThumbnails[page.id] = canvas.toDataURL();
                        } catch (error) {
                            console.error("Error generating thumbnail:", error);
                            newThumbnails[page.id] = null;
                        }
                    }
                })
            );

            setPageThumbnails({ ...pageThumbnails, ...newThumbnails });
        };

        const debouncedGenerate = setTimeout(() => {
            generateThumbnails();
        }, 500);

        return () => clearTimeout(debouncedGenerate);
    }, [pages, currentPage]);

    return (
        <DndProvider backend={HTML5Backend}>
            {isLoading ? (
                <div className="h-screen bg-gray-100 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold customtext-neutral-dark mb-2">Cargando Editor</h2>
                        <p className="customtext-neutral-dark">Preparando tu álbum personalizado...</p>
                    </div>
                </div>
            ) : pages.length === 0 || loadError ? (
                <div className="h-screen bg-gray-100 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
                        <p className="customtext-neutral-dark mb-4">
                            {loadError || "No se pudieron cargar los datos del álbum."}
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                                Volver
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-screen w-screen overflow-hidden bg-gray-50 font-paragraph">
                    { /* Book Preview Modal */}
                    <BookPreviewModal
                        isOpen={isBookPreviewOpen}
                        onRequestClose={() => setIsBookPreviewOpen(false)}
                        pages={pages.map((page) => ({
                            ...page,
                            layout: layouts.find((l) => l.id === page.layout) || layouts[0],
                        }))}
                        workspaceDimensions={workspaceDimensions}
                        getCurrentLayout={(page) => {
                            if (!page) return layouts[0];
                            return layouts.find((l) => l.id === page.layout) || layouts[0];
                        }}
                        presetData={presetData}
                        pageThumbnails={pageThumbnails}
                    />

                    {/* Header - Top Bar */}
                    <header className="fixed top-0 left-0 right-0 h-16 border-b bg-primary shadow-sm flex items-center px-4 z-10">
                        <div className="container mx-auto flex items-center justify-between">
                            {/* Logo and brand */}
                            <div className="flex items-center gap-3">
                                <img
                                    src={`/assets/resources/logo.png?v=${crypto.randomUUID()}`}
                                    alt={Global.APP_NAME}
                                    className="h-7 object-contain object-center invert brightness-0"
                                />
                                <div className="h-6 w-px bg-white/20"></div>
                                <h1 className="text-lg font-bold text-white truncate hidden sm:block">
                                    {albumData?.title || "Álbum Sin Título"}
                                </h1>
                            </div>

                            {/* Page information */}
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
                                    <p className="text-sm text-white font-medium">
                                        {getCurrentPageTitle()}
                                    </p>
                                </div>

                                <div className="text-xs text-white/70 hidden sm:block">
                                    {pages.length > 0 && `${pages.length} páginas total`}
                                </div>

                                {isCurrentPageEditable() ? (
                                    <span className="bg-white/10 text-white/80 px-2 py-2 rounded-md text-xs font-medium flex items-center gap-1">
                                        <Pencil className="h-3 w-3" />
                                      
                                    </span>
                                ) : (
                                    <span className="bg-white/10 text-white/80 px-2 py-2 rounded-md text-xs font-medium flex items-center gap-1">
                                        <Lock className="h-3 w-3" />
                                      
                                    </span>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3 items-center">
                                <Button
                                    variant={previewMode ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={togglePreview}
                                    icon={<Eye className="h-4 w-4" />}
                                    className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                                >
                                    {previewMode ? "Editar" : "Vista previa"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsBookPreviewOpen(true)}
                                    icon={<Book className="h-4 w-4" />}
                                >
                                    Vista de Álbum
                                </Button>
                            </div>
                        </div>
                    </header>

                    <div className="flex w-full h-full pt-16">
                        {/* Left sidebar */}
                        <aside className="w-64 bg-white border-r flex flex-col">
                            {/* Tab navigation */}
                            <div className="p-3 border-b">
                                <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
                                    <button
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${activeTab === "elements"
                                            ? "bg-white shadow-sm text-purple-700"
                                            : "customtext-neutral-dark hover:bg-white/50"
                                            }`}
                                        onClick={() => setActiveTab("elements")}
                                    >
                                        Elementos
                                    </button>
                                    <button
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${activeTab === "filters"
                                            ? "bg-white shadow-sm text-purple-700"
                                            : "customtext-neutral-dark hover:bg-white/50"
                                            }`}
                                        onClick={() => setActiveTab("filters")}
                                    >
                                        Filtros
                                    </button>
                                </div>
                            </div>

                            {/* Sidebar content */}
                            <div className="flex-1 overflow-y-auto p-3 custom-scroll">
                                {activeTab === "elements" && (
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-medium text-xs uppercase customtext-neutral-dark mb-2">
                                                Layouts
                                            </h3>
                                            <LayoutSelector
                                                currentLayoutId={pages[currentPage]?.layout}
                                                onLayoutChange={changeLayout}
                                            />
                                        </div>

                                        {/*       <div>
                                            <h3 className="font-medium text-xs uppercase customtext-neutral-dark mb-2">
                                                Herramientas rápidas
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const input = document.createElement("input");
                                                        input.type = "file";
                                                        input.accept = "image/*";
                                                        input.onchange = (e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                const newId = `img-${Date.now()}`;
                                                                const newElement = {
                                                                    id: newId,
                                                                    type: "image",
                                                                    content: "",
                                                                    position: { x: 10, y: 10 },
                                                                    filters: {
                                                                        brightness: 100,
                                                                        contrast: 100,
                                                                        saturation: 100,
                                                                        tint: 0,
                                                                        hue: 0,
                                                                        blur: 0,
                                                                        scale: 1,
                                                                        rotate: 0,
                                                                        opacity: 100,
                                                                        blendMode: "normal",
                                                                    },
                                                                    mask: "none",
                                                                };

                                                                const reader = new FileReader();
                                                                reader.onload = (e) => {
                                                                    if (e.target?.result) {
                                                                        newElement.content = e.target.result;
                                                                        if (selectedCell) {
                                                                            addElementToCell(selectedCell, newElement);
                                                                        } else {
                                                                            addElementToCell(pages[currentPage].cells[0].id, newElement);
                                                                        }
                                                                    }
                                                                };
                                                                reader.readAsDataURL(e.target.files[0]);
                                                            }
                                                        };
                                                        input.click();
                                                    }}
                                                    className="justify-start"
                                                    icon={<ImageIcon className="h-4 w-4" />}
                                                >
                                                    Imagen
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleAddText}
                                                    className="justify-start"
                                                    icon={<Type className="h-4 w-4" />}
                                                >
                                                    Texto
                                                </Button>
                                            </div>
                                        </div> */}

                                        <div>
                                            <h3 className="font-medium text-xs uppercase customtext-neutral-dark mb-2">
                                                Capas
                                            </h3>
                                            <LayerPanel
                                                elements={
                                                    pages[currentPage].cells.find(
                                                        (cell) => cell.id === selectedCell
                                                    )?.elements || []
                                                }
                                                onReorder={(reorderedElements) => {
                                                    const updatedPages = [...pages];
                                                    const cellIndex = updatedPages[currentPage].cells.findIndex(
                                                        (cell) => cell.id === selectedCell
                                                    );
                                                    if (cellIndex !== -1) {
                                                        updatedPages[currentPage].cells[cellIndex].elements = reorderedElements;
                                                        updatePages(updatedPages);
                                                    }
                                                }}
                                                onSelect={handleSelectElement}
                                                selectedElement={selectedElement}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "filters" && (
                                    <div className="space-y-4">
                                        {(() => {
                                            const currentElement = getSelectedElement();
                                            console.log('🔍 Filter tab - Current element:', currentElement);
                                            console.log('🔍 Filter tab - Selected element ID:', selectedElement);
                                            console.log('🔍 Filter tab - Selected cell ID:', selectedCell);

                                            return currentElement ? (
                                                <>
                                                    {currentElement.type === "image" && (
                                                        <div className="p-3 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <ImageIcon className="h-4 w-4 text-purple-600" />
                                                                <span className="text-sm font-medium">Imagen seleccionada</span>
                                                            </div>
                                                            <div className="w-full h-16 rounded-md overflow-hidden bg-gray-200">
                                                                <img
                                                                    src={currentElement.content}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <FilterControls
                                                        filters={currentElement.filters || {}}
                                                        onFilterChange={(newFilters) => {
                                                            updateElementInCell(
                                                                selectedCell,
                                                                selectedElement,
                                                                { filters: newFilters }
                                                            );
                                                        }}
                                                        selectedElement={currentElement}
                                                    />
                                                </>
                                            ) : (
                                                <div className="text-center py-8 px-2">
                                                    <div className="bg-gray-100 p-4 rounded-lg mb-3">
                                                        <ImageIcon className="h-6 w-6 text-gray-400 mx-auto" />
                                                    </div>
                                                    <h3 className="text-sm font-medium customtext-neutral-dark">
                                                        Selecciona un elemento
                                                    </h3>
                                                    <p className="text-xs customtext-neutral-dark mt-1">
                                                        Para aplicar filtros y efectos, primero selecciona una imagen o texto en el lienzo
                                                    </p>
                                                    <div className="mt-2 text-xs text-gray-400">
                                                        Debug: selectedElement={selectedElement}, selectedCell={selectedCell}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </aside>

                        {/* Main canvas area */}
                        <main className="flex-1 flex flex-col h-full">
                            {/* Enhanced top toolbar - switches between main toolbar and text toolbar */}
                            <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
                                {textToolbarVisible ? (
                                    /* Text editing toolbar */
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setTextToolbarVisible(false)}
                                                className="h-8 px-2"
                                                icon={<ChevronLeft className="h-4 w-4" />}
                                            >
                                                Volver
                                            </Button>
                                            <div className="h-6 w-px bg-gray-300 mx-2"></div>
                                        </div>

                                        <div className="flex-1 flex justify-start">
                                            <TextToolbar
                                                element={getSelectedElement()}
                                                onUpdate={(updates) => {
                                                    updateElementInCell(
                                                        textEditingOptions.cellId,
                                                        textEditingOptions.elementId,
                                                        updates
                                                    );
                                                }}
                                                onClose={() => setTextToolbarVisible(false)}
                                            />
                                        </div>


                                    </>
                                ) : (
                                    /* Main toolbar */
                                    <>
                                        {/* Left side - History controls */}
                                        <div className="flex items-center space-x-2">
                                            <div className="flex space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={undo}
                                                    disabled={historyIndex <= 0}
                                                    className="h-8 px-2"
                                                    icon={<Undo2 className="h-4 w-4" />}
                                                >
                                                    Deshacer
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={redo}
                                                    disabled={historyIndex >= history.length - 1}
                                                    className="h-8 px-2"
                                                    icon={<Redo2 className="h-4 w-4" />}
                                                >
                                                    Rehacer
                                                </Button>
                                            </div>

                                            <div className="h-6 w-px bg-gray-300 mx-2"></div>

                                            {/* Quick add tools */}
                                            <div className="flex space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const input = document.createElement("input");
                                                        input.type = "file";
                                                        input.accept = "image/*";
                                                        input.onchange = (e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                const newId = `img-${Date.now()}`;
                                                                const newElement = {
                                                                    id: newId,
                                                                    type: "image",
                                                                    content: "",
                                                                    position: { x: 0.1, y: 0.1 },
                                                                    size: { width: 0.3, height: 0.3 },
                                                                    filters: {
                                                                        brightness: 100,
                                                                        contrast: 100,
                                                                        saturation: 100,
                                                                        tint: 0,
                                                                        hue: 0,
                                                                        blur: 0,
                                                                        scale: 1,
                                                                        rotate: 0,
                                                                        opacity: 100,
                                                                        blendMode: "normal",
                                                                    },
                                                                    mask: "none",
                                                                };

                                                                const reader = new FileReader();
                                                                reader.onload = (e) => {
                                                                    if (e.target?.result) {
                                                                        newElement.content = e.target.result;
                                                                        if (selectedCell) {
                                                                            addElementToCell(selectedCell, newElement);
                                                                        } else if (pages[currentPage]?.cells[0]) {
                                                                            addElementToCell(pages[currentPage].cells[0].id, newElement);
                                                                        }
                                                                    }
                                                                };
                                                                reader.readAsDataURL(e.target.files[0]);
                                                            }
                                                        };
                                                        input.click();
                                                    }}
                                                    className="h-8 px-2"
                                                    icon={<ImageIcon className="h-4 w-4" />}
                                                >
                                                    Imagen
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleAddText}
                                                    className="h-8 px-2"
                                                    icon={<Type className="h-4 w-4" />}
                                                >
                                                    Texto
                                                </Button>
                                            </div>

                                            <div className="h-6 w-px bg-gray-300 mx-2"></div>

                                            {/* Element actions */}
                                            {selectedElement && (
                                                <div className="flex space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (selectedElement && selectedCell) {
                                                                const element = getSelectedElement();
                                                                if (element) {
                                                                    const duplicateElement = {
                                                                        ...element,
                                                                        id: `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                                                        position: {
                                                                            x: element.position.x + 0.05,
                                                                            y: element.position.y + 0.05
                                                                        }
                                                                    };
                                                                    addElementToCell(selectedCell, duplicateElement);
                                                                }
                                                            }
                                                        }}
                                                        className="h-8 px-2"
                                                        icon={<Copy className="h-4 w-4" />}
                                                    >
                                                        Duplicar
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (selectedElement && selectedCell) {
                                                                deleteElementFromCell(selectedCell, selectedElement);
                                                            }
                                                        }}
                                                        className="h-8 px-2 text-red-600 hover:text-white"
                                                        icon={<Trash2 className="h-4 w-4" />}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-2">
                                                <WorkspaceControls
                                                    currentSize={workspaceSize}
                                                    onSizeChange={setWorkspaceSize}
                                                    presetData={presetData}
                                                    workspaceDimensions={workspaceDimensions}
                                                />
                                            </div>
                                        </div>

                                        {/* Center - Page info 
                                           <div className="flex items-center space-x-4">
                                            <div className="text-sm customtext-neutral-dark">
                                                {pages[currentPage] && (
                                                    <span>
                                                        {pages[currentPage].type === "cover" && "Portada"}
                                                        {pages[currentPage].type === "content" && `Página ${pages[currentPage].pageNumber}`}
                                                        {pages[currentPage].type === "final" && "Contraportada"}
                                                    </span>
                                                )}
                                            </div>

                                            <Button
                                                variant={previewMode ? "default" : "ghost"}
                                                size="sm"
                                                onClick={togglePreview}
                                                className="h-8 px-2"
                                                icon={<Eye className="h-4 w-4" />}
                                            >
                                                {previewMode ? "Salir vista previa" : "Vista previa"}
                                            </Button>
                                        </div>*/}


                                        {/* Right side - Workspace controls 
                                         <div className="flex items-center space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsBookPreviewOpen(true)}
                                                className="h-8 px-2"
                                                icon={<Book className="h-4 w-4" />}
                                            >
                                                Previsualizar libro
                                            </Button>

                                            <div className="h-6 w-px bg-gray-300 mx-2"></div>

                                            <WorkspaceControls
                                                currentSize={workspaceSize}
                                                onSizeChange={setWorkspaceSize}
                                                presetData={presetData}
                                                workspaceDimensions={workspaceDimensions}
                                            />
                                        </div>*/}

                                    </>
                                )}
                            </div>



                            {/* Canvas workspace - centered */}
                            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden bg-gray-100">
                                {previewMode ? (
                                    <div className="bg-white rounded-lg shadow-lg">
                                        <div
                                            className="overflow-hidden"
                                            style={{
                                                width: workspaceDimensions.width,
                                                height: workspaceDimensions.height,
                                            }}
                                        >
                                            <div
                                                id={`page-${pages[currentPage].id}`}
                                                className={`grid ${getCurrentLayout().template} gap-6`}
                                                style={{ width: '100%', height: '100%' }}
                                            >
                                                {pages[currentPage].cells.map((cell) => (
                                                    <div
                                                        key={cell.id}
                                                        className="relative bg-gray-50 rounded-lg overflow-hidden"
                                                    >
                                                        {cell.elements.map((element) =>
                                                            element.type === "image" ? (
                                                                <div
                                                                    key={element.id}
                                                                    className={`absolute ${imageMasks.find(
                                                                        (m) => m.id === element.mask
                                                                    )?.class || ""
                                                                        }`}
                                                                    style={{
                                                                        left: `${element.position.x}px`,
                                                                        top: `${element.position.y}px`,
                                                                        width: "100%",
                                                                        height: "100%",
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={element.content}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        style={{
                                                                            filter: `
                                                                            brightness(${(element.filters?.brightness || 100) / 100})
                                                                            contrast(${(element.filters?.contrast || 100) / 100})
                                                                            saturate(${(element.filters?.saturation || 100) / 100})
                                                                            sepia(${(element.filters?.tint || 0) / 100})
                                                                            hue-rotate(${(element.filters?.hue || 0) * 3.6}deg)
                                                                            blur(${element.filters?.blur || 0}px)
                                                                        `,
                                                                            transform: `scale(${element.filters?.scale || 1
                                                                                }) rotate(${element.filters?.rotate || 0
                                                                                }deg) ${element.filters?.flipHorizontal
                                                                                    ? "scaleX(-1)"
                                                                                    : ""
                                                                                } ${element.filters?.flipVertical
                                                                                    ? "scaleY(-1)"
                                                                                    : ""
                                                                                }`,
                                                                            mixBlendMode: element.filters?.blendMode || "normal",
                                                                            opacity: (element.filters?.opacity || 100) / 100,
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    key={element.id}
                                                                    className="absolute"
                                                                    style={{
                                                                        left: `${element.position.x}px`,
                                                                        top: `${element.position.y}px`,
                                                                        fontFamily: element.style?.fontFamily,
                                                                        fontSize: element.style?.fontSize,
                                                                        fontWeight: element.style?.fontWeight,
                                                                        fontStyle: element.style?.fontStyle,
                                                                        textDecoration: element.style?.textDecoration,
                                                                        color: element.style?.color,
                                                                        textAlign: element.style?.textAlign,
                                                                        backgroundColor: element.style?.backgroundColor || "transparent",
                                                                        padding: element.style?.padding || "8px",
                                                                        borderRadius: element.style?.borderRadius || "0px",
                                                                        border: element.style?.border || "none",
                                                                        opacity: element.style?.opacity || 1,
                                                                    }}
                                                                >
                                                                    {element.content}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        id={`page-${pages[currentPage].id}`}
                                        className="bg-white rounded-lg shadow-xl"
                                        style={{
                                            width: workspaceDimensions.width,
                                            height: workspaceDimensions.height,
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Background layer */}
                                        {(() => {
                                            const page = pages[currentPage];
                                            let bgUrl = null;
                                            if (page.type === 'cover' && presetData?.cover_image) {
                                                bgUrl = presetData.cover_image.startsWith('http')
                                                    ? presetData.cover_image
                                                    : `/storage/images/item_preset/${presetData.cover_image}`;
                                            } else if (page.type === 'content' && presetData?.content_layer_image) {
                                                bgUrl = presetData.content_layer_image.startsWith('http')
                                                    ? presetData.content_layer_image
                                                    : `/storage/images/item_preset/${presetData.content_layer_image}`;
                                            } else if (page.type === 'final' && presetData?.final_layer_image) {
                                                bgUrl = presetData.final_layer_image.startsWith('http')
                                                    ? presetData.final_layer_image
                                                    : `/storage/images/item_preset/${presetData.final_layer_image}`;
                                            }
                                            return bgUrl ? (
                                                <img
                                                    src={bgUrl}
                                                    alt="background"
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        zIndex: 0,
                                                        pointerEvents: 'none',
                                                    }}
                                                />
                                            ) : null;
                                        })()}

                                        {/* Editable cells layer */}
                                        <div
                                            className={`grid ${getCurrentLayout().template}`}
                                            style={{
                                                position: 'relative',
                                                zIndex: 1,
                                                width: '100%',
                                                height: '100%',
                                                boxSizing: 'border-box',
                                                gap: getCurrentLayout().style?.gap || '16px',
                                                padding: getCurrentLayout().style?.padding || '16px'
                                            }}
                                        >
                                            {pages[currentPage].cells.map((cell) => (
                                                <EditableCell
                                                    key={cell.id}
                                                    id={cell.id}
                                                    elements={cell.elements.filter(el => !el.locked)}
                                                    workspaceSize={workspaceDimensions}
                                                    cellStyle={getCurrentLayout().cellStyles?.[pages[currentPage].cells.indexOf(cell)]}
                                                    selectedElement={selectedCell === cell.id ? selectedElement : null}
                                                    onSelectElement={handleSelectElement}
                                                    onAddElement={(element) => addElementToCell(cell.id, element)}
                                                    onUpdateElement={(elementId, updates, isDuplicate) =>
                                                        updateElementInCell(cell.id, elementId, updates, isDuplicate)}
                                                    onDeleteElement={(elementId) => deleteElementFromCell(cell.id, elementId)}
                                                    availableMasks={getCurrentLayout().maskCategories.flatMap((cat) => cat.masks)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </main>

                        {/* Right sidebar - Page management */}
                        <aside className="w-52 bg-white border-l flex flex-col h-full">
                            <div className="p-4 border-b bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-sm text-gray-700 flex items-center gap-1.5">
                                        <Book className="h-4 w-4 text-purple-600" />
                                        Páginas
                                    </h3>
                                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border">
                                        {pages.length} total
                                    </span>
                                </div>

                          {/*      <div className="flex gap-1.5 mt-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={duplicateCurrentPage}
                                        disabled={pages[currentPage]?.type !== "content"}
                                        title={pages[currentPage]?.type !== "content" ? "Solo se pueden duplicar páginas de contenido" : "Duplicar página"}
                                        className="h-7 w-7 rounded-md bg-white border shadow-sm hover:bg-gray-50"
                                    >
                                        <Copy className="h-3.5 w-3.5 text-gray-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={deleteCurrentPage}
                                        disabled={pages.length <= 3 || pages[currentPage]?.type === "cover" || pages[currentPage]?.type === "final"}
                                        title={
                                            pages[currentPage]?.type === "cover" || pages[currentPage]?.type === "final"
                                                ? "No se puede eliminar la portada o contraportada"
                                                : pages.length <= 3
                                                    ? "Debe haber al menos una página de contenido"
                                                    : "Eliminar página"
                                        }
                                        className="h-7 w-7 rounded-md bg-white border shadow-sm hover:bg-gray-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-gray-600" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addPage}
                                        className="flex items-center h-7 ml-auto rounded-md border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        <span className="text-xs">Nueva página</span>
                                    </Button>
                                </div> */}
                            </div>

                            {/* Page thumbnails - scrollable */}
                            <div className="flex-1 overflow-y-auto p-3 custom-scroll">
                                {/* Sections for different page types */}
                                <div className="space-y-4">
                                    {/* Cover section */}
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-1.5"></div>
                                            Portada
                                        </div>
                                        {pages.filter(page => page.type === "cover").map((page, index) => (
                                            <div
                                                key={page.id}
                                                className={`relative group flex flex-col cursor-pointer rounded-lg transition-all duration-200 transform 
                            ${currentPage === pages.indexOf(page)
                                                        ? "ring-2 ring-purple-400 scale-[1.02] shadow-md"
                                                        : "hover:bg-gray-50 border border-transparent hover:border-gray-200"}
                            mb-2`}
                                                onClick={() => setCurrentPage(pages.indexOf(page))}
                                            >
                                                <div className="relative bg-purple-50 rounded-md overflow-hidden border mb-1 aspect-[4/3]">
                                                    {pageThumbnails[page.id] ? (
                                                        <img
                                                            src={pageThumbnails[page.id]}
                                                            alt="Portada"
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <div className="text-purple-300">
                                                                <Book className="h-8 w-8" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Overlay with info */}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 group-hover:opacity-100 opacity-80 transition-opacity">
                                                        <span className="text-[10px] text-white font-medium block">
                                                            Portada
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Content pages */}
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></div>
                                            Páginas de contenido
                                        </div>
                                        <div className="space-y-2">
                                            {pages.filter(page => page.type === "content").map((page, index) => (
                                                <div
                                                    key={page.id}
                                                    className={`relative group flex flex-col cursor-pointer rounded-lg transition-all duration-200 transform 
                                ${currentPage === pages.indexOf(page)
                                                            ? "ring-2 ring-purple-400 scale-[1.02] shadow-md"
                                                            : "hover:bg-gray-50 border border-transparent hover:border-gray-200"}
                                mb-1`}
                                                    onClick={() => setCurrentPage(pages.indexOf(page))}
                                                >
                                                    <div className="relative bg-blue-50 rounded-md overflow-hidden border aspect-[4/3]">
                                                        {pageThumbnails[page.id] ? (
                                                            <img
                                                                src={pageThumbnails[page.id]}
                                                                alt={`Página ${page.pageNumber}`}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <div
                                                                    className={`grid ${getCurrentLayout().template} gap-0.5 w-full h-full p-1`}
                                                                >
                                                                    {Array.from({
                                                                        length: getCurrentLayout().cells,
                                                                    }).map((_, i) => (
                                                                        <div
                                                                            key={i}
                                                                            className="bg-gray-200 rounded-sm"
                                                                        ></div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Page number badge */}
                                                        <div className="absolute top-1 left-1 bg-white/90 rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shadow-sm">
                                                            {page.pageNumber}
                                                        </div>

                                                        {/* Editable badge */}
                                                        <div className="absolute top-1 right-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full opacity-80 group-hover:opacity-100">
                                                            Editable
                                                        </div>

                                                        {/* Bottom gradient 
                                                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] text-white">
                                                                    Página {page.pageNumber}
                                                                </span>
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        className="text-white bg-white/20 p-0.5 rounded hover:bg-white/30"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setCurrentPage(pages.indexOf(page));
                                                                            duplicateCurrentPage();
                                                                        }}
                                                                        title="Duplicar página"
                                                                    >
                                                                        <Copy className="h-2.5 w-2.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>*/}
                                                      
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Final page */}
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></div>
                                            Contraportada
                                        </div>
                                        {pages.filter(page => page.type === "final").map((page, index) => (
                                            <div
                                                key={page.id}
                                                className={`relative group flex flex-col cursor-pointer rounded-lg transition-all duration-200 transform 
                            ${currentPage === pages.indexOf(page)
                                                        ? "ring-2 ring-purple-400 scale-[1.02] shadow-md"
                                                        : "hover:bg-gray-50 border border-transparent hover:border-gray-200"}
                            mb-2`}
                                                onClick={() => setCurrentPage(pages.indexOf(page))}
                                            >
                                                <div className="relative bg-green-50 rounded-md overflow-hidden border mb-1 aspect-[4/3]">
                                                    {pageThumbnails[page.id] ? (
                                                        <img
                                                            src={pageThumbnails[page.id]}
                                                            alt="Contraportada"
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <div className="text-green-300">
                                                                <Book className="h-8 w-8" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Overlay with info */}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 group-hover:opacity-100 opacity-80 transition-opacity">
                                                        <span className="text-[10px] text-white font-medium block">
                                                            Contraportada
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            )}
        </DndProvider>
    );
}



<style jsx>{`
    .custom-scroll {
        scrollbar-width: thin;
        scrollbar-color: #c7d2fe #f5f3ff;
    }
    .custom-scroll::-webkit-scrollbar {
        height: 6px;
    }
    .custom-scroll::-webkit-scrollbar-track {
        background: #f5f3ff;
        border-radius: 3px;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
        background-color: #c7d2fe;
        border-radius: 3px;
    }
`}</style>
