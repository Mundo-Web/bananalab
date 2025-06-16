import { useState, useRef, useEffect, useCallback } from "react";
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

// Estilos CSS adicionales para eliminar márgenes del flipbook y mantener nitidez nativa
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
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: high-quality !important;
        -webkit-backface-visibility: hidden !important;
        backface-visibility: hidden !important;
        -webkit-transform: translateZ(0) !important;
        transform: translateZ(0) !important;
        -ms-interpolation-mode: bicubic !important;
    }
    .page-container {
        -webkit-font-smoothing: subpixel-antialiased !important;
        -moz-osx-font-smoothing: auto !important;
    }
`;

Modal.setAppElement('#app'); // Configurar elemento raíz para accesibilidad

const BookPreviewModal = ({ 
    isOpen, 
    onRequestClose, 
    pages, 
    pageThumbnails = {}, 
    addAlbumToCart, 
    workspaceDimensions = { width: 800, height: 600 }, 
    layouts = [], 
    presetData = null 
}) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedThumbnails, setGeneratedThumbnails] = useState({});
    const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
    const flipBook = useRef();

    // Función para generar thumbnails de alta calidad
    const generateHighQualityThumbnails = useCallback(async () => {
        if (!pages || pages.length === 0 || !isOpen) return;
        
        console.log('🚀 Iniciando generación de thumbnails para BookPreview...');
        setIsGeneratingThumbnails(true);
        setGeneratedThumbnails({});
        
        const newThumbnails = {};
        const scale = 4; // Factor de escala para alta resolución
        
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

        for (const page of pages) {
            try {
                console.log(`📄 Generando thumbnail para página ${page.id}...`);
                
                // Crear canvas personalizado
                const customCanvas = document.createElement('canvas');
                const customCtx = customCanvas.getContext('2d');
                
                // Usar un factor de escala mayor para mejor calidad
                customCanvas.width = workspaceDimensions.width * scale;
                customCanvas.height = workspaceDimensions.height * scale;
                
                // Escalar el contexto para dibujar en alta resolución
                customCtx.scale(scale, scale);
                
                // Configuración de alta calidad
                customCtx.imageSmoothingEnabled = true;
                customCtx.imageSmoothingQuality = 'high';
                customCtx.textRendering = 'geometricPrecision';
                customCtx.webkitImageSmoothingEnabled = true;
                customCtx.mozImageSmoothingEnabled = true;
                customCtx.msImageSmoothingEnabled = true;
                
                // Fondo blanco
                customCtx.fillStyle = '#ffffff';
                customCtx.fillRect(0, 0, workspaceDimensions.width, workspaceDimensions.height);
                
                // Simular contenido básico (en lugar de renderizar elementos reales)
                customCtx.fillStyle = '#f0f0f0';
                customCtx.fillRect(20, 20, workspaceDimensions.width - 40, workspaceDimensions.height - 40);
                
                // Texto de ejemplo
                customCtx.fillStyle = '#333333';
                customCtx.font = 'bold 24px Arial';
                customCtx.textAlign = 'center';
                customCtx.fillText(`Página ${page.type === 'cover' ? 'Portada' : page.type === 'final' ? 'Contraportada' : page.pageNumber || 'Contenido'}`, 
                                  workspaceDimensions.width / 2, 
                                  workspaceDimensions.height / 2);
                
                // Crear thumbnail final con downscaling progresivo
                const thumbnailCanvas = document.createElement('canvas');
                const thumbnailCtx = thumbnailCanvas.getContext('2d');
                
                // Usar las dimensiones REALES del workspace para calcular la proporción exacta
                const workspaceAspectRatio = workspaceDimensions.width / workspaceDimensions.height;
                
                // Tamaño base para mejor calidad
                const thumbnailBaseSize = 900;
                
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
                
                thumbWidth = Math.round(thumbWidth);
                thumbHeight = Math.round(thumbHeight);
                thumbnailCanvas.width = thumbWidth;
                thumbnailCanvas.height = thumbHeight;
                
                // Configuración de alta calidad para el thumbnail
                thumbnailCtx.imageSmoothingEnabled = true;
                thumbnailCtx.imageSmoothingQuality = 'high';
                thumbnailCtx.webkitImageSmoothingEnabled = true;
                thumbnailCtx.mozImageSmoothingEnabled = true;
                thumbnailCtx.msImageSmoothingEnabled = true;
                
                // Downscaling progresivo en dos pasos
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                
                // Tamaño intermedio (2x tamaño final)
                const intermediateWidth = thumbWidth * 2;
                const intermediateHeight = thumbHeight * 2;
                
                tempCanvas.width = intermediateWidth;
                tempCanvas.height = intermediateHeight;
                
                // Configurar suavizado en canvas intermedio
                tempCtx.imageSmoothingEnabled = true;
                tempCtx.imageSmoothingQuality = 'high';
                
                // Paso 1: Escalar a tamaño intermedio
                tempCtx.drawImage(
                    customCanvas,
                    0, 0, intermediateWidth, intermediateHeight
                );
                
                // Paso 2: Escalar de intermedio a tamaño final
                thumbnailCtx.drawImage(
                    tempCanvas,
                    0, 0, intermediateWidth, intermediateHeight,
                    0, 0, thumbWidth, thumbHeight
                );
                
                newThumbnails[page.id] = thumbnailCanvas.toDataURL('image/png', 1.0);
                console.log(`✅ Thumbnail generado para página ${page.id}`);
                
                // Actualizar parcialmente para mostrar progreso
                setGeneratedThumbnails(prev => ({ ...prev, [page.id]: thumbnailCanvas.toDataURL('image/png', 1.0) }));
                
            } catch (error) {
                console.error(`❌ Error generando thumbnail para página ${page.id}:`, error);
                newThumbnails[page.id] = createElegantPlaceholderForPage(page, workspaceDimensions);
            }
        }
        
        setGeneratedThumbnails(newThumbnails);
        setIsGeneratingThumbnails(false);
        console.log('🎉 Generación de thumbnails para BookPreview completada');
        
    }, [pages, workspaceDimensions, isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (Object.keys(pageThumbnails).length === 0) {
                generateHighQualityThumbnails();
            } else {
                setGeneratedThumbnails(pageThumbnails);
            }
        }
    }, [isOpen, pageThumbnails, generateHighQualityThumbnails]);

     // Función para crear un placeholder elegante para una página específica
    const createElegantPlaceholderForPage = (page, workspaceDimensions) => {
        console.log(`🎨 Creando placeholder para página ${page.id} (${page.type})`);
        
        // Calcular dimensiones del preview con la proporción exacta del workspace
        const workspaceAspectRatio = workspaceDimensions.width / workspaceDimensions.height;
        const previewBaseWidht = 800;
        const previewHeight = previewBaseWidht;
        const previewWidth = Math.round(previewHeight * workspaceAspectRatio);

        // HiDPI fix
        const ratio = window.devicePixelRatio || 1;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = previewWidth * ratio;
        canvas.height = previewHeight * ratio;
        canvas.style.width = `${previewWidth}px`;
        canvas.style.height = `${previewHeight}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        // Fondo blanco limpio
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, previewWidth, previewHeight);

        // Borde elegante
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, previewWidth - 40, previewHeight - 40);

        // Configuración de texto
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Información de la página
        let pageTitle = '';
        let pageIcon = '';
        let pageSubtitle = '';
        let backgroundColor = '#f8fafc';
        let iconColor = '#64748b';

        switch (page.type) {
            case 'cover':
                pageTitle = 'Portada';
                pageIcon = '📚';
                pageSubtitle = 'Página de inicio del álbum';
                backgroundColor = '#fef7ef';
                iconColor = '#ea580c';
                break;
            case 'final':
                pageTitle = 'Contraportada';
                pageIcon = '📖';
                pageSubtitle = 'Página final del álbum';
                backgroundColor = '#f0f9ff';
                iconColor = '#0284c7';
                break;
            case 'content':
                pageTitle = `Página ${page.pageNumber || 'de contenido'}`;
                pageIcon = '📄';
                pageSubtitle = 'Página de contenido';
                backgroundColor = '#f0fdf4';
                iconColor = '#16a34a';
                break;
            default:
                pageTitle = `Página ${page.pageNumber || '?'}`;
                pageIcon = '📄';
                pageSubtitle = 'Contenido del álbum';
                backgroundColor = '#f8fafc';
                iconColor = '#64748b';
        }

        // Fondo de color suave
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(40, 40, previewWidth - 80, previewHeight - 80);

        // Icono principal (emoji grande)
        ctx.font = `${Math.min(previewWidth, previewHeight) * 0.12}px Arial`;
        ctx.fillText(pageIcon, previewWidth / 2, previewHeight / 2 - 50);

        // Título de la página
        ctx.font = `bold ${Math.min(previewWidth, previewHeight) * 0.035}px Arial`;
        ctx.fillStyle = '#1e293b';
        ctx.fillText(pageTitle, previewWidth / 2, previewHeight / 2 + 15);

        // Subtítulo
        ctx.font = `${Math.min(previewWidth, previewHeight) * 0.022}px Arial`;
        ctx.fillStyle = '#64748b';
        ctx.fillText(pageSubtitle, previewWidth / 2, previewHeight / 2 + 45);

        // Información adicional si hay layout
        if (page.layout && layouts.length > 0) {
            const layout = layouts.find(l => l.id === page.layout);
            if (layout) {
                ctx.font = `${Math.min(previewWidth, previewHeight) * 0.018}px Arial`;
                ctx.fillStyle = '#94a3b8';
                ctx.fillText(`Layout: ${layout.name || 'Personalizado'}`, previewWidth / 2, previewHeight / 2 + 75);
            }
        }

        // Decoración sutil en las esquinas
        ctx.strokeStyle = iconColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Esquinas decorativas
        const cornerSize = 15;
        const margin = 30;
        
        // Esquina superior izquierda
        ctx.beginPath();
        ctx.moveTo(margin, margin + cornerSize);
        ctx.lineTo(margin, margin);
        ctx.lineTo(margin + cornerSize, margin);
        ctx.stroke();
        
        // Esquina superior derecha
        ctx.beginPath();
        ctx.moveTo(previewWidth - margin - cornerSize, margin);
        ctx.lineTo(previewWidth - margin, margin);
        ctx.lineTo(previewWidth - margin, margin + cornerSize);
        ctx.stroke();
        
        // Esquina inferior izquierda
        ctx.beginPath();
        ctx.moveTo(margin, previewHeight - margin - cornerSize);
        ctx.lineTo(margin, previewHeight - margin);
        ctx.lineTo(margin + cornerSize, previewHeight - margin);
        ctx.stroke();
        
        // Esquina inferior derecha
        ctx.beginPath();
        ctx.moveTo(previewWidth - margin - cornerSize, previewHeight - margin);
        ctx.lineTo(previewWidth - margin, previewHeight - margin);
        ctx.lineTo(previewWidth - margin, previewHeight - margin - cornerSize);
        ctx.stroke();

        return canvas.toDataURL('image/png', 1.0);
    };

    // Usar thumbnails en este orden de prioridad:
    // 1. Thumbnails proporcionados (de Editor.jsx)
    // 2. Thumbnails generados localmente
    const activeThumbnails = Object.keys(pageThumbnails).length > 0 ? 
        pageThumbnails : 
        generatedThumbnails;

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

    // Usar las dimensiones reales del workspace para calcular la proporción exacta
    const workspaceAspectRatio = workspaceDimensions.width / workspaceDimensions.height;

    // Tamaño base para la preview usando la proporción real del workspace
    const previewBaseWidht = 600;
    const previewHeight = previewBaseWidht;
    const previewWidth = Math.round(previewHeight * workspaceAspectRatio);

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

            {/* Overlay de carga */}
            {isGeneratingThumbnails && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                        <p className="text-gray-700">Generando vistas previas de alta calidad...</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Esto puede tomar unos segundos
                        </p>
                    </div>
                </div>
            )}

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
                                id={`page-${page.id}`}
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
                                    ) : activeThumbnails[page.id] ? (
                                        // Página con contenido usando thumbnails disponibles
                                        <img
                                            src={activeThumbnails[page.id]}
                                            alt={`${page.type === 'cover' ? 'Portada' : page.type === 'final' ? 'Contraportada' : `Página ${page.pageNumber || pageIdx + 1}`}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                margin: 0,
                                                padding: 0,
                                                border: 'none',
                                                imageRendering: 'auto',
                                                backgroundColor: '#ffffff',
                                                WebkitBackfaceVisibility: 'hidden',
                                                backfaceVisibility: 'hidden',
                                                WebkitTransform: 'translateZ(0)',
                                                transform: 'translateZ(0)'
                                            }}
                                        />
                                    ) : (
                                        // Placeholder inline si no hay thumbnail
                                        <InlinePlaceholder page={page} pageIdx={pageIdx} />
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
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold shadow transition flex items-center justify-center ${isProcessing
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
            </div>        </Modal>
    );
};

// Componente para placeholder inline simple
const InlinePlaceholder = ({ page, pageIdx }) => {
    let pageTitle = '';
    let pageIcon = '';

    switch (page.type) {
        case 'cover':
            pageTitle = 'Portada';
            pageIcon = '📚';
            break;
        case 'final':
            pageTitle = 'Contraportada';
            pageIcon = '📖';
            break;
        case 'content':
            pageTitle = `Página ${page.pageNumber || pageIdx + 1}`;
            pageIcon = '📄';
            break;
        default:
            pageTitle = `Página ${pageIdx + 1}`;
            pageIcon = '📄';
    }

    return (
        <div
            className="flex flex-col items-center justify-center w-full h-full bg-gray-50 border-2 border-gray-200 rounded-lg"
            style={{ minHeight: '400px' }}
        >
            <div className="text-6xl mb-4">{pageIcon}</div>
            <div className="text-lg font-semibold text-gray-700 mb-2">{pageTitle}</div>
            <div className="text-sm text-gray-500">Vista previa</div>
            {page.layout && (
                <div className="text-xs text-gray-400 mt-2">
                    Layout: {page.layout.name || 'Personalizado'}
                </div>
            )}
        </div>
    );
};

export default BookPreviewModal;