import { useState, useRef, useEffect } from "react";
import Modal from "react-modal";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import PageRenderer from "../Elements/PageRendererClean";

// Estilos para el modal
const customStyles = {
    content: {
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)",
        padding: "0",
        border: "none",
        background: "none",
        overflow: "visible",
    },
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        zIndex: 1000,
    },
};

// Configurar el elemento raíz del modal de forma segura
try {
    const appElement = document.getElementById('app') || document.querySelector('main') || document.body;
    Modal.setAppElement(appElement);
} catch (e) {
    console.warn('No se pudo configurar el appElement del modal:', e);
}

const BookPreviewModal = ({ isOpen, onRequestClose, pages, workspaceDimensions, getCurrentLayout, presetData, pageThumbnails = {} }) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);

    // Resetear estado cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setCurrentPageIndex(0);
            setIsFlipping(false);
        }
    }, [isOpen]);

    // Safety check for pages
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
        return (
            <Modal
                isOpen={isOpen}
                onRequestClose={onRequestClose}
                style={customStyles}
                contentLabel="Vista previa del álbum"
            >
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Vista previa del álbum</h2>
                        <button
                            onClick={onRequestClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <p className="text-gray-600">No hay páginas disponibles para mostrar.</p>
                </div>
            </Modal>
        );
    }

    // Funciones de navegación flipbook
    const goToPrevPage = () => {
        if (currentPageIndex > 0 && !isFlipping) {
            setIsFlipping(true);
            setTimeout(() => {
                setCurrentPageIndex(currentPageIndex - 1);
                setIsFlipping(false);
            }, 300);
        }
    };

    const goToNextPage = () => {
        if (currentPageIndex < pages.length - 1 && !isFlipping) {
            setIsFlipping(true);
            setTimeout(() => {
                setCurrentPageIndex(currentPageIndex + 1);
                setIsFlipping(false);
            }, 300);
        }
    };

    const goToPage = (pageIndex) => {
        if (pageIndex !== currentPageIndex && !isFlipping) {
            setIsFlipping(true);
            setTimeout(() => {
                setCurrentPageIndex(pageIndex);
                setIsFlipping(false);
            }, 300);
        }
    };

    // Calcular dimensiones optimizadas para flipbook
    const calculateFlipbookDimensions = () => {
        const baseWidth = workspaceDimensions?.width || 800;
        const baseHeight = workspaceDimensions?.height || 600;
        
        // Ajustar al viewport del modal manteniendo proporción
        const maxModalWidth = Math.min(window.innerWidth * 0.85, 1200);
        const maxModalHeight = Math.min(window.innerHeight * 0.8, 800);
        
        const aspectRatio = baseWidth / baseHeight;
        let displayWidth, displayHeight;
        
        // Calcular para que quepa el libro completo (dos páginas lado a lado)
        if ((maxModalWidth / 2) / aspectRatio <= maxModalHeight) {
            displayWidth = maxModalWidth / 2;
            displayHeight = (maxModalWidth / 2) / aspectRatio;
        } else {
            displayHeight = maxModalHeight;
            displayWidth = maxModalHeight * aspectRatio;
        }

        return { 
            pageWidth: displayWidth, 
            pageHeight: displayHeight,
            bookWidth: displayWidth * 2,
            bookHeight: displayHeight
        };
    };

    const flipbookDimensions = calculateFlipbookDimensions();

    // Renderizar página individual (usa thumbnails si están disponibles)
    const renderPage = (page, pageIndex) => {
        const thumbnailUrl = pageThumbnails[page.id];
        
        if (thumbnailUrl) {
            // Usar thumbnail generado para máxima fidelidad visual
            return (
                <div 
                    className="w-full h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex items-center justify-center"
                    style={{
                        width: flipbookDimensions.pageWidth,
                        height: flipbookDimensions.pageHeight
                    }}
                >
                    <img 
                        src={thumbnailUrl}
                        alt={`Página ${pageIndex + 1}`}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'crisp-edges' }}
                    />
                </div>
            );
        } else {
            // Fallback: renderizar usando PageRenderer
            return (
                <div 
                    className="w-full h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                    style={{
                        width: flipbookDimensions.pageWidth,
                        height: flipbookDimensions.pageHeight
                    }}
                >
                    <PageRenderer
                        page={page}
                        getCurrentLayout={getCurrentLayout}
                        presetData={presetData}
                        workspaceDimensions={{
                            width: flipbookDimensions.pageWidth,
                            height: flipbookDimensions.pageHeight
                        }}
                        showBackgroundLayer={true}
                        isPreview={true}
                        className="w-full h-full"
                    />
                </div>
            );
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={customStyles}
            contentLabel="Vista previa del álbum - Flipbook"
        >
            <div 
                className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                style={{
                    width: flipbookDimensions.bookWidth + 100,
                    height: flipbookDimensions.bookHeight + 180,
                    minWidth: 600,
                    minHeight: 500
                }}
            >
                {/* Header del modal */}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <h2 className="text-lg font-bold">Vista previa del álbum - Flipbook</h2>
                    <button
                        onClick={onRequestClose}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Contador de páginas y navegación rápida */}
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm z-20 flex items-center gap-4">
                    <span>{currentPageIndex + 1} / {pages.length}</span>
                    <div className="flex gap-1">
                        {pages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToPage(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    index === currentPageIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Contenedor principal del flipbook */}
                <div className="p-6 h-full">
                    <div className="relative h-full">
                        <TransformWrapper
                            initialScale={1}
                            minScale={0.3}
                            maxScale={2}
                            wheel={{ step: 0.1 }}
                            doubleClick={{ mode: "toggle" }}
                        >
                            {({ zoomIn, zoomOut, resetTransform }) => (
                                <>
                                    {/* Controles de zoom */}
                                    <div className="absolute top-2 right-2 flex gap-2 z-20">
                                        <button
                                            onClick={() => zoomOut()}
                                            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                                            title="Alejar"
                                        >
                                            <ZoomOut className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => zoomIn()}
                                            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                                            title="Acercar"
                                        >
                                            <ZoomIn className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => resetTransform()}
                                            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors text-xs"
                                            title="Restablecer zoom"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <TransformComponent
                                        wrapperClass="h-full w-full"
                                        contentClass="h-full w-full flex items-center justify-center"
                                    >
                                        {/* Flipbook Container */}
                                        <div 
                                            className="relative flex items-center justify-center"
                                            style={{
                                                width: flipbookDimensions.bookWidth,
                                                height: flipbookDimensions.bookHeight
                                            }}
                                        >
                                            {/* Página actual con efecto flipbook */}
                                            <div 
                                                className={`transition-all duration-300 ease-in-out transform ${
                                                    isFlipping ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
                                                }`}
                                                style={{
                                                    perspective: '1000px',
                                                    transformStyle: 'preserve-3d'
                                                }}
                                            >
                                                {/* Sombra del libro */}
                                                <div 
                                                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 bg-black/20 rounded-lg blur-sm"
                                                    style={{
                                                        width: flipbookDimensions.bookWidth + 20,
                                                        height: 20
                                                    }}
                                                />
                                                
                                                {/* Página renderizada */}
                                                <div className="relative bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-300">
                                                    {pages[currentPageIndex] && renderPage(pages[currentPageIndex], currentPageIndex)}
                                                    
                                                    {/* Efecto de lomo del libro */}
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-gray-400 to-gray-300 opacity-60" />
                                                </div>
                                            </div>
                                        </div>
                                    </TransformComponent>
                                </>
                            )}
                        </TransformWrapper>

                        {/* Botones de navegación estilo flipbook */}
                        <button
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg z-10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={goToPrevPage}
                            disabled={currentPageIndex === 0 || isFlipping}
                            title="Página anterior"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        
                        <button
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg z-10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={goToNextPage}
                            disabled={currentPageIndex === pages.length - 1 || isFlipping}
                            title="Página siguiente"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>

                        {/* Indicador de página actual */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                            {pages[currentPageIndex]?.type === 'cover' && 'Portada'}
                            {pages[currentPageIndex]?.type === 'content' && `Página ${pages[currentPageIndex]?.pageNumber || currentPageIndex + 1}`}
                            {pages[currentPageIndex]?.type === 'final' && 'Contraportada'}
                        </div>
                    </div>
                </div>

                {/* Footer con botones de acción */}
                <div className="flex justify-center gap-4 p-4 bg-gray-50 border-t border-gray-200">
                    <button
                        onClick={onRequestClose}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Seguir editando
                    </button>
                    <button
                        onClick={() => alert('Funcionalidad de compra próximamente')}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Comprar álbum
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BookPreviewModal;
