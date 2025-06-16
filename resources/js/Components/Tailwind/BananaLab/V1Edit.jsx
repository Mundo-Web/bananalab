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
} from "lucide-react";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { layouts } from "./constants/layouts";
import { imageMasks } from "./constants/masks";
import { filterPresets } from "./constants/filters";
import Button from "./components/UI/Button";

import Slider from "./components/UI/Slider";
import EditableCell from "./components/Elements/EditableCell";
import { AdvancedSettings } from "./components/Editor/AdvancedSettings";
import { FilterPresets } from "./components/Editor/FilterPresets";
import { MaskSelector } from "./components/Elements/MaskSelector";
import TextToolbar from "./components/Elements/TextToolbar";
import WorkspaceControls from "./components/Elements/WorkspaceControls";
import BookPreviewModal from "./components/Editor/BookPreview";

// Componente principal del editor
export default function EditorLibro_2() {
    const [pages, setPages] = useState([
        {
            id: "page-1",
            layout: "layout-1",
            cells: Array.from({ length: 4 }).map((_, i) => ({
                id: `cell-1-${i + 1}`,
                elements: [],
            })),
        },
    ]);

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
    // Modifica la función getSelectedElement para que use useCallback
    const getSelectedElement = useCallback(() => {
        if (!selectedElement || !selectedCell) return null;
        const cell = pages[currentPage].cells.find(
            (cell) => cell.id === selectedCell
        );
        if (!cell) return null;
        return cell.elements.find((el) => el.id === selectedElement);
    }, [selectedElement, selectedCell, pages, currentPage]);

    // Añade esta función para manejar la selección de elementos
    const handleSelectElement = (elementId, cellId) => {
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
        return (
            layouts.find((layout) => layout.id === pages[currentPage].layout) ||
            layouts[0]
        );
    };

    // Obtener el elemento seleccionado
    /* const getSelectedElement = () => {
        if (!selectedElement || !selectedCell) return null;

        const cell = pages[currentPage].cells.find(
            (cell) => cell.id === selectedCell
        );
        if (!cell) return null;

        return cell.elements.find((el) => el.id === selectedElement);
    };*/

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

    // Añadir una nueva página
    const addPage = () => {
        const newPageId = `page-${pages.length + 1}`;
        const layout = getCurrentLayout();
        const newPage = {
            id: newPageId,
            layout: layout.id,
            cells: Array.from({ length: layout.cells }).map((_, index) => ({
                id: `cell-${newPageId}-${index + 1}`,
                elements: [],
            })),
        };

        const updatedPages = [...pages, newPage];
        updatePages(updatedPages);
        setCurrentPage(updatedPages.length - 1);
    };

    // Eliminar la página actual
    const deleteCurrentPage = () => {
        if (pages.length <= 1) return;

        const updatedPages = pages.filter((_, index) => index !== currentPage);
        updatePages(updatedPages);
        setCurrentPage(Math.min(currentPage, updatedPages.length - 1));
    };

    // Duplicar la página actual
    const duplicateCurrentPage = () => {
        const currentPageData = pages[currentPage];
        const newPage = {
            ...JSON.parse(JSON.stringify(currentPageData)),
            id: `page-${pages.length + 1}-copy`,
        };

        const updatedPages = [...pages, newPage];
        updatePages(updatedPages);
        setCurrentPage(updatedPages.length - 1);
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
            position: { x: 20, y: 20 },
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

    const [workspaceSize, setWorkspaceSize] = useState("square");

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
                            const canvas = await html2canvas(pageElement, {
                                scale: 0.2,
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
            <div className="bg-white py-4">
                <div className="flex flex-col min-h-screen  mx-auto  max-w-[82rem]">
                    {/* Header */}
                    <header className="border-b bg-white py-4 flex items-center justify-between ">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                                <ChevronLeft className="h-5 w-5 mr-1" />
                                Regresar
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={togglePreview}
                                icon={<Eye className="h-4 w-4" />}
                            >
                                {previewMode ? "Editar" : "Vista previa"}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setIsBookPreviewOpen(true)}
                                icon={<Book className="h-4 w-4" />} // Asegúrate de importar el icono Book
                            >
                                Vista de Álbum
                            </Button>
                            {/*  <Button
                                className="bg-purple-600 hover:bg-purple-700"
                                icon={<Download className="h-4 w-4" />}
                                onClick={exportPage}
                            >
                                Exportar
                            </Button>*/}
                        </div>
                    </header>

                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar izquierdo */}
                        <aside className="w-64 border-r bg-white p-4 overflow-y-auto shadow-sm">
                            <div className="space-y-6">
                                <div className="flex border-b pb-4">
                                    <button
                                        className={`flex-1 py-2 text-sm font-medium ${
                                            activeTab === "elements"
                                                ? "text-purple-600 border-b-2 border-purple-600"
                                                : "text-gray-600 hover:text-gray-900"
                                        }`}
                                        onClick={() => setActiveTab("elements")}
                                    >
                                        Elementos
                                    </button>
                                    <button
                                        className={`flex-1 py-2 text-sm font-medium ${
                                            activeTab === "filters"
                                                ? "text-purple-600 border-b-2 border-purple-600"
                                                : "text-gray-600 hover:text-gray-900"
                                        }`}
                                        onClick={() => setActiveTab("filters")}
                                    >
                                        Filtros
                                    </button>
                                </div>

                                {activeTab === "elements" && (
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-medium mb-2">
                                                Layouts
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {layouts.map((layout) => (
                                                    <div
                                                        key={layout.id}
                                                        className={`border rounded-md p-1 cursor-pointer hover:border-purple-500 ${
                                                            pages[currentPage]
                                                                .layout ===
                                                            layout.id
                                                                ? "border-purple-500 ring-1 ring-purple-200"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            changeLayout(
                                                                layout.id
                                                            )
                                                        }
                                                    >
                                                        <div
                                                            className={`grid ${layout.template} gap-1 h-20`}
                                                        >
                                                            {Array.from({
                                                                length: layout.cells,
                                                            }).map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="bg-gray-100 rounded-sm flex items-center justify-center"
                                                                >
                                                                    <ImageIcon className="h-3 w-3 text-gray-400" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-center mt-1 truncate">
                                                            {layout.name}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            {/* Panel de capas */}
                                            <LayerPanel
                                                elements={
                                                    pages[
                                                        currentPage
                                                    ].cells.find(
                                                        (cell) =>
                                                            cell.id ===
                                                            selectedCell
                                                    )?.elements || []
                                                }
                                                onReorder={(
                                                    reorderedElements
                                                ) => {
                                                    const updatedPages = [
                                                        ...pages,
                                                    ];
                                                    const cellIndex =
                                                        updatedPages[
                                                            currentPage
                                                        ].cells.findIndex(
                                                            (cell) =>
                                                                cell.id ===
                                                                selectedCell
                                                        );
                                                    if (cellIndex !== -1) {
                                                        updatedPages[
                                                            currentPage
                                                        ].cells[
                                                            cellIndex
                                                        ].elements =
                                                            reorderedElements;
                                                        updatePages(
                                                            updatedPages
                                                        );
                                                    }
                                                }}
                                                onSelect={handleSelectElement}
                                                selectedElement={
                                                    selectedElement
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "filters" && (
                                    <>
                                        {selectedElement ? (
                                            <div className="space-y-6">
                                                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-full max-w-md mx-auto">
                                                    {[
                                                        {
                                                            key: "basic",
                                                            label: "Básicos",
                                                        },
                                                        {
                                                            key: "transform",
                                                            label: "Avanzados",
                                                        },
                                                    ].map((tab) => (
                                                        <button
                                                            key={tab.key}
                                                            onClick={() =>
                                                                setFilterTab(
                                                                    tab.key
                                                                )
                                                            }
                                                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${
                    filterTab === tab.key
                        ? "bg-purple-600 text-white shadow"
                        : "text-gray-700 hover:bg-white hover:shadow-sm"
                }`}
                                                        >
                                                            {tab.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {filterTab === "basic" && (
                                                    <>
                                                        <FilterPresets
                                                            onSelectPreset={
                                                                applyFilterPreset
                                                            }
                                                            selectedImage={
                                                                selectedImage
                                                            }
                                                        />
                                                        <div className="space-y-4">
                                                            <h3 className="font-medium">
                                                                Ajustes básicos
                                                            </h3>
                                                            <Slider
                                                                label="Brillo"
                                                                value={[
                                                                    getSelectedElement()
                                                                        ?.filters
                                                                        ?.brightness ||
                                                                        100,
                                                                ]}
                                                                min={0}
                                                                max={200}
                                                                onValueChange={(
                                                                    value
                                                                ) =>
                                                                    updateElementInCell(
                                                                        selectedCell,
                                                                        selectedElement,
                                                                        {
                                                                            filters:
                                                                                {
                                                                                    ...getSelectedElement()
                                                                                        ?.filters,
                                                                                    brightness:
                                                                                        value[0],
                                                                                },
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                            <Slider
                                                                label="Contraste"
                                                                value={[
                                                                    getSelectedElement()
                                                                        ?.filters
                                                                        ?.contrast ||
                                                                        100,
                                                                ]}
                                                                min={0}
                                                                max={200}
                                                                onValueChange={(
                                                                    value
                                                                ) =>
                                                                    updateElementInCell(
                                                                        selectedCell,
                                                                        selectedElement,
                                                                        {
                                                                            filters:
                                                                                {
                                                                                    ...getSelectedElement()
                                                                                        ?.filters,
                                                                                    contrast:
                                                                                        value[0],
                                                                                },
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                            <Slider
                                                                label="Saturación"
                                                                value={[
                                                                    getSelectedElement()
                                                                        ?.filters
                                                                        ?.saturation ||
                                                                        100,
                                                                ]}
                                                                min={0}
                                                                max={200}
                                                                onValueChange={(
                                                                    value
                                                                ) =>
                                                                    updateElementInCell(
                                                                        selectedCell,
                                                                        selectedElement,
                                                                        {
                                                                            filters:
                                                                                {
                                                                                    ...getSelectedElement()
                                                                                        ?.filters,
                                                                                    saturation:
                                                                                        value[0],
                                                                                },
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                            <Slider
                                                                label="Tono"
                                                                value={[
                                                                    getSelectedElement()
                                                                        ?.filters
                                                                        ?.hue ||
                                                                        0,
                                                                ]}
                                                                min={0}
                                                                max={360}
                                                                unit="°"
                                                                onValueChange={(
                                                                    value
                                                                ) =>
                                                                    updateElementInCell(
                                                                        selectedCell,
                                                                        selectedElement,
                                                                        {
                                                                            filters:
                                                                                {
                                                                                    ...getSelectedElement()
                                                                                        ?.filters,
                                                                                    hue: value[0],
                                                                                },
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                            <Slider
                                                                label="Sepia"
                                                                value={[
                                                                    getSelectedElement()
                                                                        ?.filters
                                                                        ?.tint ||
                                                                        0,
                                                                ]}
                                                                min={0}
                                                                max={100}
                                                                onValueChange={(
                                                                    value
                                                                ) =>
                                                                    updateElementInCell(
                                                                        selectedCell,
                                                                        selectedElement,
                                                                        {
                                                                            filters:
                                                                                {
                                                                                    ...getSelectedElement()
                                                                                        ?.filters,
                                                                                    tint: value[0],
                                                                                },
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                            <Slider
                                                                label="Desenfoque"
                                                                value={[
                                                                    getSelectedElement()
                                                                        ?.filters
                                                                        ?.blur ||
                                                                        0,
                                                                ]}
                                                                min={0}
                                                                max={20}
                                                                unit="px"
                                                                onValueChange={(
                                                                    value
                                                                ) =>
                                                                    updateElementInCell(
                                                                        selectedCell,
                                                                        selectedElement,
                                                                        {
                                                                            filters:
                                                                                {
                                                                                    ...getSelectedElement()
                                                                                        ?.filters,
                                                                                    blur: value[0],
                                                                                },
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {filterTab === "transform" && (
                                                    <div className="space-y-4">
                                                        {getSelectedElement()
                                                            ?.type ===
                                                            "image" && (
                                                            <MaskSelector
                                                                onSelect={(
                                                                    mask
                                                                ) =>
                                                                    updateElementInCell(
                                                                        selectedCell,
                                                                        selectedElement,
                                                                        { mask }
                                                                    )
                                                                }
                                                                selectedMask={
                                                                    getSelectedElement()
                                                                        ?.mask ||
                                                                    "none"
                                                                }
                                                                availableMasks={getCurrentLayout().maskCategories.flatMap(
                                                                    (cat) =>
                                                                        cat.masks
                                                                )}
                                                                selectedImage={
                                                                    selectedImage
                                                                }
                                                            />
                                                        )}
                                                        <AdvancedSettings
                                                            selectedImage={
                                                                selectedImage
                                                            }
                                                            element={getSelectedElement()}
                                                            onUpdate={(
                                                                updates
                                                            ) =>
                                                                updateElementInCell(
                                                                    selectedCell,
                                                                    selectedElement,
                                                                    updates
                                                                )
                                                            }
                                                        />

                                                        <div className="mt-6 space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <h3 className=" font-medium pt-4">
                                                                    Transformación
                                                                </h3>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Button
                                                                    variant={
                                                                        getSelectedElement()
                                                                            ?.filters
                                                                            ?.flipHorizontal
                                                                            ? "secondary"
                                                                            : "outline"
                                                                    }
                                                                    size="sm"
                                                                    icon={
                                                                        <FlipHorizontal className="h-4 w-4" />
                                                                    }
                                                                    className="justify-start "
                                                                    onClick={() =>
                                                                        updateElementInCell(
                                                                            selectedCell,
                                                                            selectedElement,
                                                                            {
                                                                                filters:
                                                                                    {
                                                                                        ...getSelectedElement()
                                                                                            ?.filters,
                                                                                        flipHorizontal:
                                                                                            !getSelectedElement()
                                                                                                ?.filters
                                                                                                ?.flipHorizontal,
                                                                                    },
                                                                            }
                                                                        )
                                                                    }
                                                                >
                                                                    Giro
                                                                    Horizontal
                                                                </Button>
                                                                <Button
                                                                    variant={
                                                                        getSelectedElement()
                                                                            ?.filters
                                                                            ?.flipVertical
                                                                            ? "secondary"
                                                                            : "outline"
                                                                    }
                                                                    size="sm"
                                                                    icon={
                                                                        <FlipVertical className="h-4 w-4" />
                                                                    }
                                                                    className="justify-start"
                                                                    onClick={() =>
                                                                        updateElementInCell(
                                                                            selectedCell,
                                                                            selectedElement,
                                                                            {
                                                                                filters:
                                                                                    {
                                                                                        ...getSelectedElement()
                                                                                            ?.filters,
                                                                                        flipVertical:
                                                                                            !getSelectedElement()
                                                                                                ?.filters
                                                                                                ?.flipVertical,
                                                                                    },
                                                                            }
                                                                        )
                                                                    }
                                                                >
                                                                    Giro
                                                                    Vertical
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Slider
                                                                    label="Rotación"
                                                                    value={[
                                                                        getSelectedElement()
                                                                            ?.filters
                                                                            ?.rotate ||
                                                                            0,
                                                                    ]}
                                                                    min={0}
                                                                    max={360}
                                                                    unit="°"
                                                                    onValueChange={(
                                                                        value
                                                                    ) =>
                                                                        updateElementInCell(
                                                                            selectedCell,
                                                                            selectedElement,
                                                                            {
                                                                                filters:
                                                                                    {
                                                                                        ...getSelectedElement()
                                                                                            ?.filters,
                                                                                        rotate: value[0],
                                                                                    },
                                                                            }
                                                                        )
                                                                    }
                                                                />
                                                                <Slider
                                                                    label="Escala"
                                                                    value={[
                                                                        (getSelectedElement()
                                                                            ?.filters
                                                                            ?.scale ||
                                                                            1) *
                                                                            100,
                                                                    ]}
                                                                    min={10}
                                                                    max={200}
                                                                    unit="%"
                                                                    onValueChange={(
                                                                        value
                                                                    ) =>
                                                                        updateElementInCell(
                                                                            selectedCell,
                                                                            selectedElement,
                                                                            {
                                                                                filters:
                                                                                    {
                                                                                        ...getSelectedElement()
                                                                                            ?.filters,
                                                                                        scale:
                                                                                            value[0] /
                                                                                            100,
                                                                                    },
                                                                            }
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <h2 className="font-medium text-center">
                                                Agrega imágenes y textos al área
                                                de trabajo y selecciona tu
                                                imagen para ver nuevas opciones
                                            </h2>
                                        )}
                                    </>
                                )}
                            </div>
                        </aside>
                        <BookPreviewModal
                            isOpen={isBookPreviewOpen}
                            onRequestClose={() => setIsBookPreviewOpen(false)}
                            pages={pages.map((page) => ({
                                ...page,
                                layout:
                                    layouts.find((l) => l.id === page.layout) ||
                                    layouts[0],
                            }))}
                            workspaceDimensions={workspaceDimensions}
                            getCurrentLayout={(page) => {
                                if (!page) return layouts[0];
                                return layouts.find((l) => l.id === page.layout) || layouts[0];
                            }}
                            presetData={presetData}
                            pageThumbnails={pageThumbnails}
                        />

                        {/* Área principal de edición */}
                        <main className="flex-1 overflow-auto bg-gray-100 p-6">
                            <div className="max-w-5xl mx-auto ">
                                {previewMode ? (
                                    <div className="bg-white p-8 rounded-lg shadow-lg page-preview">
                                        <div
                                            className={`grid ${
                                                getCurrentLayout().template
                                            } gap-6 aspect-[4/3]`}
                                        >
                                            {pages[currentPage].cells.map(
                                                (cell) => (
                                                    <div
                                                        key={cell.id}
                                                        className="relative bg-gray-50 rounded-lg overflow-hidden"
                                                    >
                                                        {cell.elements.map(
                                                            (element) =>
                                                                element.type ===
                                                                "image" ? (
                                                                    <div
                                                                        key={
                                                                            element.id
                                                                        }
                                                                        className={`absolute ${
                                                                            imageMasks.find(
                                                                                (
                                                                                    m
                                                                                ) =>
                                                                                    m.id ===
                                                                                    element.mask
                                                                            )
                                                                                ?.class ||
                                                                            ""
                                                                        }`}
                                                                        style={{
                                                                            left: `${element.position.x}px`,
                                                                            top: `${element.position.y}px`,
                                                                            width: "100%",
                                                                            height: "100%",
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={
                                                                                element.content
                                                                            }
                                                                            alt=""
                                                                            className="w-full h-full object-cover"
                                                                            style={{
                                                                                filter: `
                                    brightness(${
                                        (element.filters?.brightness || 100) /
                                        100
                                    })
                                    contrast(${
                                        (element.filters?.contrast || 100) / 100
                                    })
                                    saturate(${
                                        (element.filters?.saturation || 100) /
                                        100
                                    })
                                    sepia(${(element.filters?.tint || 0) / 100})
                                    hue-rotate(${
                                        (element.filters?.hue || 0) * 3.6
                                    }deg)
                                    blur(${element.filters?.blur || 0}px)
                                  `,
                                                                                transform: `scale(${
                                                                                    element
                                                                                        .filters
                                                                                        ?.scale ||
                                                                                    1
                                                                                }) rotate(${
                                                                                    element
                                                                                        .filters
                                                                                        ?.rotate ||
                                                                                    0
                                                                                }deg) ${
                                                                                    element
                                                                                        .filters
                                                                                        ?.flipHorizontal
                                                                                        ? "scaleX(-1)"
                                                                                        : ""
                                                                                } ${
                                                                                    element
                                                                                        .filters
                                                                                        ?.flipVertical
                                                                                        ? "scaleY(-1)"
                                                                                        : ""
                                                                                }`,
                                                                                mixBlendMode:
                                                                                    element
                                                                                        .filters
                                                                                        ?.blendMode ||
                                                                                    "normal",
                                                                                opacity:
                                                                                    (element
                                                                                        .filters
                                                                                        ?.opacity ||
                                                                                        100) /
                                                                                    100,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        key={
                                                                            element.id
                                                                        }
                                                                        className="absolute"
                                                                        style={{
                                                                            left: `${element.position.x}px`,
                                                                            top: `${element.position.y}px`,
                                                                            fontFamily:
                                                                                element
                                                                                    .style
                                                                                    ?.fontFamily,
                                                                            fontSize:
                                                                                element
                                                                                    .style
                                                                                    ?.fontSize,
                                                                            fontWeight:
                                                                                element
                                                                                    .style
                                                                                    ?.fontWeight,
                                                                            fontStyle:
                                                                                element
                                                                                    .style
                                                                                    ?.fontStyle,
                                                                            textDecoration:
                                                                                element
                                                                                    .style
                                                                                    ?.textDecoration,
                                                                            color: element
                                                                                .style
                                                                                ?.color,
                                                                            textAlign:
                                                                                element
                                                                                    .style
                                                                                    ?.textAlign,
                                                                            backgroundColor:
                                                                                element
                                                                                    .style
                                                                                    ?.backgroundColor ||
                                                                                "transparent",
                                                                            padding:
                                                                                element
                                                                                    .style
                                                                                    ?.padding ||
                                                                                "8px",
                                                                            borderRadius:
                                                                                element
                                                                                    .style
                                                                                    ?.borderRadius ||
                                                                                "0px",
                                                                            border:
                                                                                element
                                                                                    .style
                                                                                    ?.border ||
                                                                                "none",
                                                                            opacity:
                                                                                element
                                                                                    .style
                                                                                    ?.opacity ||
                                                                                1,
                                                                        }}
                                                                    >
                                                                        {
                                                                            element.content
                                                                        }
                                                                    </div>
                                                                )
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Barra de herramientas */}

                                        {textToolbarVisible ? (
                                            <TextToolbar
                                                element={getSelectedElement()}
                                                onUpdate={(updates) => {
                                                    updateElementInCell(
                                                        textEditingOptions.cellId,
                                                        textEditingOptions.elementId,
                                                        updates
                                                    );
                                                }}
                                                onClose={() =>
                                                    setTextToolbarVisible(false)
                                                }
                                            />
                                        ) : (
                                            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={undo}
                                                    disabled={historyIndex <= 0}
                                                >
                                                    <Undo2 className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={redo}
                                                    disabled={
                                                        historyIndex >=
                                                        history.length - 1
                                                    }
                                                >
                                                    <Redo2 className="h-5 w-5" />
                                                </Button>
                                                <div className="h-6 border-l"></div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const input =
                                                            document.createElement(
                                                                "input"
                                                            );
                                                        input.type = "file";
                                                        input.accept =
                                                            "image/*";
                                                        input.onchange = (
                                                            e
                                                        ) => {
                                                            if (
                                                                e.target
                                                                    .files &&
                                                                e.target
                                                                    .files[0]
                                                            ) {
                                                                const newId = `img-${Date.now()}`;
                                                                const newElement =
                                                                    {
                                                                        id: newId,
                                                                        type: "image",
                                                                        content:
                                                                            "",
                                                                        position:
                                                                            {
                                                                                x: 10,
                                                                                y: 10,
                                                                            },
                                                                        filters:
                                                                            {
                                                                                brightness: 100,
                                                                                contrast: 100,
                                                                                saturation: 100,
                                                                                tint: 0,
                                                                                hue: 0,
                                                                                blur: 0,
                                                                                scale: 1,
                                                                                rotate: 0,
                                                                                opacity: 100,
                                                                                blendMode:
                                                                                    "normal",
                                                                            },
                                                                        mask: "none",
                                                                    };

                                                                const reader =
                                                                    new FileReader();
                                                                reader.onload =
                                                                    (e) => {
                                                                        if (
                                                                            e
                                                                                .target
                                                                                ?.result
                                                                        ) {
                                                                            newElement.content =
                                                                                e.target.result;
                                                                            if (
                                                                                selectedCell
                                                                            ) {
                                                                                addElementToCell(
                                                                                    selectedCell,
                                                                                    newElement
                                                                                );
                                                                            } else {
                                                                                addElementToCell(
                                                                                    pages[
                                                                                        currentPage
                                                                                    ]
                                                                                        .cells[0]
                                                                                        .id,
                                                                                    newElement
                                                                                );
                                                                            }
                                                                        }
                                                                    };
                                                                reader.readAsDataURL(
                                                                    e.target
                                                                        .files[0]
                                                                );
                                                            }
                                                        };
                                                        input.click();
                                                    }}
                                                >
                                                    <ImageIcon className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={handleAddText}
                                                >
                                                    <Type className="h-5 w-5" />
                                                </Button>
                                                <div className="h-6 border-l"></div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        if (
                                                            selectedElement &&
                                                            selectedCell
                                                        ) {
                                                            deleteElementFromCell(
                                                                selectedCell,
                                                                selectedElement
                                                            );
                                                        }
                                                    }}
                                                    disabled={!selectedElement}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                                <WorkspaceControls
                                                    currentSize={workspaceSize}
                                                    onSizeChange={
                                                        setWorkspaceSize
                                                    }
                                                />
                                            </div>
                                        )}
                                        {/* Área de edición */}
                                        <div
                                            id={`page-${pages[currentPage].id}`}
                                            className={`bg-white rounded-lg shadow-lg overflow-hidden page-preview w-full ${
                                                getCurrentLayout().cells <= 4
                                                    ? ""
                                                    : ""
                                            }`}
                                            style={{
                                                width: workspaceSize.width,
                                                height: workspaceSize.height,
                                            }}
                                        >
                                            <div
                                                className={`grid ${
                                                    getCurrentLayout().template
                                                } gap-4   p-4 max-h-full`}
                                            >
                                                {pages[currentPage].cells.map(
                                                    (cell) => (
                                                        <EditableCell
                                                            key={cell.id}
                                                            id={cell.id}
                                                            elements={
                                                                cell.elements
                                                            }
                                                            size={workspaceSize}
                                                            selectedElement={
                                                                selectedCell ===
                                                                cell.id
                                                                    ? selectedElement
                                                                    : null
                                                            }
                                                            /*   onSelectElement={(
                                                                elementId
                                                            ) => {
                                                                setSelectedElement(
                                                                    elementId
                                                                );
                                                                setSelectedCell(
                                                                    cell.id
                                                                );
                                                            }}*/
                                                            onSelectElement={
                                                                handleSelectElement
                                                            }
                                                            onAddElement={(
                                                                element
                                                            ) => {
                                                                const updatedPages =
                                                                    [...pages];
                                                                const cellIndex =
                                                                    updatedPages[
                                                                        currentPage
                                                                    ].cells.findIndex(
                                                                        (c) =>
                                                                            c.id ===
                                                                            cell.id
                                                                    );
                                                                if (
                                                                    cellIndex !==
                                                                    -1
                                                                ) {
                                                                    updatedPages[
                                                                        currentPage
                                                                    ].cells[
                                                                        cellIndex
                                                                    ].elements.push(
                                                                        element
                                                                    );
                                                                    updatePages(
                                                                        updatedPages
                                                                    );
                                                                    setSelectedElement(
                                                                        element.id
                                                                    );
                                                                    setSelectedCell(
                                                                        cell.id
                                                                    );
                                                                }
                                                            }}
                                                            onUpdateElement={(
                                                                elementId,
                                                                updates,
                                                                isDuplicate
                                                            ) => {
                                                                const updatedPages =
                                                                    [...pages];
                                                                const cellIndex =
                                                                    updatedPages[
                                                                        currentPage
                                                                    ].cells.findIndex(
                                                                        (c) =>
                                                                            c.id ===
                                                                            cell.id
                                                                    );
                                                                if (
                                                                    cellIndex !==
                                                                    -1
                                                                ) {
                                                                    if (
                                                                        isDuplicate
                                                                    ) {
                                                                        updatedPages[
                                                                            currentPage
                                                                        ].cells[
                                                                            cellIndex
                                                                        ].elements.push(
                                                                            {
                                                                                ...updatedPages[
                                                                                    currentPage
                                                                                ].cells[
                                                                                    cellIndex
                                                                                ].elements.find(
                                                                                    (
                                                                                        el
                                                                                    ) =>
                                                                                        el.id ===
                                                                                        elementId
                                                                                ),
                                                                                ...updates,
                                                                            }
                                                                        );
                                                                    } else {
                                                                        const elementIndex =
                                                                            updatedPages[
                                                                                currentPage
                                                                            ].cells[
                                                                                cellIndex
                                                                            ].elements.findIndex(
                                                                                (
                                                                                    el
                                                                                ) =>
                                                                                    el.id ===
                                                                                    elementId
                                                                            );
                                                                        if (
                                                                            elementIndex !==
                                                                            -1
                                                                        ) {
                                                                            updatedPages[
                                                                                currentPage
                                                                            ].cells[
                                                                                cellIndex
                                                                            ].elements[
                                                                                elementIndex
                                                                            ] =
                                                                                {
                                                                                    ...updatedPages[
                                                                                        currentPage
                                                                                    ]
                                                                                        .cells[
                                                                                        cellIndex
                                                                                    ]
                                                                                        .elements[
                                                                                        elementIndex
                                                                                    ],
                                                                                    ...updates,
                                                                                };
                                                                        }
                                                                    }
                                                                    updatePages(
                                                                        updatedPages
                                                                    );
                                                                }
                                                            }}
                                                            onDeleteElement={(
                                                                elementId
                                                            ) => {
                                                                const updatedPages =
                                                                    [...pages];
                                                                const cellIndex =
                                                                    updatedPages[
                                                                        currentPage
                                                                    ].cells.findIndex(
                                                                        (c) =>
                                                                            c.id ===
                                                                            cell.id
                                                                    );
                                                                if (
                                                                    cellIndex !==
                                                                    -1
                                                                ) {
                                                                    updatedPages[
                                                                        currentPage
                                                                    ].cells[
                                                                        cellIndex
                                                                    ].elements =
                                                                        updatedPages[
                                                                            currentPage
                                                                        ].cells[
                                                                            cellIndex
                                                                        ].elements.filter(
                                                                            (
                                                                                el
                                                                            ) =>
                                                                                el.id !==
                                                                                elementId
                                                                        );
                                                                    updatePages(
                                                                        updatedPages
                                                                    );
                                                                    if (
                                                                        selectedElement ===
                                                                        elementId
                                                                    ) {
                                                                        setSelectedElement(
                                                                            null
                                                                        );
                                                                    }
                                                                }
                                                            }}
                                                            availableMasks={getCurrentLayout().maskCategories.flatMap(
                                                                (cat) =>
                                                                    cat.masks
                                                            )}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar footer - Navegación de páginas */}
                            {/* Sidebar footer - Navegación de páginas */}
                            <aside className="max-w-5xl mt-6 mx-auto bg-white p-4 rounded-lg border">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium">Páginas</h3>
                                        <div className="flex gap-2">
                                            <button
                                                className="p-1 rounded hover:bg-gray-100"
                                                onClick={duplicateCurrentPage}
                                                title="Duplicar página"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                            <button
                                                className="p-1 rounded hover:bg-gray-100"
                                                onClick={deleteCurrentPage}
                                                disabled={pages.length <= 1}
                                                title="Eliminar página"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
                                                onClick={addPage}
                                            >
                                                <Plus className="h-4 w-4" />
                                                <span>Nueva página</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex overflow-x-auto gap-3 custom-scroll">
                                        {pages?.map((page, index) => (
                                            <div
                                                key={page.id}
                                                className={`flex-shrink-0 w-40 p-4 `}
                                                onClick={() =>
                                                    setCurrentPage(index)
                                                }
                                            >
                                                <div
                                                    className={`relative bg-gray-100 h-48 rounded-md overflow-hidden ${
                                                        currentPage === index
                                                            ? "border border-primary"
                                                            : ""
                                                    }`}
                                                >
                                                    <span className="absolute top-1 left-1 text-xs bg-white/80 px-1 rounded z-10">
                                                        Pág. {index + 1}
                                                    </span>

                                                    {pageThumbnails[page.id] ? (
                                                        <img
                                                            src={
                                                                pageThumbnails[
                                                                    page.id
                                                                ]
                                                            }
                                                            alt={`Miniatura página ${
                                                                index + 1
                                                            }`}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <div
                                                                className={`grid ${
                                                                    getCurrentLayout()
                                                                        .template
                                                                } gap-1 w-full h-full p-1`}
                                                            >
                                                                {Array.from({
                                                                    length: getCurrentLayout()
                                                                        .cells,
                                                                }).map(
                                                                    (_, i) => (
                                                                        <div
                                                                            key={
                                                                                i
                                                                            }
                                                                            className="bg-gray-200 rounded-sm"
                                                                        ></div>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        </main>
                    </div>
                </div>
            </div>
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
`}</style>;
