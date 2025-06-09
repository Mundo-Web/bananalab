import { useState, useRef } from "react";
import Modal from "react-modal";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import HTMLFlipBook from "react-pageflip";

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

// Estilos CSS adicionales para eliminar márgenes del flipbook
const flipbookStyles = `
    .stf__wrapper {
        margin: 0 !important;
        padding: 0 !important;
    }
    .stf__block {
        margin: 0 !important;
        padding: 0 !important;
    }
    .stf__page {
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
    }
    .page-container img {
        display: block;
        margin: 0;
        padding: 0;
        border: none;
        outline: none;
    }
`;

Modal.setAppElement(document.body); // Ajusta esto según tu app



const BookPreviewModal = ({ isOpen, onRequestClose, pages, pageThumbnails = {} }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const flipBook = useRef();

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

    const goToPrevPage = () => {
        if (flipBook.current) {
            flipBook.current.pageFlip().flipPrev();
        }
    };
    const goToNextPage = () => {
        if (flipBook.current) {
            flipBook.current.pageFlip().flipNext();
        }
    };

    // Tamaño base para la preview - aspect ratio 4:3 como las páginas reales
    const aspectRatio = 4 / 3;
    const previewHeight = 450; // Más alto para mejor visualización
    const previewWidth = Math.round(previewHeight * aspectRatio);

    // Función para organizar páginas como libro real con frente y reverso
    const createBookPages = () => {
        const bookPages = [];
        
        // Todas las páginas en orden secuencial
        const allPages = [
            ...pages.filter(page => page.type === 'cover'),
            ...pages.filter(page => page.type === 'content'),
            ...pages.filter(page => page.type === 'final')
        ];

        // Para HTMLFlipBook, necesitamos duplicar las páginas para simular frente y reverso
        // La primera página (portada) solo tiene frente
        if (allPages.length > 0) {
            bookPages.push(allPages[0]); // Portada (frente)
            bookPages.push({ ...allPages[0], isBack: true }); // Portada (reverso - blanco o info)
        }

        // Páginas de contenido - cada página es frente y reverso de una hoja
        for (let i = 1; i < allPages.length - 1; i++) {
            bookPages.push(allPages[i]); // Frente de la hoja
            if (i + 1 < allPages.length - 1) {
                bookPages.push(allPages[i + 1]); // Reverso de la hoja (siguiente página)
                i++; // Saltamos la siguiente porque ya la incluimos como reverso
            } else {
                // Si es la última página de contenido, el reverso puede estar en blanco
                bookPages.push({ ...allPages[i], isBack: true, isEmpty: true });
            }
        }

        // Contraportada (si existe)
        const finalPage = allPages.find(page => page.type === 'final');
        if (finalPage) {
            bookPages.push({ ...finalPage, isBack: true, isEmpty: true }); // Reverso blanco
            bookPages.push(finalPage); // Contraportada
        }

        return bookPages;
    };

    const bookPages = createBookPages();

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={customStyles}
            contentLabel="Vista previa del álbum"
        >
            {/* Inyectar estilos CSS para eliminar márgenes */}
            <style dangerouslySetInnerHTML={{ __html: flipbookStyles }} />
            
            <div className="relative flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-2xl">
                {/* Botón de cerrar */}
                <button
                    onClick={onRequestClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow z-10"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Controles de navegación */}
                <div className="flex items-center justify-center gap-8 mb-6 mt-2">
                    <button
                        onClick={goToPrevPage}
                        className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow transition-colors"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    <span className="flex items-center text-gray-700 text-base font-medium px-4 py-2 bg-gray-50 rounded-lg">
                        {(() => {
                            const currentPageData = bookPages[currentPage];
                            if (!currentPageData) return 'Cargando...';
                            
                            // Manejo especial para reversos y páginas en blanco
                            if (currentPageData.isBack && currentPageData.isEmpty) {
                                return 'Reverso';
                            }
                            if (currentPageData.isBack) {
                                return 'Reverso de la página';
                            }
                            
                            if (currentPageData.type === 'cover') return 'Portada';
                            if (currentPageData.type === 'final') return 'Contraportada';
                            return `Página ${currentPageData.pageNumber || Math.ceil((currentPage + 1) / 2)}`;
                        })()}
                        <span className="mx-2 text-gray-400">•</span>
                        {Math.ceil((currentPage + 1) / 2)} / {Math.ceil(bookPages.length / 2)} hojas
                    </span>

                    <button
                        onClick={goToNextPage}
                        className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow transition-colors"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>

                {/* Flipbook visual: thumbnails con efecto page flip como libro real */}
                <div className="flex items-center justify-center">
                    <HTMLFlipBook
                        ref={flipBook}
                        width={previewWidth}
                        height={previewHeight}
                        size="stretch"
                        minWidth={previewWidth * 0.7}
                        maxWidth={previewWidth * 1.3}
                        minHeight={previewHeight * 0.7}
                        maxHeight={previewHeight * 1.3}
                        maxShadowOpacity={0.3}
                        showCover={true}
                        mobileScrollSupport={true}
                        onFlip={(e) => setCurrentPage(e.data)}
                        className="shadow-xl"
                        usePortrait={false}
                        startPage={0}
                        drawShadow={true}
                        flippingTime={600}
                        useMouseEvents={true}
                        swipeDistance={50}
                        showPageCorners={true}
                        disableFlipByClick={false}
                        style={{
                            margin: 0,
                            padding: 0
                        }}
                    >
                        {bookPages.map((page, pageIdx) => (
                            <div 
                                key={`page-${pageIdx}`}
                                className="page-container"
                                style={{
                                    width: previewWidth,
                                    height: previewHeight,
                                    margin: 0,
                                    padding: 0,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#ffffff'
                                }}
                            >
                                {/* Página individual con manejo de reversos */}
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {page.isEmpty || page.isBack ? (
                                        // Página en blanco (reverso)
                                        <div 
                                            className="flex items-center justify-center text-gray-300 text-xs"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #f0f0f0'
                                            }}
                                        >
                                            {page.isBack ? 'Reverso' : ''}
                                        </div>
                                    ) : pageThumbnails[page.id] ? (
                                        // Página con contenido
                                        <img
                                            src={pageThumbnails[page.id]}
                                            alt={`${page.type === 'cover' ? 'Portada' : page.type === 'final' ? 'Contraportada' : `Página ${page.pageNumber || pageIdx + 1}`}`}
                                            style={{ 
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                margin: 0,
                                                padding: 0,
                                                border: 'none',
                                                imageRendering: 'crisp-edges',
                                                backgroundColor: '#ffffff'
                                            }}
                                        />
                                    ) : (
                                        // Cargando
                                        <div 
                                            className="flex items-center justify-center text-gray-400 text-sm"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: '#f9fafb'
                                            }}
                                        >
                                            Generando previsualización...
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </HTMLFlipBook>
                </div>
            </div>
        </Modal>
    );
};

export default BookPreviewModal;
