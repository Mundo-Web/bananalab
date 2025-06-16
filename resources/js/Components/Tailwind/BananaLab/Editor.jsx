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
    CheckCircleIcon,
} from "lucide-react";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast, Toaster } from "sonner";
import { Local } from "sode-extend-react";

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
    // Clave única para localStorage basada en álbum y preset
    const getStorageKey = () => {
        const params = getParams();
        return `editor_progress_album_${params.albumId}_preset_${params.presetId}`;
    };
    // Estados para el álbum y preset
    const [albumData, setAlbumData] = useState(null);
    const [presetData, setPresetData] = useState(null);
    const [itemData, setItemData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Estado del carrito - igual que en System.jsx
    const [cart, setCart] = useState(
        Local.get(`${Global.APP_CORRELATIVE}_cart`) ?? []
    );

    // Sincronizar carrito con localStorage
    useEffect(() => {
        Local.set(`${Global.APP_CORRELATIVE}_cart`, cart);
    }, [cart]);

    // Estado inicial de páginas - se actualizará cuando carguemos el preset o desde localStorage
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
    // Si restoredProgress=true, solo carga datos pero NO crea páginas
    const loadAlbumData = async (restoredProgress = false) => {
        try {
            setIsLoading(true);
            setLoadError(null);

            const params = getParams();

            if (!params.albumId || !params.presetId) {
                throw new Error('Faltan parámetros requeridos: albumId y presetId');
            }

            // Determinar la URL base correcta
            const baseUrl = Global.APP_URL;

            // Siempre usar los endpoints REALES para traer datos de la base de datos
            const albumEndpoint = `${baseUrl}/api/albums/${params.albumId}`;
            const presetEndpoint = `${baseUrl}/api/item-presets/${params.presetId}`;

            const itemEndpoint = `${baseUrl}/api/items/${params.itemId}`;

            // Cargar datos del álbum
            const albumResponse = await fetch(albumEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            if (!albumResponse.ok) {
                const errorText = await albumResponse.text();
                throw new Error(`Error al cargar álbum: ${albumResponse.status} ${albumResponse.statusText}`);
            }
            const albumResponseData = await albumResponse.json();
            const album = albumResponseData.data || albumResponseData;
            setAlbumData(album);

            // Cargar datos del preset
            const presetResponse = await fetch(presetEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            if (!presetResponse.ok) {
                const errorText = await presetResponse.text();
                throw new Error(`Error al cargar preset: ${presetResponse.status} ${presetResponse.statusText}`);
            }
            const presetResponseData = await presetResponse.json();
            const preset = presetResponseData.data || presetResponseData;
            setPresetData(preset);




            // Cargar datos del item
            const itemResponse = await fetch(itemEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            if (!itemResponse.ok) {
                const errorText = await itemResponse.text();
                throw new Error(`Error al cargar item: ${itemResponse.status} ${itemResponse.statusText}`);
            }
            const itemResponseData = await itemResponse.json();
            const item = itemResponseData.data || itemResponseData;
            setItemData(item);
         


            // Solo crear páginas si NO restauramos progreso
            if (!restoredProgress) {
                await createPagesFromPreset(preset, album, params.pages);
            }

        } catch (error) {
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
        // Intentar restaurar progreso desde localStorage
        const params = getParams();
        const storageKey = getStorageKey();
        const saved = localStorage.getItem(storageKey);
        let restored = false;
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && Array.isArray(parsed.pages)) {
                    setPages(parsed.pages);
                    setCurrentPage(parsed.currentPage || 0);
                    restored = true;
                }
            } catch (e) {
                // Si hay error, ignorar y cargar normalmente
            }
        }
        // Solo crear desde cero si no restauramos progreso
        loadAlbumData(restored);
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

    // Actualizar el estado de las páginas y guardar en localStorage
    const updatePages = (newPages) => {
        setPages(newPages);
        // Actualizar el historial
        const newHistory = [
            ...history.slice(0, historyIndex + 1),
            JSON.stringify(newPages),
        ];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        // Guardar en localStorage
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify({
            pages: newPages,
            currentPage,
            savedAt: Date.now(),
        }));
    };

    // Guardar currentPage en localStorage cuando cambie
    useEffect(() => {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify({
            pages,
            currentPage,
            savedAt: Date.now(),
        }));
    }, [currentPage]);
    // (Opcional) Botón para limpiar progreso guardado
    const clearSavedProgress = () => {
        const storageKey = getStorageKey();
        localStorage.removeItem(storageKey);
        window.location.reload();
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
            if (pages.length === 0) return;
            
            console.log('🎯 Iniciando generación de thumbnails...');

            const newThumbnails = {};

            // Definir funciones para aplicar máscaras en canvas
            const applyMaskToCanvas = (ctx, maskId, x, y, width, height) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.beginPath();
                
                switch (maskId) {
                    case 'circle':
                        ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
                        break;
                    case 'diamond':
                        ctx.moveTo(width / 2, 0);
                        ctx.lineTo(width, height / 2);
                        ctx.lineTo(width / 2, height);
                        ctx.lineTo(0, height / 2);
                        ctx.closePath();
                        break;
                    case 'triangle':
                        ctx.moveTo(width / 2, 0);
                        ctx.lineTo(width, height);
                        ctx.lineTo(0, height);
                        ctx.closePath();
                        break;
                    case 'hexagon':
                        const hexPoints = [
                            [width * 0.25, height * 0.05],
                            [width * 0.75, height * 0.05],
                            [width * 1.0, height * 0.5],
                            [width * 0.75, height * 0.95],
                            [width * 0.25, height * 0.95],
                            [width * 0.0, height * 0.5]
                        ];
                        ctx.moveTo(hexPoints[0][0], hexPoints[0][1]);
                        hexPoints.slice(1).forEach(point => ctx.lineTo(point[0], point[1]));
                        ctx.closePath();
                        break;
                    case 'star':
                        const starPoints = [
                            [width * 0.5, height * 0],
                            [width * 0.61, height * 0.35],
                            [width * 0.98, height * 0.35],
                            [width * 0.68, height * 0.57],
                            [width * 0.79, height * 0.91],
                            [width * 0.5, height * 0.7],
                            [width * 0.21, height * 0.91],
                            [width * 0.32, height * 0.57],
                            [width * 0.02, height * 0.35],
                            [width * 0.39, height * 0.35]
                        ];
                        ctx.moveTo(starPoints[0][0], starPoints[0][1]);
                        starPoints.slice(1).forEach(point => ctx.lineTo(point[0], point[1]));
                        ctx.closePath();
                        break;
                    default:
                        // Sin máscara - rectángulo completo
                        ctx.rect(0, 0, width, height);
                        break;
                }
                
                ctx.clip();
            };

            // Procesar páginas secuencialmente
            for (const page of pages) {
                try {
                    const pageElement = document.getElementById(`page-${page.id}`);
                    if (!pageElement) {
                        console.warn(`❌ No se encontró elemento para página ${page.id}`);
                        continue;
                    }

                    console.log(`📄 Procesando página ${page.id}...`);

                    // Obtener dimensiones reales del workspace
                    const rect = pageElement.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) {
                        console.warn(`❌ Elemento tiene dimensiones 0 para página ${page.id}`);
                        continue;
                    }

                    console.log(`📐 Dimensiones del workspace: ${rect.width}x${rect.height}`);

                    // Crear canvas personalizado que respete exactamente el layout
                    const customCanvas = document.createElement('canvas');
                    const customCtx = customCanvas.getContext('2d');
                    
                    // Usar un factor de escala mayor para mejor calidad
                    const scale = 2; // Mayor resolución para mejor nitidez
                    customCanvas.width = rect.width * scale;
                    customCanvas.height = rect.height * scale;
                    
                    // Escalar el contexto para dibujar en alta resolución
                    customCtx.scale(scale, scale);
                    
                    // Mejorar la calidad del renderizado
                    customCtx.imageSmoothingEnabled = true;
                    customCtx.imageSmoothingQuality = 'high';
                    customCtx.textRenderingOptimization = 'optimizeQuality';
                    
                    // Fondo blanco
                    customCtx.fillStyle = '#ffffff';
                    customCtx.fillRect(0, 0, rect.width, rect.height);
                    
                    // 1. Renderizar imagen de fondo si existe
                    const bgImage = pageElement.querySelector('img[alt="background"]');
                    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
                        try {
                            customCtx.drawImage(bgImage, 0, 0, rect.width, rect.height);
                            console.log('✅ Fondo renderizado');
                        } catch (error) {
                            console.warn('❌ Error dibujando fondo:', error);
                        }
                    }
                    
                    // 2. Obtener el grid container real
                    const gridContainer = pageElement.querySelector('[class*="grid"]');
                    if (!gridContainer) {
                        console.warn('❌ No se encontró grid container');
                        continue;
                    }

                    const gridRect = gridContainer.getBoundingClientRect();
                    const pageRect = pageElement.getBoundingClientRect();
                    
                    // Calcular offset del grid respecto al contenedor de la página
                    const gridOffsetX = gridRect.left - pageRect.left;
                    const gridOffsetY = gridRect.top - pageRect.top;
                    
                    console.log(`📐 Grid offset: ${gridOffsetX}, ${gridOffsetY}`);
                    console.log(`📐 Grid dimensiones: ${gridRect.width}x${gridRect.height}`);
                    
                    // 3. Procesar cada celda del grid
                    const cellElements = Array.from(gridContainer.children);
                    console.log(`📦 Celdas encontradas: ${cellElements.length}`);
                    
                    for (let cellIndex = 0; cellIndex < cellElements.length; cellIndex++) {
                        const cellElement = cellElements[cellIndex];
                        const cellRect = cellElement.getBoundingClientRect();
                        
                        // Posición de la celda relativa al workspace
                        const cellX = cellRect.left - pageRect.left;
                        const cellY = cellRect.top - pageRect.top;
                        const cellWidth = cellRect.width;
                        const cellHeight = cellRect.height;
                        
                        console.log(`📦 Celda ${cellIndex}: x=${cellX}, y=${cellY}, w=${cellWidth}, h=${cellHeight}`);
                        
                        // Buscar elementos dentro de la celda
                        const imageElements = cellElement.querySelectorAll('img:not([alt="background"])');
                        // Buscar elementos de texto usando el atributo específico
                        const textElements = cellElement.querySelectorAll('[data-element-type="text"]');
                        
                        console.log(`� En celda ${cellIndex}: ${imageElements.length} imágenes, ${textElements.length} textos`);
                        
                        // 3.1. Procesar imágenes
                        for (const imgElement of imageElements) {
                            if (!imgElement.complete || imgElement.naturalWidth === 0) {
                                console.log('⏳ Imagen no cargada, saltando...');
                                continue;
                            }
                            
                            // Obtener información de la máscara del contenedor de la imagen
                            let maskId = 'none';
                            let maskContainer = imgElement.parentElement;
                            
                            // Buscar el contenedor con la clase de máscara
                            while (maskContainer && maskContainer !== cellElement) {
                                const maskClass = Array.from(maskContainer.classList).find(cls => cls.startsWith('mask-'));
                                if (maskClass) {
                                    maskId = maskClass.replace('mask-', '');
                                    break;
                                }
                                maskContainer = maskContainer.parentElement;
                            }
                            
                            console.log(`🎭 Imagen encontrada con máscara: ${maskId}`);
                            
                            // Obtener el contenedor de la imagen (que define el tamaño del area visible)
                            const imgContainer = imgElement.parentElement;
                            const containerRect = imgContainer.getBoundingClientRect();
                            const containerX = containerRect.left - pageRect.left;
                            const containerY = containerRect.top - pageRect.top;
                            const containerWidth = containerRect.width;
                            const containerHeight = containerRect.height;
                            
                            console.log(`📦 Contenedor: x=${containerX}, y=${containerY}, w=${containerWidth}, h=${containerHeight}`);
                            
                            // Obtener dimensiones naturales de la imagen
                            const naturalWidth = imgElement.naturalWidth;
                            const naturalHeight = imgElement.naturalHeight;
                            
                            console.log(`📷 Imagen natural: ${naturalWidth}x${naturalHeight}`);
                            
                            // Obtener propiedades CSS de object-fit y object-position
                            const computedStyle = window.getComputedStyle(imgElement);
                            const objectFit = computedStyle.objectFit || 'cover';
                            const objectPosition = computedStyle.objectPosition || 'center center';
                            
                            console.log(`🎨 CSS: object-fit=${objectFit}, object-position=${objectPosition}`);
                            
                            // Calcular cómo CSS renderizaría la imagen con object-fit: cover
                            let sourceX = 0, sourceY = 0, sourceWidth = naturalWidth, sourceHeight = naturalHeight;
                            let destX = containerX, destY = containerY, destWidth = containerWidth, destHeight = containerHeight;
                            
                            if (objectFit === 'cover') {
                                // Calcular la escala necesaria para que la imagen cubra completamente el contenedor
                                const scaleX = containerWidth / naturalWidth;
                                const scaleY = containerHeight / naturalHeight;
                                const scale = Math.max(scaleX, scaleY); // Mayor escala para cubrir completamente
                                
                                // Dimensiones de la imagen escalada
                                const scaledWidth = naturalWidth * scale;
                                const scaledHeight = naturalHeight * scale;
                                
                                // Parsear object-position (por defecto center center)
                                const positions = objectPosition.split(' ');
                                let posX = 'center', posY = 'center';
                                
                                if (positions.length >= 1) posX = positions[0];
                                if (positions.length >= 2) posY = positions[1];
                                
                                // Convertir posiciones a porcentajes
                                let offsetXPercent = 0.5; // center por defecto
                                let offsetYPercent = 0.5; // center por defecto
                                
                                if (posX.includes('%')) {
                                    offsetXPercent = parseFloat(posX) / 100;
                                } else if (posX === 'left') {
                                    offsetXPercent = 0;
                                } else if (posX === 'right') {
                                    offsetXPercent = 1;
                                }
                                
                                if (posY.includes('%')) {
                                    offsetYPercent = parseFloat(posY) / 100;
                                } else if (posY === 'top') {
                                    offsetYPercent = 0;
                                } else if (posY === 'bottom') {
                                    offsetYPercent = 1;
                                }
                                
                                // Calcular qué parte de la imagen se mostrará (crop)
                                if (scaledWidth > containerWidth) {
                                    // La imagen es más ancha que el contenedor, recortar horizontalmente
                                    const cropWidth = containerWidth / scale;
                                    const maxOffsetX = naturalWidth - cropWidth;
                                    sourceX = maxOffsetX * offsetXPercent;
                                    sourceWidth = cropWidth;
                                } else {
                                    // La imagen encaja horizontalmente
                                    sourceX = 0;
                                    sourceWidth = naturalWidth;
                                }
                                
                                if (scaledHeight > containerHeight) {
                                    // La imagen es más alta que el contenedor, recortar verticalmente
                                    const cropHeight = containerHeight / scale;
                                    const maxOffsetY = naturalHeight - cropHeight;
                                    sourceY = maxOffsetY * offsetYPercent;
                                    sourceHeight = cropHeight;
                                } else {
                                    // La imagen encaja verticalmente
                                    sourceY = 0;
                                    sourceHeight = naturalHeight;
                                }
                                
                                console.log(`✂️ Recorte calculado con ${objectPosition}: sourceX=${sourceX}, sourceY=${sourceY}, sourceW=${sourceWidth}, sourceH=${sourceHeight}`);
                            }
                            
                            // Aplicar máscara y dibujar imagen
                            customCtx.save();
                            
                            // Si hay máscara, aplicarla al área del contenedor
                            if (maskId && maskId !== 'none') {
                                applyMaskToCanvas(customCtx, maskId, containerX, containerY, containerWidth, containerHeight);
                            } else {
                                // Sin máscara, solo recortar al área del contenedor
                                customCtx.beginPath();
                                customCtx.rect(containerX, containerY, containerWidth, containerHeight);
                                customCtx.clip();
                            }
                            
                            // Aplicar filtros si los hay
                            const filter = computedStyle.filter;
                            
                            if (filter && filter !== 'none') {
                                const brightnessMatch = filter.match(/brightness\(([^)]+)\)/);
                                if (brightnessMatch) {
                                    const brightness = parseFloat(brightnessMatch[1]);
                                    customCtx.globalAlpha *= brightness;
                                }
                            }
                            
                            // Dibujar la imagen aplicando el recorte de object-fit: cover
                            try {
                                customCtx.drawImage(
                                    imgElement,
                                    sourceX, sourceY, sourceWidth, sourceHeight,  // Área fuente (recortada)
                                    destX, destY, destWidth, destHeight           // Área destino (contenedor)
                                );
                                console.log(`✅ Imagen dibujada con object-fit:cover y máscara ${maskId}`);
                            } catch (error) {
                                console.warn('❌ Error dibujando imagen:', error);
                            }
                            
                            customCtx.restore();
                        }
                        
                        // 3.2. Procesar elementos de texto
                        console.log(`📝 Procesando ${textElements.length} elementos de texto en celda ${cellIndex}...`);
                        
                        for (let textIndex = 0; textIndex < textElements.length; textIndex++) {
                            const textElement = textElements[textIndex];
                            
                            try {
                                const textRect = textElement.getBoundingClientRect();
                                const textX = textRect.left - pageRect.left;
                                const textY = textRect.top - pageRect.top;
                                const textWidth = textRect.width;
                                const textHeight = textRect.height;
                                
                                console.log(`📝 Elemento de texto #${textIndex}:`);
                                console.log(`   - BoundingRect: ${textRect.left}, ${textRect.top}, ${textRect.width}x${textRect.height}`);
                                console.log(`   - Posición relativa al workspace: x=${textX}, y=${textY}`);
                                console.log(`   - Dimensiones: ${textWidth}x${textHeight}`);
                                
                                // Obtener estilos computados del elemento de texto
                                const computedStyle = window.getComputedStyle(textElement);
                                let fontSize = computedStyle.fontSize || '16px';
                                const fontFamily = computedStyle.fontFamily || 'Arial';
                                const fontWeight = computedStyle.fontWeight || 'normal';
                                const fontStyle = computedStyle.fontStyle || 'normal';
                                const color = computedStyle.color || '#000000';
                                const textAlign = computedStyle.textAlign || 'left';
                                const opacity = parseFloat(computedStyle.opacity) || 1;
                                const padding = computedStyle.padding || '8px';
                                
                                // Obtener el contenido del texto
                                const textContent = textElement.textContent || textElement.innerText || '';
                                
                                console.log(`   - Contenido: "${textContent}"`);
                                console.log(`   - Estilos: ${fontSize} ${fontFamily} ${fontWeight} ${color}`);
                                
                                if (textContent.trim()) {
                                    // Ajustar el tamaño de fuente para la alta resolución del canvas
                                    const fontSizeNumber = parseFloat(fontSize);
                                    const scaledFontSize = Math.round(fontSizeNumber); // No escalar aquí porque ya tenemos scale en el context
                                    
                                    console.log(`📝 Renderizando texto: "${textContent}"`);
                                    console.log(`   - Posición canvas: ${textX}, ${textY}`);
                                    console.log(`   - Fuente escalada: ${scaledFontSize}px ${fontFamily}`);
                                    
                                    // Configurar el contexto para el texto
                                    customCtx.save();
                                    customCtx.globalAlpha = opacity;
                                    
                                    // Configurar fuente con alta calidad
                                    customCtx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${fontFamily}`;
                                    customCtx.fillStyle = color;
                                    customCtx.textBaseline = 'top';
                                    
                                    // Mejorar la calidad del renderizado de texto
                                    customCtx.textRenderingOptimization = 'optimizeQuality';
                                    customCtx.textRendering = 'geometricPrecision';
                                    
                                    // Configurar alineación
                                    if (textAlign === 'center') {
                                        customCtx.textAlign = 'center';
                                    } else if (textAlign === 'right') {
                                        customCtx.textAlign = 'right';
                                    } else {
                                        customCtx.textAlign = 'left';
                                    }
                                    
                                    // Calcular posición X según alineación
                                    let drawX = textX;
                                    if (textAlign === 'center') {
                                        drawX = textX + textWidth / 2;
                                    } else if (textAlign === 'right') {
                                        drawX = textX + textWidth;
                                    }
                                    
                                    // Ajustar por padding si existe
                                    const paddingValue = parseFloat(padding) || 8;
                                    const finalX = drawX + (textAlign === 'left' ? paddingValue : 0);
                                    const finalY = textY + paddingValue;
                                    
                                    console.log(`   - Dibujando en coordenadas finales: x=${finalX}, y=${finalY}`);
                                    console.log(`   - Padding aplicado: ${paddingValue}px`);
                                    
                                    // Dibujar fondo si existe
                                    const backgroundColor = computedStyle.backgroundColor;
                                    if (backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
                                        const borderRadius = parseFloat(computedStyle.borderRadius) || 0;
                                        customCtx.fillStyle = backgroundColor;
                                        
                                        if (borderRadius > 0) {
                                            // Dibujar rectángulo con bordes redondeados
                                            customCtx.beginPath();
                                            customCtx.roundRect(textX, textY, textWidth, textHeight, borderRadius);
                                            customCtx.fill();
                                        } else {
                                            customCtx.fillRect(textX, textY, textWidth, textHeight);
                                        }
                                        
                                        customCtx.fillStyle = color; // Restaurar color del texto
                                    }
                                    
                                    // Dibujar el texto
                                    customCtx.fillText(textContent, finalX, finalY);
                                    
                                    console.log(`✅ Texto renderizado exitosamente: "${textContent}"`);
                                    
                                    customCtx.restore();
                                } else {
                                    console.log(`⚠️ Elemento de texto está vacío`);
                                }
                            } catch (error) {
                                console.warn(`❌ Error renderizando texto #${textIndex}:`, error);
                            }
                        }
                    }
                    
                    // 4. Crear thumbnail final que respete la proporción EXACTA del workspace
                    const thumbnailCanvas = document.createElement('canvas');
                    const thumbnailCtx = thumbnailCanvas.getContext('2d');
                    
                    // Usar las dimensiones REALES del workspace para calcular la proporción exacta
                    const workspaceAspectRatio = rect.width / rect.height;
                    
                    // Definir tamaño base del thumbnail (ajustable)
                    const thumbnailBaseSize = 200; // Tamaño base
                    
                    // Calcular dimensiones del thumbnail manteniendo la proporción EXACTA
                    let thumbWidth, thumbHeight;
                    
                    if (workspaceAspectRatio >= 1) {
                        // Workspace más ancho que alto
                        thumbWidth = thumbnailBaseSize;
                        thumbHeight = thumbnailBaseSize / workspaceAspectRatio;
                    } else {
                        // Workspace más alto que ancho
                        thumbHeight = thumbnailBaseSize;
                        thumbWidth = thumbnailBaseSize * workspaceAspectRatio;
                    }
                    
                    console.log(`📏 Workspace proporción: ${workspaceAspectRatio.toFixed(3)} (${rect.width}x${rect.height})`);
                    console.log(`📏 Thumbnail calculado: ${thumbWidth.toFixed(1)}x${thumbHeight.toFixed(1)}`);
                    
                    thumbnailCanvas.width = Math.round(thumbWidth);
                    thumbnailCanvas.height = Math.round(thumbHeight);
                    
                    // Aplicar configuraciones de alta calidad
                    thumbnailCtx.imageSmoothingEnabled = true;
                    thumbnailCtx.imageSmoothingQuality = 'high';
                    
                    // Dibujar la imagen escalada manteniendo la proporción exacta
                    thumbnailCtx.drawImage(customCanvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
                    
                    // Convertir a base64 con mayor calidad
                    newThumbnails[page.id] = thumbnailCanvas.toDataURL('image/png', 0.95);
                    
                    console.log(`✅ Thumbnail generado para página ${page.id}: ${thumbnailCanvas.width}x${thumbnailCanvas.height} (proporción: ${(thumbnailCanvas.width/thumbnailCanvas.height).toFixed(3)})`);
                    
                } catch (error) {
                    console.error(`❌ Error generando thumbnail para página ${page.id}:`, error);
                    newThumbnails[page.id] = null;
                }
            }
            
            console.log('🎉 Generación de thumbnails completada');
            setPageThumbnails(prev => ({ ...prev, ...newThumbnails }));
        };

        const debouncedGenerate = setTimeout(() => {
            generateThumbnails();
        }, 1500);

        return () => clearTimeout(debouncedGenerate);
    }, [pages, currentPage, workspaceDimensions]);



    // --- Función para agregar álbum al carrito ---
    const addAlbumToCart = () => {
        console.log('🛒 === INICIO addAlbumToCart ===');
        
        try {
            console.log('📊 Estado actual:', { 
                albumData: albumData, 
                presetData: presetData, 
                cartLength: cart?.length,
                hasAlbumData: !!albumData,
                hasPresetData: !!presetData,
                albumId: albumData?.id,
                presetId: presetData?.id
            });

            // Verificar que Local y Global estén disponibles PRIMERO
            console.log('🔍 Verificando dependencias...');
            console.log('Local type:', typeof Local);
            console.log('Global type:', typeof Global);
            console.log('Local object:', Local);
            console.log('Global object:', Global);
            
            if (typeof Local === 'undefined') {
                console.error('❌ Local no está definido');
                toast.error("Error del sistema", {
                    description: "Sistema Local no disponible.",
                    duration: 3000,
                    position: "bottom-center",
                });
                return false;
            }
            
            if (typeof Global === 'undefined') {
                console.error('❌ Global no está definido');
                toast.error("Error del sistema", {
                    description: "Sistema Global no disponible.",
                    duration: 3000,
                    position: "bottom-center",
                });
                return false;
            }

            // Verificar APP_CORRELATIVE
            console.log('Global.APP_CORRELATIVE:', Global.APP_CORRELATIVE);
            
            if (!Global.APP_CORRELATIVE) {
                console.error('❌ Global.APP_CORRELATIVE no está definido');
                toast.error("Error del sistema", {
                    description: "Configuración del sistema incompleta.",
                    duration: 3000,
                    position: "bottom-center",
                });
                return false;
            }

            // Verificar datos del álbum y preset
            if (!albumData) {
                console.error('❌ albumData no está disponible');
                console.log('albumData actual:', albumData);
                toast.error("Error", {
                    description: "Datos del álbum no disponibles.",
                    duration: 3000,
                    position: "bottom-center",
                });
                return false;
            }
            
            if (!presetData) {
                console.error('❌ presetData no está disponible');
                console.log('presetData actual:', presetData);
                toast.error("Error", {
                    description: "Datos del preset no disponibles.",
                    duration: 3000,
                    position: "bottom-center",
                });
                return false;
            }

            console.log('✅ Todas las verificaciones pasaron, continuando...');

            // Verificar espacio en localStorage y limpiarlo si es necesario
            console.log('🧹 Verificando espacio en localStorage...');
            try {
                // Calcular tamaño actual del localStorage
                let totalSize = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        totalSize += localStorage[key].length;
                    }
                }
                console.log('📊 Tamaño actual del localStorage:', (totalSize / 1024 / 1024).toFixed(2), 'MB');
                
                // Si el localStorage está muy lleno (más de 8MB), limpiar datos innecesarios
                if (totalSize > 8 * 1024 * 1024) {
                    console.log('⚠️ localStorage lleno, limpiando datos innecesarios...');
                    
                    // Limpiar thumbnails viejos y datos temporales
                    for (let key in localStorage) {
                        if (key.includes('thumbnail') || key.includes('temp') || key.includes('cache')) {
                            localStorage.removeItem(key);
                            console.log('🗑️ Eliminado:', key);
                        }
                    }
                }
            } catch (e) {
                console.warn('⚠️ Error al verificar localStorage:', e);
            }

            // Generar ID único para el álbum que incluya timestamp para evitar duplicados
            const timestamp = Date.now();
            const albumId = `album_${albumData.id}_${timestamp}`;
            console.log('🆔 ID generado para el álbum:', albumId);

            // Obtener thumbnail de la portada si está disponible
            let albumThumbnail = presetData.cover_image;
            if (pageThumbnails && pageThumbnails['page-cover']) {
                albumThumbnail = pageThumbnails['page-cover'];
            }
            console.log('🖼️ Thumbnail del álbum:', albumThumbnail);

            // Crear el producto del álbum para el carrito
            console.log('📦 Creando producto del álbum...');
            
            // Optimizar los datos del álbum para reducir el tamaño del carrito
            const optimizedAlbumData = {
                album_id: albumData.id,
                preset_id: presetData.id,
                pages_count: pages.length,
                title: albumData.title,
                description: albumData.description?.substring(0, 200) || "", // Limitar descripción
                selected_pages: albumData.selected_pages,
                selected_cover_type: albumData.selected_cover_type,
                selected_finish: albumData.selected_finish,
                created_at: new Date().toISOString()
            };

            // Optimizar imagen del thumbnail (reducir calidad si es base64)
            let optimizedThumbnail = albumThumbnail;
            if (albumThumbnail && albumThumbnail.startsWith('data:image/')) {
                // Si es muy grande, usar una versión más pequeña o la imagen del preset
                if (albumThumbnail.length > 100000) { // Si es mayor a ~100KB
                    console.log('🖼️ Thumbnail muy grande, usando imagen del preset');
                    optimizedThumbnail = presetData.cover_image || '/assets/img/default-album.jpg';
                }
            }
            console.log('🖼️ Thumbnail optimizado:', presetData);

            const albumProduct = {
                id: albumId, // ID único para el álbum
                name: albumData.title || `Álbum Personalizado - ${presetData.name}`,
                image: presetData?.image || optimizedThumbnail, // Usar thumbnail optimizado
                price: presetData.price || 0,
                final_price: presetData.final_price || presetData.price || 0,
                discount: presetData.discount || null,
                slug: `album-${albumData.id}-${timestamp}`,
                quantity: 1,
                type: 'custom_album', // Identificar que es un álbum personalizado
                album_data: optimizedAlbumData, // Datos optimizados
                preset_data: {
                    id: presetData.id,
                    name: presetData.name,
                    cover_image: presetData.cover_image,
                    price: presetData.price,
                    final_price: presetData.final_price
                }
            };

            console.log('📦 Producto del álbum creado exitosamente');
            console.log('📊 Tamaño estimado del producto:', JSON.stringify(albumProduct).length, 'caracteres');

            // Obtener carrito actual directamente de localStorage para asegurar sincronización
            console.log('🛒 Obteniendo carrito actual...');
            const cartKey = `${Global.APP_CORRELATIVE}_cart`;
            console.log('🔑 Clave del carrito:', cartKey);
            
            const currentCart = Local.get(cartKey) || [];
            console.log('🛒 Carrito actual desde localStorage:', currentCart);
            console.log('🛒 Longitud del carrito actual:', currentCart.length);

            // Agregar al carrito (siempre como nuevo item para álbumes personalizados)
            console.log('➕ Agregando producto al carrito...');
            const newCart = [...currentCart, albumProduct];
            console.log('🛒 Nuevo carrito:', newCart);
            console.log('🛒 Nueva longitud del carrito:', newCart.length);

            // Actualizar tanto el estado local como localStorage
            console.log('💾 Guardando en estado y localStorage...');
            
            let storageError = null;
            
            try {
                setCart(newCart);
                Local.set(cartKey, newCart);
                console.log('✅ Carrito actualizado en estado y localStorage');
            } catch (error) {
                storageError = error;
                if (error.name === 'QuotaExceededError') {
                    console.error('❌ Error de cuota de localStorage excedida');
                    
                    // Intentar liberar espacio eliminando elementos del carrito antiguos
                    console.log('🧹 Intentando liberar espacio del carrito...');
                    
                    try {
                        // Mantener solo los últimos 3 elementos del carrito
                        const reducedCart = currentCart.slice(-2); // Solo los últimos 2
                        const finalCart = [...reducedCart, albumProduct]; // Más el nuevo
                        
                        console.log('📦 Carrito reducido:', finalCart);
                        
                        setCart(finalCart);
                        Local.set(cartKey, finalCart);
                        
                        console.log('✅ Carrito guardado con espacio reducido');
                        
                        // Actualizar la referencia del carrito para las verificaciones
                        newCart = finalCart;
                        
                        toast.success("Álbum agregado al carrito", {
                            description: "Se liberó espacio eliminando productos antiguos.",
                            duration: 4000,
                            position: "bottom-center",
                        });
                        
                    } catch (secondError) {
                        console.error('❌ No se pudo liberar espacio suficiente:', secondError);
                        
                        // Como último recurso, guardar solo la información esencial
                        try {
                            const minimalProduct = {
                                id: albumId,
                                name: albumProduct.name,
                                price: albumProduct.price,
                                final_price: albumProduct.final_price,
                                quantity: 1,
                                type: 'custom_album',
                                album_data: {
                                    album_id: albumData.id,
                                    preset_id: presetData.id,
                                    title: albumData.title
                                }
                            };
                            
                            const minimalCart = [minimalProduct];
                            setCart(minimalCart);
                            Local.set(cartKey, minimalCart);
                            
                            console.log('✅ Guardado con datos mínimos');
                            newCart = minimalCart;
                            
                            toast.success("Álbum agregado al carrito", {
                                description: "Guardado con información esencial.",
                                duration: 3000,
                                position: "bottom-center",
                            });
                            
                        } catch (finalError) {
                            console.error('❌ Error final al guardar:', finalError);
                            throw new Error('No se pudo guardar en el carrito por falta de espacio');
                        }
                    }
                } else {
                    throw error;
                }
            }

            // Verificar que se guardó correctamente
            console.log('🔍 Verificando que se guardó correctamente...');
            const verifyCart = Local.get(cartKey);
            console.log('🔍 Verificación del carrito guardado:', verifyCart);
            console.log('🔍 Longitud del carrito verificado:', verifyCart?.length);

            // Verificar que el álbum específico está en el carrito
            const albumInCart = verifyCart?.find(item => item.id === albumId);
            console.log('📦 Álbum encontrado en carrito:', albumInCart ? 'SÍ' : 'NO');
            console.log('📦 Datos del álbum en carrito:', albumInCart);
            
            if (!albumInCart) {
                console.error('❌ ERROR: El álbum no se encontró en el carrito después de guardarlo');
                toast.error("Error al verificar carrito", {
                    description: "El álbum no se guardó correctamente en el carrito.",
                    duration: 3000,
                    position: "bottom-center",
                });
                return false;
            }

            // Solo mostrar notificación si no se mostró antes (en caso de espacio reducido)
            if (!storageError || storageError.name !== 'QuotaExceededError') {
                // Mostrar notificación de éxito
                console.log('✅ Mostrando notificación de éxito...');
                toast.success("Álbum agregado al carrito", {
                    description: `${albumProduct.name} se ha añadido al carrito.`,
                    icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
                    duration: 3000,
                    position: "bottom-center",
                });
            }

            // Disparar evento personalizado para notificar otros componentes
            console.log('📡 Disparando evento cartUpdated...');
            window.dispatchEvent(new CustomEvent('cartUpdated', { 
                detail: { cart: newCart, action: 'add', product: albumProduct }
            }));

            console.log('🛒 === FIN addAlbumToCart EXITOSO ===');
            return true;
            
        } catch (error) {
            console.error('❌ === ERROR EN addAlbumToCart ===');
            console.error('Error completo:', error);
            console.error('Stack trace:', error.stack);
            console.error('Mensaje del error:', error.message);
            
            toast.error("Error al agregar al carrito", {
                description: `Error específico: ${error.message}`,
                duration: 5000,
                position: "bottom-center",
            });
            return false;
        }
    };

    // --- Finalizar diseño del álbum ---
    // Guarda el estado completo del diseño en la base de datos (optimizado)
    window.finalizeAlbumDesign = async () => {
        try {
            const params = getParams();
            if (!params.albumId) {
                alert('Error: No se encontró el ID del álbum');
                return false;
            }

            // Optimizar y comprimir los datos del diseño
            const optimizePages = (pages) => {
                return pages.map(page => ({
                    id: page.id,
                    type: page.type,
                    pageNumber: page.pageNumber,
                    layout: page.layout,
                    cells: page.cells.map(cell => ({
                        id: cell.id,
                        elements: cell.elements.map(element => {
                            const optimizedElement = {
                                id: element.id,
                                type: element.type,
                                position: element.position,
                                zIndex: element.zIndex || 1
                            };

                            // Solo incluir propiedades necesarias según el tipo
                            if (element.type === 'image') {
                                // Para imágenes base64, guardar solo un hash o identificador
                                if (element.content.startsWith('data:image/')) {
                                    // Crear un hash simple de la imagen para identificarla
                                    const imageHash = btoa(element.content.substring(0, 100)).substring(0, 20);
                                    optimizedElement.content = `[BASE64_IMAGE_${imageHash}]`;
                                    optimizedElement.contentType = element.content.split(';')[0].split(':')[1];
                                    optimizedElement.originalSize = element.content.length;
                                } else {
                                    optimizedElement.content = element.content;
                                }
                                
                                // Solo incluir filtros no vacíos
                                if (element.filters) {
                                    const activeFilters = Object.entries(element.filters)
                                        .filter(([key, value]) => value !== 0 && value !== false && value !== null)
                                        .reduce((acc, [key, value]) => {
                                            acc[key] = value;
                                            return acc;
                                        }, {});
                                    
                                    if (Object.keys(activeFilters).length > 0) {
                                        optimizedElement.filters = activeFilters;
                                    }
                                }
                                
                                if (element.mask && element.mask !== 'none') {
                                    optimizedElement.mask = element.mask;
                                }
                                if (element.size) {
                                    optimizedElement.size = element.size;
                                }
                                if (element.locked) {
                                    optimizedElement.locked = element.locked;
                                }
                            } else if (element.type === 'text') {
                                optimizedElement.content = element.content;
                                if (element.style) {
                                    // Solo incluir estilos no por defecto
                                    const nonDefaultStyles = Object.entries(element.style)
                                        .filter(([key, value]) => {
                                            // Filtrar valores por defecto comunes
                                            if (key === 'fontSize' && value === '16px') return false;
                                            if (key === 'color' && value === '#000000') return false;
                                            if (key === 'fontFamily' && value === 'Arial') return false;
                                            return true;
                                        })
                                        .reduce((acc, [key, value]) => {
                                            acc[key] = value;
                                            return acc;
                                        }, {});
                                    
                                    if (Object.keys(nonDefaultStyles).length > 0) {
                                        optimizedElement.style = nonDefaultStyles;
                                    }
                                }
                            }

                            return optimizedElement;
                        })
                    }))
                }));
            };

            // Preparar los datos del diseño optimizados
            const designData = {
                pages: optimizePages(pages),
                albumInfo: {
                    id: albumData?.id,
                    title: albumData?.title,
                    preset_id: presetData?.id
                },
                presetInfo: {
                    id: presetData?.id,
                    name: presetData?.name,
                    cover_image: presetData?.cover_image,
                    content_layer_image: presetData?.content_layer_image,
                    final_layer_image: presetData?.final_layer_image
                },
                workspace: {
                    width: workspaceDimensions.width,
                    height: workspaceDimensions.height,
                    scale: workspaceDimensions.scale
                },
                meta: {
                    finalizedAt: new Date().toISOString(),
                    version: '1.2'
                }
            };

            // Verificar el tamaño del payload
            const dataString = JSON.stringify({ design_data: designData });
            const dataSizeKB = Math.round(dataString.length / 1024);
            const dataSizeMB = Math.round(dataSizeKB / 1024 * 100) / 100;
            
            console.log(`Tamaño del payload: ${dataSizeKB} KB (${dataSizeMB} MB)`);
            
            // Mostrar información detallada sobre el contenido
            let base64Images = 0;
            let totalBase64Size = 0;
            
            pages.forEach(page => {
                page.cells?.forEach(cell => {
                    cell.elements?.forEach(element => {
                        if (element.type === 'image' && element.content && element.content.startsWith('data:image/')) {
                            base64Images++;
                            totalBase64Size += element.content.length;
                        }
                    });
                });
            });
            
            const base64SizeMB = Math.round(totalBase64Size / (1024 * 1024) * 100) / 100;
            console.log(`Imágenes base64 encontradas: ${base64Images}, Tamaño total: ${base64SizeMB} MB`);
            
            // Advertir si el payload es muy grande
            if (dataSizeKB > 1024) { // Más de 1MB
                const proceed = confirm(
                    `El diseño contiene ${base64Images} imágenes (${base64SizeMB} MB en imágenes). ` +
                    `Payload completo: ${dataSizeMB} MB. ` +
                    `Esto podría causar problemas al guardarlo. ` +
                    `¿Desea continuar de todos modos?`
                );
                if (!proceed) {
                    return false;
                }
            }

            // Determinar la URL base correcta
            const baseUrl = window.location.origin.includes('bananalab')
                ? '/projects/bananalab/public'
                : '';

            // Enviar al backend
            const response = await fetch(`${baseUrl}/api/albums/${params.albumId}/finalize-design`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: dataString
            });

            if (!response.ok) {
                let errorMessage = 'Error al finalizar el diseño';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Si no se puede parsear la respuesta como JSON
                    if (response.status === 413) {
                        errorMessage = 'El diseño es demasiado grande para ser guardado. Intente simplificar las imágenes.';
                    } else if (response.status >= 500) {
                        errorMessage = 'Error del servidor. Intente nuevamente más tarde.';
                    }
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            
            console.log('✅ Diseño finalizado exitosamente en el servidor');
            console.log('📄 Respuesta del servidor:', result);
            
            return true;

        } catch (error) {
            console.error('Error al finalizar diseño:', error);
            let userMessage = error.message;
            
            // Mejorar mensajes de error específicos
            if (error.message.includes('Failed to fetch')) {
                userMessage = 'Error de conexión. Verifique su conexión a internet e intente nuevamente.';
            } else if (error.message.includes('NetworkError') || error.message.includes('net::')) {
                userMessage = 'Error de red. Intente nuevamente más tarde.';
            }
            
            alert('Error al finalizar el diseño: ' + userMessage);
            return false;
        }
    };

    // --- Generar PDF del álbum (fiel al render del editor) ---
    // Renderiza cada página usando el mismo componente React en un contenedor oculto
    window.generateAlbumPDF = async () => {
        try {
            // Importar dependencias dinámicamente
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            console.log('🎯 Iniciando generación de PDF del álbum...');
            
            // 1. Crear un contenedor oculto para renderizado
            let hiddenContainer = document.getElementById('pdf-hidden-pages');
            if (!hiddenContainer) {
                hiddenContainer = document.createElement('div');
                hiddenContainer.id = 'pdf-hidden-pages';
                hiddenContainer.style.cssText = `
                    position: fixed;
                    left: -99999px;
                    top: 0;
                    width: ${workspaceDimensions.originalWidth || 800}px;
                    z-index: -1;
                    background: white;
                `;
                document.body.appendChild(hiddenContainer);
            }
            hiddenContainer.innerHTML = '';

            // 2. Renderizar cada página usando React (idéntico al editor)
            const renderPage = (page, idx) => {
                const layout = layouts.find(l => l.id === page.layout) || layouts[0];
                const pageDiv = document.createElement('div');
                pageDiv.id = `pdf-page-${page.id}`;
                pageDiv.style.cssText = `
                    width: ${workspaceDimensions.originalWidth || 800}px;
                    height: ${workspaceDimensions.originalHeight || 600}px;
                    background: #fff;
                    overflow: hidden;
                    position: relative;
                    box-sizing: border-box;
                    display: block;
                    margin: 0;
                    padding: 0;
                `;

                // Crear estructura del grid
                const gridDiv = document.createElement('div');
                gridDiv.className = `grid ${layout.template}`;
                gridDiv.style.cssText = `
                    width: 100%;
                    height: 100%;
                    gap: ${layout.style?.gap || '16px'};
                    padding: ${layout.style?.padding || '16px'};
                    box-sizing: border-box;
                    position: relative;
                `;

                // Renderizar cada celda
                page.cells.forEach((cell, cellIdx) => {
                    const cellDiv = document.createElement('div');
                    cellDiv.style.cssText = `
                        position: relative;
                        width: 100%;
                        height: 100%;
                        background: #f9fafb;
                        border-radius: 8px;
                        overflow: hidden;
                    `;

                    // Renderizar elementos de la celda
                    cell.elements.forEach((element) => {
                        if (element.type === 'image') {
                            const imgContainer = document.createElement('div');
                            const maskClass = imageMasks.find(m => m.id === element.mask)?.class || '';
                            if (maskClass) imgContainer.className = maskClass;
                            
                            imgContainer.style.cssText = `
                                position: absolute;
                                left: ${element.position.x}px;
                                top: ${element.position.y}px;
                                width: 100%;
                                height: 100%;
                                z-index: ${element.zIndex || 1};
                            `;

                            const img = document.createElement('img');
                            img.src = element.content;
                            img.alt = '';
                            img.style.cssText = `
                                width: 100%;
                                height: 100%;
                                object-fit: cover;
                                filter: brightness(${(element.filters?.brightness || 100) / 100}) contrast(${(element.filters?.contrast || 100) / 100}) saturate(${(element.filters?.saturation || 100) / 100}) sepia(${(element.filters?.tint || 0) / 100}) hue-rotate(${(element.filters?.hue || 0) * 3.6}deg) blur(${element.filters?.blur || 0}px);
                                transform: scale(${element.filters?.scale || 1}) rotate(${element.filters?.rotate || 0}deg)${element.filters?.flipHorizontal ? ' scaleX(-1)' : ''}${element.filters?.flipVertical ? ' scaleY(-1)' : ''};
                                mix-blend-mode: ${element.filters?.blendMode || 'normal'};
                                opacity: ${(element.filters?.opacity || 100) / 100};
                            `;

                            imgContainer.appendChild(img);
                            cellDiv.appendChild(imgContainer);
                        } else if (element.type === 'text') {
                            const textDiv = document.createElement('div');
                            textDiv.textContent = element.content;
                            textDiv.style.cssText = `
                                position: absolute;
                                left: ${element.position.x}px;
                                top: ${element.position.y}px;
                                font-family: ${element.style?.fontFamily || 'Arial'};
                                font-size: ${element.style?.fontSize || '16px'};
                                font-weight: ${element.style?.fontWeight || 'normal'};
                                font-style: ${element.style?.fontStyle || 'normal'};
                                text-decoration: ${element.style?.textDecoration || 'none'};
                                color: ${element.style?.color || '#000000'};
                                text-align: ${element.style?.textAlign || 'left'};
                                background: ${element.style?.backgroundColor || 'transparent'};
                                padding: ${element.style?.padding || '8px'};
                                border-radius: ${element.style?.borderRadius || '0px'};
                                border: ${element.style?.border || 'none'};
                                opacity: ${element.style?.opacity || 1};
                                z-index: ${element.zIndex || 1};
                            `;
                            
                            cellDiv.appendChild(textDiv);
                        }
                    });

                    gridDiv.appendChild(cellDiv);
                });

                pageDiv.appendChild(gridDiv);
                return pageDiv;
            };

            // 3. Renderizar todas las páginas
            const pageElements = pages.map((page, idx) => renderPage(page, idx));
            pageElements.forEach(pageEl => hiddenContainer.appendChild(pageEl));

            // Esperar a que las imágenes se carguen
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 4. Crear PDF y capturar cada página
            const pdf = new jsPDF({ 
                orientation: 'landscape', 
                unit: 'px', 
                format: [workspaceDimensions.originalWidth || 800, workspaceDimensions.originalHeight || 600] 
            });

            for (let i = 0; i < pages.length; i++) {
                console.log(`📄 Procesando página ${i + 1} de ${pages.length}...`);
                
                const pageDiv = document.getElementById(`pdf-page-${pages[i].id}`);
                if (!pageDiv) continue;

                try {
                    const canvas = await html2canvas(pageDiv, {
                        width: workspaceDimensions.originalWidth || 800,
                        height: workspaceDimensions.originalHeight || 600,
                        scale: 2, // Alta resolución para el PDF
                        backgroundColor: '#ffffff',
                        useCORS: true,
                        allowTaint: true,
                        logging: false,
                        foreignObjectRendering: true,
                        onclone: (clonedDoc, element) => {
                            // Asegurar estilos en el clon
                            const clonedPage = clonedDoc.getElementById(`pdf-page-${pages[i].id}`);
                            if (clonedPage) {
                                clonedPage.style.transform = 'none';
                                clonedPage.style.position = 'static';
                            }
                        }
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    
                    if (i > 0) {
                        pdf.addPage([workspaceDimensions.originalWidth || 800, workspaceDimensions.originalHeight || 600], 'landscape');
                    }
                    
                    pdf.addImage(
                        imgData, 
                        'JPEG', 
                        0, 
                        0, 
                        workspaceDimensions.originalWidth || 800, 
                        workspaceDimensions.originalHeight || 600
                    );
                    
                    console.log(`✅ Página ${i + 1} capturada correctamente`);
                } catch (error) {
                    console.error(`❌ Error capturando página ${i + 1}:`, error);
                }
            }

            // 5. Guardar PDF
            const albumTitle = albumData?.title || 'Album';
            const fileName = `${albumTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
            
            pdf.save(fileName);
            console.log(`🎉 PDF generado exitosamente: ${fileName}`);

            // 6. Limpiar el DOM
            if (hiddenContainer) {
                hiddenContainer.innerHTML = '';
            }

            return true;
        } catch (error) {
            console.error('❌ Error generando PDF:', error);
            return false;
        }
    };

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
                        addAlbumToCart={addAlbumToCart}
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
                              {/*  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={addAlbumToCart}
                                    icon={<Plus className="h-4 w-4" />}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Agregar al Carrito
                                </Button> */}
                                {/* Botón para limpiar progreso guardado (opcional, visible solo en desarrollo) */}
                                {process.env.NODE_ENV !== 'production' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearSavedProgress}
                                            icon={<Trash2 className="h-4 w-4" />}
                                            className="text-white hover:bg-red-500"
                                        >
                                            Limpiar progreso
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                console.log('🔍 === DIAGNÓSTICO DE MÁSCARAS ===');
                                                const pageElement = document.getElementById(`page-${pages[currentPage].id}`);
                                                
                                                if (!pageElement) {
                                                    console.error('❌ No se encontró el elemento de la página');
                                                    alert('No se encontró el elemento de la página');
                                                    return;
                                                }
                                                
                                                // Buscar elementos con máscaras
                                                const maskedElements = pageElement.querySelectorAll('[class*="mask-"]');
                                                console.log(`� Elementos con máscara encontrados: ${maskedElements.length}`);
                                                
                                                maskedElements.forEach((element, index) => {
                                                    const maskClass = Array.from(element.classList).find(cls => cls.startsWith('mask-'));
                                                    console.log(`🎭 Elemento ${index}: ${maskClass}`);
                                                    
                                                    const img = element.querySelector('img');
                                                    if (img) {
                                                        console.log(`📷 Imagen encontrada: ${img.src}`);
                                                        console.log(`� Dimensiones imagen: ${img.naturalWidth}x${img.naturalHeight}`);
                                                    }
                                                });
                                                
                                                // Crear canvas de prueba con máscaras aplicadas manualmente
                                                const testCanvas = document.createElement('canvas');
                                                const testCtx = testCanvas.getContext('2d');
                                                testCanvas.width = 400;
                                                testCanvas.height = 300;
                                                
                                                // Fondo blanco
                                                testCtx.fillStyle = '#ffffff';
                                                testCtx.fillRect(0, 0, 400, 300);
                                                
                                                // Función para aplicar máscaras
                                                const applyMask = (ctx, maskId, width, height) => {
                                                    ctx.beginPath();
                                                    
                                                    switch (maskId) {
                                                        case 'diamond':
                                                            ctx.moveTo(width / 2, 0);
                                                            ctx.lineTo(width, height / 2);
                                                            ctx.lineTo(width / 2, height);
                                                            ctx.lineTo(0, height / 2);
                                                            ctx.closePath();
                                                            break;
                                                        case 'circle':
                                                            ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
                                                            break;
                                                        case 'triangle':
                                                            ctx.moveTo(width / 2, 0);
                                                            ctx.lineTo(width, height);
                                                            ctx.lineTo(0, height);
                                                            ctx.closePath();
                                                            break;
                                                        default:
                                                            ctx.rect(0, 0, width, height);
                                                            break;
                                                    }
                                                    
                                                    ctx.clip();
                                                };
                                                
                                                // Procesar cada elemento con máscara
                                                let yOffset = 0;
                                                for (const element of maskedElements) {
                                                    const maskClass = Array.from(element.classList).find(cls => cls.startsWith('mask-'));
                                                    const maskId = maskClass ? maskClass.replace('mask-', '') : 'none';
                                                    
                                                    const img = element.querySelector('img');
                                                    if (img && img.complete) {
                                                        testCtx.save();
                                                        testCtx.translate(10, yOffset + 10);
                                                        
                                                        const testWidth = 150;
                                                        const testHeight = 100;
                                                        
                                                        // Aplicar máscara
                                                        applyMask(testCtx, maskId, testWidth, testHeight);
                                                        
                                                        // Dibujar imagen
                                                        testCtx.drawImage(img, 0, 0, testWidth, testHeight);
                                                        testCtx.restore();
                                                        
                                                        // Añadir etiqueta
                                                        testCtx.fillStyle = '#000000';
                                                        testCtx.font = '12px Arial';
                                                        testCtx.fillText(`Máscara: ${maskId}`, 170, yOffset + 30);
                                                        
                                                        yOffset += 120;
                                                    }
                                                }
                                                
                                                const testDataUrl = testCanvas.toDataURL('image/jpeg', 0.9);
                                                console.log('✅ Canvas de prueba generado');
                                                
                                                // Mostrar en una nueva ventana
                                                const newWindow = window.open('', '_blank', 'width=600,height=500');
                                                if (newWindow) {
                                                    newWindow.document.write(`
                                                        <html>
                                                            <head><title>Test Máscaras - Página ${pages[currentPage].id}</title></head>
                                                            <body style="margin:0; padding:20px; background:#f0f0f0;">
                                                                <h2>Test de Máscaras - Página ${pages[currentPage].id}</h2>
                                                                <p>Elementos con máscara encontrados: ${maskedElements.length}</p>
                                                                <div style="border:2px solid #333; display:inline-block; background:#fff;">
                                                                    <img src="${testDataUrl}" style="max-width:100%; display:block;" />
                                                                </div>
                                                                <h3>Análisis:</h3>
                                                                <ul>
                                                                    ${Array.from(maskedElements).map((el, i) => {
                                                                        const maskClass = Array.from(el.classList).find(cls => cls.startsWith('mask-'));
                                                                        return `<li>Elemento ${i + 1}: ${maskClass || 'sin máscara'}</li>`;
                                                                    }).join('')}
                                                                </ul>
                                                            </body>
                                                        </html>
                                                    `);
                                                }
                                            }}
                                            icon={<Eye className="h-4 w-4" />}
                                            className="text-white hover:bg-blue-500"
                                        >
                                            Test Máscaras
                                        </Button>
                                    </>
                                )}
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
                                    <div className="space-y-3 max-h-full">
                                        {(() => {
                                            const currentElement = getSelectedElement();

                                            return currentElement ? (
                                                <>
                                                    {/* Element preview */}
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

                                                    {/* Masks section for images */}
                                                    {currentElement.type === "image" && (
                                                        <div className="border-t pt-3">
                                                            <h3 className="font-medium text-xs uppercase customtext-neutral-dark mb-2">
                                                                Máscaras
                                                            </h3>
                                                            <MaskSelector
                                                                selectedMask={currentElement.mask || "none"}
                                                                onSelect={(maskId) => {
                                                                    updateElementInCell(
                                                                        selectedCell,
                                                                        selectedElement,
                                                                        { mask: maskId }
                                                                    );
                                                                }}
                                                                availableMasks={imageMasks.map(m => m.id)}
                                                                selectedImage={currentElement}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Filters section */}
                                                    <div className="border-t pt-3">
                                                        <h3 className="font-medium text-xs uppercase customtext-neutral-dark mb-2">
                                                            Filtros y efectos
                                                        </h3>
                                                        <div className="">
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
                                                        </div>
                                                    </div>
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
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                            
                            {/* Test section - Debugging tools */}
                            <div className="p-3 border-t bg-gray-50">
                                <h4 className="text-xs font-medium text-gray-500 mb-2">🧪 Herramientas de Test</h4>
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            console.log('🎯 Test: Análisis de object-fit en página actual');
                                            
                                            const pageElement = document.getElementById(`page-${pages[currentPage].id}`);
                                            if (!pageElement) {
                                                console.error('❌ No se encontró el elemento de la página');
                                                return;
                                            }
                                            
                                            // Encontrar todas las imágenes con contenedores
                                            const imageElements = pageElement.querySelectorAll('img:not([alt="background"])');
                                            console.log(`🖼️ Imágenes encontradas: ${imageElements.length}`);
                                            
                                            const analysis = [];
                                            
                                            imageElements.forEach((img, index) => {
                                                const container = img.parentElement;
                                                const computedStyle = window.getComputedStyle(img);
                                                
                                                const imgRect = img.getBoundingClientRect();
                                                const containerRect = container.getBoundingClientRect();
                                                
                                                analysis.push({
                                                    index,
                                                    naturalSize: { w: img.naturalWidth, h: img.naturalHeight },
                                                    displaySize: { w: imgRect.width, h: imgRect.height },
                                                    containerSize: { w: containerRect.width, h: containerRect.height },
                                                    objectFit: computedStyle.objectFit,
                                                    objectPosition: computedStyle.objectPosition,
                                                    maskClass: Array.from(container.classList).find(cls => cls.startsWith('mask-')) || 'none',
                                                    aspectRatio: {
                                                        natural: (img.naturalWidth / img.naturalHeight).toFixed(3),
                                                        display: (imgRect.width / imgRect.height).toFixed(3),
                                                        container: (containerRect.width / containerRect.height).toFixed(3)
                                                    }
                                                });
                                            });
                                            
                                            console.table(analysis);
                                            
                                            // Mostrar ventana con análisis
                                            const newWindow = window.open('', '_blank', 'width=800,height=600');
                                            if (newWindow) {
                                                newWindow.document.write(`
                                                    <html>
                                                        <head><title>Análisis object-fit - Página ${pages[currentPage].id}</title></head>
                                                        <body style="margin:0; padding:20px; font-family:monospace; background:#f9f9f9;">
                                                            <h2>🔍 Análisis de object-fit: cover</h2>
                                                            <p><strong>Página:</strong> ${pages[currentPage].id} (${pages[currentPage].type})</p>
                                                            <p><strong>Imágenes analizadas:</strong> ${analysis.length}</p>
                                                            
                                                            ${analysis.map((item, i) => `
                                                                <div style="border:1px solid #ddd; margin:10px 0; padding:15px; background:white;">
                                                                    <h3>🖼️ Imagen ${i + 1}</h3>
                                                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                                                                        <div>
                                                                            <h4>📐 Dimensiones</h4>
                                                                            <p><strong>Natural:</strong> ${item.naturalSize.w} × ${item.naturalSize.h}</p>
                                                                            <p><strong>Display:</strong> ${item.displaySize.w.toFixed(1)} × ${item.displaySize.h.toFixed(1)}</p>
                                                                            <p><strong>Container:</strong> ${item.containerSize.w.toFixed(1)} × ${item.containerSize.h.toFixed(1)}</p>
                                                                        </div>
                                                                        <div>
                                                                            <h4>🎨 CSS & Máscaras</h4>
                                                                            <p><strong>object-fit:</strong> ${item.objectFit}</p>
                                                                            <p><strong>object-position:</strong> ${item.objectPosition}</p>
                                                                            <p><strong>Máscara:</strong> ${item.maskClass}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h4>📊 Aspect Ratios</h4>
                                                                        <p><strong>Natural:</strong> ${item.aspectRatio.natural}</p>
                                                                        <p><strong>Display:</strong> ${item.aspectRatio.display}</p>
                                                                        <p><strong>Container:</strong> ${item.aspectRatio.container}</p>
                                                                        <p style="color:${item.objectFit === 'cover' ? '#22c55e' : '#ef4444'};">
                                                                            <strong>Object-fit status:</strong> ${item.objectFit === 'cover' ? '✅ COVER aplicado' : '❌ NO es cover'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            `).join('')}
                                                            
                                                            <div style="margin-top:20px; padding:15px; background:#eff6ff; border:1px solid #93c5fd;">
                                                                <h3>💡 Información técnica</h3>
                                                                <p>• <strong>object-fit: cover</strong> significa que la imagen se escala para llenar completamente el contenedor manteniendo su proporción</p>
                                                                <p>• Si el aspect ratio natural difiere del container, la imagen se recortará</p>
                                                                <p>• <strong>object-position</strong> controla qué parte de la imagen se muestra cuando hay recorte</p>
                                                                <p>• Las máscaras (diamond, circle, etc.) se aplican encima del object-fit</p>
                                                            </div>
                                                        </body>
                                                    </html>
                                                `);
                                            }
                                        }}
                                        className="w-full justify-start text-xs"
                                    >
                                        🔍 Analizar Object-fit
                                    </Button>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            console.log('🎯 Test: Forzar regeneración de thumbnail');
                                            
                                            // Forzar regeneración inmediata
                                            setPageThumbnails(prev => {
                                                const updated = { ...prev };
                                                delete updated[pages[currentPage].id];
                                                return updated;
                                            });
                                            
                                            setTimeout(() => {
                                                console.log('🔄 Thumbnail eliminado, se regenerará automáticamente...');
                                            }, 100);
                                        }}
                                        className="w-full justify-start text-xs"
                                    >
                                        🔄 Regenerar Thumbnail
                                    </Button>
                                </div>
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
                                    <div className="bg-white  shadow-lg">
                                        <div
                                            className="overflow-hidden"
                                            style={{
                                                width: workspaceDimensions.width,
                                                height: workspaceDimensions.height,
                                            }}
                                        >
                                            <div
                                                id={`page-${pages[currentPage].id}-preview`}
                                                className={`grid ${getCurrentLayout().template} gap-6`}
                                                style={{ width: '100%', height: '100%' }}
                                            >
                                                {pages[currentPage].cells.map((cell) => (
                                                    <div
                                                        key={cell.id}
                                                        className="relative bg-gray-50  overflow-hidden"
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
                                                                    data-element-type="text"
                                                                    data-element-id={element.id}
                                                                    style={{
                                                                        left: element.position.x <= 1 ? `${element.position.x * 100}%` : `${element.position.x}px`,
                                                                        top: element.position.y <= 1 ? `${element.position.y * 100}%` : `${element.position.y}px`,
                                                                        fontFamily: element.style?.fontFamily || "Arial, sans-serif",
                                                                        fontSize: element.style?.fontSize || "16px",
                                                                        fontWeight: element.style?.fontWeight || "normal",
                                                                        fontStyle: element.style?.fontStyle || "normal",
                                                                        textDecoration: element.style?.textDecoration || "none",
                                                                        color: element.style?.color || "#000000",
                                                                        textAlign: element.style?.textAlign || "left",
                                                                        backgroundColor: element.style?.backgroundColor || "transparent",
                                                                        padding: element.style?.padding || "8px",
                                                                        borderRadius: element.style?.borderRadius || "0px",
                                                                        border: element.style?.border || "none",
                                                                        opacity: element.style?.opacity !== undefined ? element.style.opacity : 1,
                                                                        zIndex: element.zIndex || 10,
                                                                        pointerEvents: 'none',
                                                                        userSelect: 'none',
                                                                        // Asegurar que el texto sea siempre visible
                                                                        minHeight: '20px',
                                                                        display: 'block'
                                                                    }}
                                                                >
                                                                    {element.content || "Texto"}
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
                                        className="bg-white  shadow-xl"
                                        style={{
                                            width: workspaceDimensions.width,
                                            height: workspaceDimensions.height,
                                            position: 'relative',
                                            // Propiedades para mejorar la captura con html2canvas
                                            isolation: 'isolate',
                                            contain: 'layout style paint',
                                            WebkitTransform: 'translateZ(0)', // Forzar aceleración por hardware
                                            transform: 'translateZ(0)',
                                            // Asegurar que el contenido no se corte
                                            overflow: 'visible',
                                            // Fondo explícito para captura
                                            backgroundColor: '#ffffff'
                                        }}
                                        data-capture-element="page"
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
                                                className={`relative group flex flex-col cursor-pointer  transition-all duration-200 transform 
                            ${currentPage === pages.indexOf(page)
                                                        ? "ring-2 ring-purple-400 scale-[1.02] shadow-md"
                                                        : "hover:bg-gray-50 border border-transparent hover:border-gray-200"}
                            mb-2`}
                                                onClick={() => setCurrentPage(pages.indexOf(page))}
                                            >
                                                <div className="relative bg-purple-50 overflow-hidden border min-h-[120px] max-h-[160px] flex items-center justify-center">
                                                    {pageThumbnails[page.id] ? (
                                                        <img
                                                            src={pageThumbnails[page.id]}
                                                            alt="Portada"
                                                            className="max-w-full max-h-full object-contain"
                                                            style={{ 
                                                                width: 'auto', 
                                                                height: 'auto',
                                                                display: 'block'
                                                            }}
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
                                                    className={`relative group flex flex-col cursor-pointer  transition-all duration-200 transform 
                                ${currentPage === pages.indexOf(page)
                                                            ? "ring-2 ring-purple-400 scale-[1.02] shadow-md"
                                                            : "hover:bg-gray-50 border border-transparent hover:border-gray-200"}
                                mb-1`}
                                                    onClick={() => setCurrentPage(pages.indexOf(page))}
                                                >
                                                    <div className="relative overflow-hidden border min-h-[120px] max-h-[160px] flex items-center justify-center bg-gray-50">
                                                        {pageThumbnails[page.id] ? (
                                                            <img
                                                                src={pageThumbnails[page.id]}
                                                                alt={`Página ${page.pageNumber}`}
                                                                className="max-w-full max-h-full object-contain"
                                                                style={{ 
                                                                    width: 'auto', 
                                                                    height: 'auto',
                                                                    display: 'block'
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <div
                                                                    className={`grid ${getCurrentLayout().template} gap-0.5 w-full h-full `}
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
                                                className={`relative group flex flex-col cursor-pointer  transition-all duration-200 transform 
                            ${currentPage === pages.indexOf(page)
                                                        ? "ring-2 ring-purple-400 scale-[1.02] shadow-md"
                                                        : "hover:bg-gray-50 border border-transparent hover:border-gray-200"}
                            mb-2`}
                                                onClick={() => setCurrentPage(pages.indexOf(page))}
                                            >
                                                <div className="relative overflow-hidden border mb-1 min-h-[120px] max-h-[160px] flex items-center justify-center bg-green-50">
                                                    {pageThumbnails[page.id] ? (
                                                        <img
                                                            src={pageThumbnails[page.id]}
                                                            alt="Contraportada"
                                                            className="max-w-full max-h-full object-contain"
                                                            style={{ 
                                                                width: 'auto', 
                                                                height: 'auto',
                                                                display: 'block'
                                                            }}
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
            
            {/* Toaster para notificaciones */}
            <Toaster />
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
