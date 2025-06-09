import { useState, useRef, useEffect } from "react";
import Modal from "react-modal";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Importar Turn.js si está disponible
let Turn;
if (typeof window !== 'undefined') {
    try {
        // Intentar cargar Turn.js
        Turn = window.Turn || require('turn.js');
    } catch (e) {
        console.warn('Turn.js no disponible, usando flipbook manual');
    }
}

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
        maxWidth: "95vw",
        maxHeight: "95vh",
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

const BookFlipbook = ({ 
    isOpen, 
    onRequestClose, 
    pages, 
    workspaceDimensions, 
    getCurrentLayout, 
    presetData,
    pageThumbnails = {} 
}) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);
    const flipbookRef = useRef(null);
    const [bookDimensions, setBookDimensions] = useState({ width: 800, height: 600 });

    // Resetear estado cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setCurrentPageIndex(0);
            calculateBookDimensions();
        }
    }, [isOpen, workspaceDimensions]);

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

    // Calcular dimensiones optimizadas para el flipbook
    const calculateBookDimensions = () => {
        const baseWidth = workspaceDimensions?.width || 800;
        const baseHeight = workspaceDimensions?.height || 600;
        
        // Para un flipbook, queremos mostrar dos páginas lado a lado
        const maxModalWidth = Math.min(window.innerWidth * 0.85, 1200);
        const maxModalHeight = Math.min(window.innerHeight * 0.8, 700);
        
        // El ancho del libro será el doble del ancho de una página
        const bookAspectRatio = (baseWidth * 2) / baseHeight;
        let displayWidth, displayHeight;
        
        if (maxModalWidth / bookAspectRatio <= maxModalHeight) {
            displayWidth = maxModalWidth;
            displayHeight = maxModalWidth / bookAspectRatio;
        } else {
            displayHeight = maxModalHeight;
            displayWidth = maxModalHeight * bookAspectRatio;
        }
        
        setBookDimensions({ 
            width: displayWidth, 
            height: displayHeight,
            pageWidth: displayWidth / 2,
            pageHeight: displayHeight
        });
    };

    // Navegar a la página anterior
    const goToPrevPage = () => {
        if (currentPageIndex > 0 && !isFlipping) {
            setIsFlipping(true);
            setCurrentPageIndex(prev => prev - 1);
            setTimeout(() => setIsFlipping(false), 600); // Duración de la animación
        }
    };

    // Navegar a la página siguiente
    const goToNextPage = () => {
        if (currentPageIndex < pages.length - 1 && !isFlipping) {
            setIsFlipping(true);
            setCurrentPageIndex(prev => prev + 1);
            setTimeout(() => setIsFlipping(false), 600);
        }
    };

    // Renderizar una página usando exactamente la misma lógica que el editor
    const renderPage = (page, pageIndex) => {
        if (!page) return null;

        const layout = getCurrentLayout ? getCurrentLayout() : { template: 'grid-cols-1', style: {} };

        // Usar thumbnail si está disponible (esto garantiza exactamente la misma apariencia)
        if (pageThumbnails[page.id]) {
            return (
                <div
                    className="bg-white shadow-lg rounded-lg overflow-hidden border"
                    style={{
                        width: bookDimensions.pageWidth,
                        height: bookDimensions.pageHeight,
                        backgroundImage: `url(${pageThumbnails[page.id]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                />
            );
        }

        // Fallback: renderizar manualmente (igual que en el editor)
        return (
            <div
                className="bg-white shadow-lg rounded-lg overflow-hidden border"
                style={{
                    width: bookDimensions.pageWidth,
                    height: bookDimensions.pageHeight,
                    position: 'relative'
                }}
            >
                {/* Background layer - igual que en el editor */}
                {(() => {
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
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ zIndex: 0 }}
                        />
                    ) : null;
                })()}

                {/* Content layer */}
                {page.cells && (
                    <div
                        className={`grid ${layout.template} absolute inset-0`}
                        style={{
                            zIndex: 1,
                            gap: layout.style?.gap || '16px',
                            padding: layout.style?.padding || '16px'
                        }}
                    >
                        {page.cells.map((cell) => (
                            <div
                                key={cell.id}
                                className="relative bg-gray-50/50 rounded-lg overflow-hidden"
                            >
                                {cell.elements?.map((element) => {
                                    if (element.type === "image") {
                                        const brightness = (element.filters?.brightness || 100) / 100;
                                        const contrast = (element.filters?.contrast || 100) / 100;
                                        const saturate = (element.filters?.saturation || 100) / 100;
                                        const sepia = (element.filters?.tint || 0) / 100;
                                        const hue = (element.filters?.hue || 0) * 3.6;
                                        const blur = element.filters?.blur || 0;
                                        
                                        return (
                                            <div
                                                key={element.id}
                                                className="absolute"
                                                style={{
                                                    left: `${element.position?.x || 0}px`,
                                                    top: `${element.position?.y || 0}px`,
                                                    width: "100%",
                                                    height: "100%",
                                                    zIndex: element.zIndex || 1,
                                                }}
                                            >
                                                <img
                                                    src={element.content}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    style={{
                                                        filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) sepia(${sepia}) hue-rotate(${hue}deg) blur(${blur}px)`,
                                                        opacity: (element.filters?.opacity || 100) / 100,
                                                    }}
                                                />
                                            </div>
                                        );
                                    } else if (element.type === "text") {
                                        return (
                                            <div
                                                key={element.id}
                                                className="absolute"
                                                style={{
                                                    left: `${element.position?.x || 0}px`,
                                                    top: `${element.position?.y || 0}px`,
                                                    fontFamily: element.style?.fontFamily,
                                                    fontSize: element.style?.fontSize,
                                                    fontWeight: element.style?.fontWeight,
                                                    color: element.style?.color,
                                                    textAlign: element.style?.textAlign,
                                                    backgroundColor: element.style?.backgroundColor || "transparent",
                                                    padding: element.style?.padding || "8px",
                                                    borderRadius: element.style?.borderRadius || "0px",
                                                    border: element.style?.border || "none",
                                                    opacity: element.style?.opacity || 1,
                                                    zIndex: element.zIndex || 1,
                                                }}
                                            >
                                                {element.content}
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={customStyles}
            contentLabel="Vista previa del álbum - Flipbook"
        >
            <div 
                className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-2xl border border-gray-300 overflow-hidden"
                style={{
                    width: bookDimensions.width + 80,
                    height: bookDimensions.height + 120,
                    minWidth: 600,
                    minHeight: 400
                }}
            >
                {/* Header del modal */}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <h2 className="text-lg font-bold">📖 Vista del Álbum - Flipbook</h2>
                    <button
                        onClick={onRequestClose}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Contador de páginas */}
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm z-20">
                    Página {currentPageIndex + 1} de {pages.length}
                </div>

                {/* Contenedor principal del flipbook */}
                <div className="p-4 h-full relative">
                    <TransformWrapper
                        initialScale={1}
                        minScale={0.3}
                        maxScale={2}
                        wheel={{ step: 0.1 }}
                        doubleClick={{ mode: "reset" }}
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
                                        className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                                        title="Restablecer zoom"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </button>
                                </div>

                                <TransformComponent
                                    wrapperClass="h-full w-full"
                                    contentClass="h-full w-full flex items-center justify-center"
                                >
                                    {/* Libro abierto simulando un flipbook */}
                                    <div
                                        ref={flipbookRef}
                                        className="relative bg-white rounded-lg shadow-2xl"
                                        style={{
                                            width: bookDimensions.width,
                                            height: bookDimensions.height,
                                            perspective: '1000px'
                                        }}
                                    >
                                        {/* Página actual */}
                                        <div className="absolute inset-0 flex">
                                            {/* Página izquierda (si no es la primera página) */}
                                            {currentPageIndex > 0 && (
                                                <div 
                                                    className={`relative transition-transform duration-600 ${isFlipping ? 'animate-pulse' : ''}`}
                                                    style={{ 
                                                        width: '50%',
                                                        height: '100%',
                                                        transformOrigin: 'right center'
                                                    }}
                                                >
                                                    {renderPage(pages[currentPageIndex - 1], currentPageIndex - 1)}
                                                </div>
                                            )}
                                            
                                            {/* Página derecha (página actual) */}
                                            <div 
                                                className={`relative transition-transform duration-600 ${isFlipping ? 'animate-pulse' : ''}`}
                                                style={{ 
                                                    width: currentPageIndex === 0 ? '100%' : '50%',
                                                    height: '100%',
                                                    transformOrigin: 'left center',
                                                    marginLeft: currentPageIndex === 0 ? '0' : 'auto'
                                                }}
                                            >
                                                {renderPage(pages[currentPageIndex], currentPageIndex)}
                                            </div>
                                        </div>

                                        {/* Efecto de doblez/sombra central */}
                                        {currentPageIndex > 0 && (
                                            <div 
                                                className="absolute top-0 bottom-0 w-1 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none"
                                                style={{ left: '50%', transform: 'translateX(-50%)' }}
                                            />
                                        )}
                                    </div>
                                </TransformComponent>
                            </>
                        )}
                    </TransformWrapper>

                    {/* Botones de navegación */}
                    <button
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg z-15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={goToPrevPage}
                        disabled={currentPageIndex === 0 || isFlipping}
                        title="Página anterior"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    <button
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg z-15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={goToNextPage}
                        disabled={currentPageIndex === pages.length - 1 || isFlipping}
                        title="Página siguiente"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
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

export default BookFlipbook;
