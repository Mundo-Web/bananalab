import { useState, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import Modal from "react-modal";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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

Modal.setAppElement(document.body); // Ajusta esto según tu app

const BookPreviewModal = ({ isOpen, onRequestClose, pages }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const flipBook = useRef();

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

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={customStyles}
            contentLabel="Vista previa del álbum"
        >
            <div className="relative">
                {/* Botón de cerrar */}
                <button
                    onClick={onRequestClose}
                    className="absolute -top-16 -right-12 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Controles de navegación */}
                <div className="absolute left-0 right-0 -bottom-16 flex justify-center gap-8">
                    <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 0}
                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    <span className="flex items-center text-white text-base">
                        Página {currentPage + 1} de {pages.length}
                    </span>

                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === pages.length - 1}
                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>

                {/* El flipbook */}
                <HTMLFlipBook
                    ref={flipBook}
                    width={600}
                    height={800}
                    size="stretch"
                    minWidth={300}
                    maxWidth={1000}
                    minHeight={400}
                    maxHeight={1200}
                    maxShadowOpacity={0.5}
                    showCover={true}
                    mobileScrollSupport={true}
                    onFlip={(e) => setCurrentPage(e.data)}
                    className="shadow-2xl bg-gray-100"
                >
                    {pages.map((page, index) => (
                        <div key={page.id} className="bg-white h-full w-full">
                            <div
                                className={`grid ${page.layout.template} gap-4 h-full p-4`}
                            >
                                {page.cells.map((cell) => (
                                    <div
                                        key={cell.id}
                                        className="relative bg-gray-50 rounded-lg overflow-hidden"
                                    >
                                        {cell.elements.map((element) =>
                                            element.type === "image" ? (
                                                <img
                                                    key={element.id}
                                                    src={element.content}
                                                    className="absolute w-full h-full object-cover"
                                                    style={{
                                                        filter: `
                              brightness(${element.filters?.brightness || 100}%)
                              contrast(${element.filters?.contrast || 100}%)
                            `,
                                                        left: `${
                                                            element.position
                                                                ?.x || 0
                                                        }px`,
                                                        top: `${
                                                            element.position
                                                                ?.y || 0
                                                        }px`,
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    key={element.id}
                                                    className="absolute"
                                                    style={{
                                                        left: `${
                                                            element.position
                                                                ?.x || 0
                                                        }px`,
                                                        top: `${
                                                            element.position
                                                                ?.y || 0
                                                        }px`,
                                                        fontSize:
                                                            element.style
                                                                ?.fontSize,
                                                        color: element.style
                                                            ?.color,
                                                        fontFamily:
                                                            element.style
                                                                ?.fontFamily,
                                                        backgroundColor:
                                                            element.style
                                                                ?.backgroundColor ||
                                                            "transparent",
                                                        padding:
                                                            element.style
                                                                ?.padding ||
                                                            "8px",
                                                        borderRadius:
                                                            element.style
                                                                ?.borderRadius ||
                                                            "0px",
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
                    ))}
                </HTMLFlipBook>
            </div>
        </Modal>
    );
};

export default BookPreviewModal;
