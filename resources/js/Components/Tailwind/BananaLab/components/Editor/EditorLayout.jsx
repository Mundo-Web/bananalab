import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useState, useCallback } from "react";
import EditorHeader from "./EditorHeader";
import EditorToolbar from "./EditorToolbar";
import EditorSidebar from "./EditorSidebar";
import EditorMain from "./EditorMain";
import EditorPagesPanel from "./EditorPagesPanel";
import { layouts } from "../../constants/layouts";
import useEditorHistory from "../../hooks/useEditorHistory";
import usePageActions from "../../hooks/usePageActions";
import useElementActions from "../../hooks/useElementActions";
import { exportPageToImage } from "../../utils/exportUtils";

export default function EditorLayout() {
    // Estado y acciones para páginas
    const {
        pages,
        currentPageIndex,
        setCurrentPageIndex,
        addPage,
        duplicatePage,
        deletePage,
        changeLayout,
        currentPage,
        getCurrentLayout,
    } = usePageActions();

    // Estado y acciones para elementos
    const {
        elements,
        selectedElement,
        selectedCell, // Ahora está disponible
        setSelectedElement,
        setSelectedCell, // Ahora está disponible
        addElement,
        updateElement,
        deleteElement,
        duplicateElement,
    } = useElementActions();

    // Historial (undo/redo)
    const { currentState, addToHistory, undo, redo, canUndo, canRedo } =
        useEditorHistory(pages);

    // Estado de vista previa
    const [previewMode, setPreviewMode] = useState(false);
    const [activeTab, setActiveTab] = useState("elements");
    const [filterTab, setFilterTab] = useState("basic");

    // Manejo de exportación
    const handleExport = useCallback(() => {
        exportPageToImage(
            "page-preview",
            `diseño-pagina-${currentPageIndex + 1}`
        );
    }, [currentPageIndex]);

    // Toggle vista previa
    const togglePreviewMode = useCallback(() => {
        setPreviewMode((prev) => !prev);
    }, []);

    // Manejo de cambios en elementos (con historial)
    const handleUpdateElement = useCallback(
        (cellId, elementId, updates) => {
            const updatedPages = pages.map((page, index) => {
                if (index !== currentPageIndex) return page;

                return {
                    ...page,
                    cells: page.cells.map((cell) => {
                        if (cell.id !== cellId) return cell;

                        return {
                            ...cell,
                            elements: cell.elements.map((el) => {
                                if (el.id !== elementId) return el;
                                return { ...el, ...updates };
                            }),
                        };
                    }),
                };
            });

            setPages(updatedPages);
            addToHistory(updatedPages);
        },
        [pages, currentPageIndex, addToHistory]
    );

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col min-h-screen bg-gray-50 ">
                <EditorHeader
                    onExport={handleExport}
                    onPreviewToggle={togglePreviewMode}
                    previewMode={previewMode}
                />

                <div className="flex flex-1 overflow-hidden">
                    <EditorSidebar
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        selectedLayout={currentPage.layout}
                        onLayoutChange={(layoutId) => {
                            changeLayout(currentPageIndex, layoutId);
                            addToHistory(pages);
                        }}
                        onAddImage={(file) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                if (e.target?.result) {
                                    const newElement = addElement("image", {
                                        content: e.target.result,
                                    });
                                    // Aquí implementar lógica para añadir a celda específica
                                }
                            };
                            reader.readAsDataURL(file);
                        }}
                        onAddText={() => {
                            const newElement = addElement("text");
                            // Aquí implementar lógica para añadir a celda específica
                        }}
                        selectedElement={selectedElement}
                        onFilterChange={handleUpdateElement}
                        getSelectedElement={() =>
                            elements.find((el) => el.id === selectedElement)
                        }
                        getCurrentLayout={getCurrentLayout}
                    />
                    <div className="w-11/12">
                        {" "}
                        <EditorMain
                            currentPage={currentPageIndex}
                            pages={pages}
                            selectedElement={selectedElement}
                            selectedCell={selectedCell} // Pasa selectedCell como prop
                            onSelectElement={setSelectedElement}
                            onSelectCell={setSelectedCell} // Pasa setSelectedCell como prop
                            onAddElement={addElement}
                            onUpdateElement={handleUpdateElement}
                            onDeleteElement={deleteElement}
                            getCurrentLayout={getCurrentLayout}
                            previewMode={previewMode}
                        />
                        <EditorPagesPanel
                            pages={pages}
                            currentPage={currentPageIndex}
                            onPageChange={setCurrentPageIndex}
                            onAddPage={() => {
                                addPage();
                                addToHistory(pages);
                            }}
                            onDuplicatePage={() => {
                                duplicatePage(currentPageIndex);
                                addToHistory(pages);
                            }}
                            onDeletePage={() => {
                                deletePage(currentPageIndex);
                                addToHistory(pages);
                            }}
                        />
                    </div>
                </div>
            </div>
        </DndProvider>
    );
}
