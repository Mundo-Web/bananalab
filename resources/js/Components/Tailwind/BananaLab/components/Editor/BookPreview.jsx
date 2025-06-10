import { useState, useRef } from "react";
import Modal from "react-modal";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import HTMLFlipBook from "react-pageflip";
import Global from "../../../../../Utils/Global";

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

Modal.setAppElement('#app'); // Configurar elemento raíz para accesibilidad

const BookPreviewModal = ({ isOpen, onRequestClose, pages, pageThumbnails = {}, addAlbumToCart }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const flipBook = useRef();

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
        return (
            <Modal
                isOpen={isOpen}
                onRequestClose={onRequestClose}
                style={customStyles}
                contentLabel="Vista previa del álbum"
                ariaHideApp={true}
                shouldCloseOnOverlayClick={true}
                shouldCloseOnEsc={true}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 id="modal-title" className="text-xl font-bold">Vista previa del álbum</h2>
                        <button
                            onClick={onRequestClose}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label="Cerrar vista previa"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <p id="modal-description" className="text-gray-600">No hay páginas disponibles para mostrar.</p>
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
            ariaHideApp={true}
            shouldCloseOnOverlayClick={true}
            shouldCloseOnEsc={true}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            {/* Inyectar estilos CSS para eliminar márgenes */}
            <style dangerouslySetInnerHTML={{ __html: flipbookStyles }} />
            
            <div className="relative flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-2xl">
                {/* Título del modal (oculto visualmente pero accesible) */}
                <h2 id="modal-title" className="sr-only">Vista previa del álbum</h2>
                <p id="modal-description" className="sr-only">
                    Navegue por las páginas de su álbum usando los controles de navegación o teclado. 
                    Puede cerrar esta ventana presionando Escape o el botón de cerrar.
                </p>
                
                {/* Botón de cerrar */}
                <button
                    onClick={onRequestClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow z-10"
                    aria-label="Cerrar vista previa del álbum"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Controles de navegación */}
                <div className="flex items-center justify-center gap-8 mb-6 mt-2">
                    <button
                        onClick={goToPrevPage}
                        className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow transition-colors"
                        aria-label="Página anterior"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    <span className="flex items-center text-gray-700 text-base font-medium px-4 py-2 bg-gray-50 rounded-lg" aria-live="polite">
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
                        aria-label="Página siguiente"
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

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-md mx-auto">
                <button
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold shadow transition flex items-center justify-center ${
                        isProcessing 
                            ? 'bg-purple-400 text-white cursor-not-allowed' 
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                    onClick={async () => {
                        if (isProcessing) return;
                        
                        setIsProcessing(true);
                        
                        try {
                            console.log('🚀 Iniciando proceso de compra...');
                            
                            // Verificar que la función addAlbumToCart esté disponible
                            if (typeof addAlbumToCart !== 'function') {
                                console.error('❌ addAlbumToCart no es una función');
                                console.log('addAlbumToCart type:', typeof addAlbumToCart);
                                console.log('addAlbumToCart value:', addAlbumToCart);
                                alert('Error: Función de carrito no disponible. Inténtelo nuevamente.');
                                return;
                            }
                            
                            // Llamar a la función para finalizar el diseño y guardarlo
                            if (typeof window.finalizeAlbumDesign === 'function') {
                                console.log('📄 Finalizando diseño del álbum...');
                                const success = await window.finalizeAlbumDesign();
                                console.log('📄 Resultado de finalizeAlbumDesign:', success);
                                
                                if (success) {
                                    // Primero agregar al carrito
                                    console.log('📦 Agregando álbum al carrito...');
                                    const addedToCart = addAlbumToCart();
                                    console.log('📦 Resultado de addAlbumToCart:', addedToCart);
                                    
                                    if (addedToCart) {
                                        console.log('✅ Álbum agregado al carrito exitosamente');
                                        
                                        try {
                                            // Esperar un poco para asegurar que el localStorage se actualice
                                            await new Promise(resolve => setTimeout(resolve, 200));
                                            
                                            // Verificar una vez más que el álbum esté en el carrito
                                            const verifyCart = JSON.parse(localStorage.getItem(`${window.Global?.APP_CORRELATIVE || 'bananalab'}_cart`) || '[]');
                                            console.log('🔍 Verificación final del carrito:', verifyCart);
                                            console.log('🔍 Longitud del carrito:', verifyCart.length);
                                            
                                            if (verifyCart.length === 0) {
                                                console.error('❌ ADVERTENCIA: El carrito parece vacío después de agregar');
                                            }
                                            
                                            // Determinar la URL base correcta para el carrito
                                         
                                            
                                            // Redirigir al carrito
                                            const cartUrl = `${Global.APP_URL}/cart`;
                                            console.log('🔄 Redirigiendo al carrito...');
                                            console.log('🔄 URL del carrito:', cartUrl);
                                            
                                            // Usar window.location.href para la redirección
                                            window.location.href = cartUrl;
                                            
                                        } catch (redirectError) {
                                            console.error('⚠️ Error durante verificación o redirección:', redirectError);
                                            console.log('🔄 Intentando redirección directa...');
                                            
                                            // Redirección de emergencia sin verificaciones adicionales
                                              const cartUrl = `${Global.APP_URL}/cart`;
                                            console.log('🔄 Redirigiendo al carrito...');
                                            console.log('🔄 URL del carrito:', cartUrl);
                                            
                                            // Usar window.location.href para la redirección
                                            window.location.href = cartUrl;
                                        }
                                    } else {
                                        console.error('❌ No se pudo agregar al carrito');
                                        alert('Error al agregar el álbum al carrito. Revise la consola para más detalles.');
                                    }
                                } else {
                                    console.error('❌ No se pudo finalizar el diseño del álbum');
                                    alert('Error al finalizar el diseño del álbum. Inténtelo nuevamente.');
                                }
                            } else {
                                console.error('❌ window.finalizeAlbumDesign no está disponible');
                                alert('Funcionalidad de finalización de diseño pendiente de implementar.');
                            }
                        } catch (error) {
                            console.error('❌ === ERROR DURANTE PROCESO DE COMPRA ===');
                            console.error('Tipo de error:', error.name);
                            console.error('Mensaje:', error.message);
                            console.error('Stack trace:', error.stack);
                            console.error('Error completo:', error);
                            
                            // Si el error ocurrió DESPUÉS de agregar al carrito, intentar redirigir de todas formas
                            try {
                                const verifyCart = JSON.parse(localStorage.getItem(`${Global?.APP_CORRELATIVE || 'bananalab'}_cart`) || '[]');
                                console.log('🔍 Verificando carrito después del error:', verifyCart.length > 0 ? 'HAY ITEMS' : 'VACÍO');
                                
                                if (verifyCart.length > 0) {
                                    console.log('✅ El carrito tiene items, redirigiendo de todas formas...');
                                    // Redirección de emergencia sin verificaciones adicionales
                                              const cartUrl = `${Global.APP_URL}/cart`;
                                            console.log('🔄 Redirigiendo al carrito...');
                                            console.log('🔄 URL del carrito:', cartUrl);
                                            
                                            // Usar window.location.href para la redirección
                                            window.location.href = cartUrl;
                                    return; // Salir sin mostrar alert de error
                                }
                            } catch (recoveryError) {
                                console.error('❌ Error durante intento de recuperación:', recoveryError);
                            }
                            
                            alert(`Error durante el proceso: ${error.message}. Si el álbum se agregó al carrito, puede ir manualmente a la página del carrito.`);
                        } finally {
                            setIsProcessing(false);
                        }
                    }}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Procesando...
                        </>
                    ) : (
                        'Comprar ahora'
                    )}
                </button>
                <button
                    className="flex-1 py-3 px-4 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
                    onClick={onRequestClose}
                    disabled={isProcessing}
                >
                    Continuar editando
                </button>
            </div>
        </Modal>
    );
};

export default BookPreviewModal;
