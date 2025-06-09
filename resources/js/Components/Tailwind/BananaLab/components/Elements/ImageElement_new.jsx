import { useDrag } from "react-dnd";
import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCw, Trash2, Replace, Copy, CircleDot } from "lucide-react";
import { imageMasks } from "../../constants/masks";

export default function ImageElement({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    availableMasks = [],
    workspaceSize = { width: 800, height: 600 },
}) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "IMAGE_ELEMENT",
        item: { id: element.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const elementRef = useRef(null);
    
    // Estados para manipulación de imagen
    const [isDraggingInside, setIsDraggingInside] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState(null);
    const [initialState, setInitialState] = useState({
        mouseX: 0,
        mouseY: 0,
        elementX: 0,
        elementY: 0,
        elementWidth: 0,
        elementHeight: 0,
    });
    
    // Estados para UI
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

    // Aplicar filtros CSS
    const filterStyle = {
        filter: `
            brightness(${(element.filters?.brightness || 100) / 100})
            contrast(${(element.filters?.contrast || 100) / 100})
            saturate(${(element.filters?.saturation || 100) / 100})
            sepia(${(element.filters?.tint || 0) / 100})
            hue-rotate(${(element.filters?.hue || 0) * 3.6}deg)
            blur(${element.filters?.blur || 0}px)
        `,
        transform: `scale(${element.filters?.scale || 1}) rotate(${
            element.filters?.rotate || 0
        }deg) ${element.filters?.flipHorizontal ? "scaleX(-1)" : ""} ${
            element.filters?.flipVertical ? "scaleY(-1)" : ""
        }`,
        mixBlendMode: element.filters?.blendMode || "normal",
        opacity: (element.filters?.opacity || 100) / 100,
    };

    const mask = imageMasks.find((m) => m.id === element.mask) || imageMasks[0];

    // Función para convertir posición/tamaño relativo a absoluto
    const getPx = (val, total) => (val <= 1 ? val * total : val);
    
    // Función para convertir posición/tamaño absoluto a relativo
    const getRelative = (val, total) => (val > 1 ? val / total : val);

    // Calcular posición y tamaño actuales
    const currentPosition = {
        x: getPx(element.position.x, workspaceSize.width),
        y: getPx(element.position.y, workspaceSize.height),
    };
    
    const currentSize = {
        width: element.size?.width ? getPx(element.size.width, workspaceSize.width) : 200,
        height: element.size?.height ? getPx(element.size.height, workspaceSize.height) : 200,
    };

    // Función para iniciar el arrastre
    const handleMouseDown = useCallback((e) => {
        if (!isSelected) return;
        
        e.stopPropagation();
        e.preventDefault();
        
        setIsDraggingInside(true);
        setInitialState({
            mouseX: e.clientX,
            mouseY: e.clientY,
            elementX: currentPosition.x,
            elementY: currentPosition.y,
            elementWidth: currentSize.width,
            elementHeight: currentSize.height,
        });
    }, [isSelected, currentPosition, currentSize]);

    // Función para manejar el movimiento durante el arrastre
    const handleMouseMove = useCallback((e) => {
        if (isDraggingInside) {
            const deltaX = e.clientX - initialState.mouseX;
            const deltaY = e.clientY - initialState.mouseY;
            
            const newX = initialState.elementX + deltaX;
            const newY = initialState.elementY + deltaY;
            
            // Convertir a valores relativos para mantener la responsividad
            const relativeX = getRelative(newX, workspaceSize.width);
            const relativeY = getRelative(newY, workspaceSize.height);
            
            onUpdate({
                position: {
                    x: relativeX,
                    y: relativeY,
                },
            });
        } else if (isResizing) {
            const deltaX = e.clientX - initialState.mouseX;
            const deltaY = e.clientY - initialState.mouseY;
            
            let newWidth = initialState.elementWidth;
            let newHeight = initialState.elementHeight;
            let newX = initialState.elementX;
            let newY = initialState.elementY;
            
            // Calcular nuevas dimensiones basadas en la dirección
            switch (resizeDirection) {
                case "nw": // Esquina superior izquierda
                    newWidth = Math.max(50, initialState.elementWidth - deltaX);
                    newHeight = Math.max(50, initialState.elementHeight - deltaY);
                    newX = initialState.elementX + (initialState.elementWidth - newWidth);
                    newY = initialState.elementY + (initialState.elementHeight - newHeight);
                    break;
                case "n": // Borde superior
                    newHeight = Math.max(50, initialState.elementHeight - deltaY);
                    newY = initialState.elementY + (initialState.elementHeight - newHeight);
                    break;
                case "ne": // Esquina superior derecha
                    newWidth = Math.max(50, initialState.elementWidth + deltaX);
                    newHeight = Math.max(50, initialState.elementHeight - deltaY);
                    newY = initialState.elementY + (initialState.elementHeight - newHeight);
                    break;
                case "e": // Borde derecho
                    newWidth = Math.max(50, initialState.elementWidth + deltaX);
                    break;
                case "se": // Esquina inferior derecha
                    newWidth = Math.max(50, initialState.elementWidth + deltaX);
                    newHeight = Math.max(50, initialState.elementHeight + deltaY);
                    break;
                case "s": // Borde inferior
                    newHeight = Math.max(50, initialState.elementHeight + deltaY);
                    break;
                case "sw": // Esquina inferior izquierda
                    newWidth = Math.max(50, initialState.elementWidth - deltaX);
                    newHeight = Math.max(50, initialState.elementHeight + deltaY);
                    newX = initialState.elementX + (initialState.elementWidth - newWidth);
                    break;
                case "w": // Borde izquierdo
                    newWidth = Math.max(50, initialState.elementWidth - deltaX);
                    newX = initialState.elementX + (initialState.elementWidth - newWidth);
                    break;
            }
            
            // Convertir a valores relativos
            const relativeX = getRelative(newX, workspaceSize.width);
            const relativeY = getRelative(newY, workspaceSize.height);
            const relativeWidth = getRelative(newWidth, workspaceSize.width);
            const relativeHeight = getRelative(newHeight, workspaceSize.height);
            
            onUpdate({
                position: { x: relativeX, y: relativeY },
                size: { width: relativeWidth, height: relativeHeight },
            });
        }
    }, [isDraggingInside, isResizing, initialState, resizeDirection, workspaceSize, onUpdate, getRelative]);

    // Función para terminar arrastre/redimensionamiento
    const handleMouseUp = useCallback(() => {
        setIsDraggingInside(false);
        setIsResizing(false);
        setResizeDirection(null);
    }, []);

    // Función para iniciar redimensionamiento
    const startResize = useCallback((e, direction) => {
        e.stopPropagation();
        e.preventDefault();
        
        setIsResizing(true);
        setResizeDirection(direction);
        setInitialState({
            mouseX: e.clientX,
            mouseY: e.clientY,
            elementX: currentPosition.x,
            elementY: currentPosition.y,
            elementWidth: currentSize.width,
            elementHeight: currentSize.height,
        });
    }, [currentPosition, currentSize]);

    // Efectos para manejar eventos globales
    useEffect(() => {
        if (isDraggingInside || isResizing) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingInside, isResizing, handleMouseMove, handleMouseUp]);

    // Efecto para cerrar menú contextual
    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (showContextMenu && !e.target.closest(".context-menu")) {
                setShowContextMenu(false);
            }
        };

        document.addEventListener("click", handleGlobalClick);
        return () => document.removeEventListener("click", handleGlobalClick);
    }, [showContextMenu]);

    const ref = useCallback(
        (node) => {
            elementRef.current = node;
            drag(node);
        },
        [drag]
    );

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    const replaceImage = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        onUpdate({ content: e.target.result });
                    }
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        };
        input.click();
        setShowContextMenu(false);
    };

    const duplicateElement = () => {
        const newElement = {
            ...JSON.parse(JSON.stringify(element)),
            id: `img-${Date.now()}`,
            position: {
                x: element.position.x + (20 / workspaceSize.width), // Offset relativo
                y: element.position.y + (20 / workspaceSize.height),
            },
        };
        onUpdate(newElement, true);
        setShowContextMenu(false);
    };

    // Cursor apropiado según el estado
    const getCursor = () => {
        if (isDraggingInside) return "grabbing";
        if (isResizing) return getResizeCursor(resizeDirection);
        if (isSelected) return "grab";
        return "pointer";
    };

    const getResizeCursor = (direction) => {
        const cursors = {
            n: "n-resize",
            ne: "ne-resize",
            e: "e-resize",
            se: "se-resize",
            s: "s-resize",
            sw: "sw-resize",
            w: "w-resize",
            nw: "nw-resize",
        };
        return cursors[direction] || "default";
    };

    return (
        <div
            ref={ref}
            className={`absolute ${mask.class} ${
                isSelected ? "ring-2 ring-blue-500" : ""
            } ${isDragging ? "opacity-50" : "opacity-100"}`}
            style={{
                left: currentPosition.x,
                top: currentPosition.y,
                width: currentSize.width,
                height: currentSize.height,
                cursor: getCursor(),
                zIndex: isSelected ? 1000 : element.zIndex || 0,
                transition: isDragging ? "none" : "opacity 0.2s",
                pointerEvents: "all",
                overflow: "visible",
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
        >
            <div className="w-full h-full overflow-hidden relative">
                <img
                    src={element.content}
                    alt="Imagen cargada"
                    className="w-full h-full object-cover"
                    style={filterStyle}
                    draggable={false}
                />

                {/* Controles de redimensionamiento */}
                {isSelected && (
                    <>
                        {/* Esquinas */}
                        <div
                            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize"
                            style={{ top: -6, left: -6 }}
                            onMouseDown={(e) => startResize(e, "nw")}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize"
                            style={{ top: -6, right: -6 }}
                            onMouseDown={(e) => startResize(e, "ne")}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
                            style={{ bottom: -6, right: -6 }}
                            onMouseDown={(e) => startResize(e, "se")}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize"
                            style={{ bottom: -6, left: -6 }}
                            onMouseDown={(e) => startResize(e, "sw")}
                        />
                        
                        {/* Bordes */}
                        <div
                            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-n-resize"
                            style={{ top: -6, left: "50%", transform: "translateX(-50%)" }}
                            onMouseDown={(e) => startResize(e, "n")}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-e-resize"
                            style={{ right: -6, top: "50%", transform: "translateY(-50%)" }}
                            onMouseDown={(e) => startResize(e, "e")}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-s-resize"
                            style={{ bottom: -6, left: "50%", transform: "translateX(-50%)" }}
                            onMouseDown={(e) => startResize(e, "s")}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-w-resize"
                            style={{ left: -6, top: "50%", transform: "translateY(-50%)" }}
                            onMouseDown={(e) => startResize(e, "w")}
                        />
                    </>
                )}
            </div>

            {/* Botones de acción */}
            {isSelected && (
                <div className="absolute -top-10 right-0 flex gap-2">
                    <button
                        className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate({
                                filters: {
                                    ...element.filters,
                                    rotate: (element.filters?.rotate || 0) + 90,
                                },
                            });
                        }}
                    >
                        <RotateCw className="h-4 w-4 text-gray-700" />
                    </button>
                    <button
                        className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-gray-700" />
                    </button>
                </div>
            )}

            {/* Menú contextual */}
            {showContextMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowContextMenu(false)}
                    />
                    <div
                        className="fixed bg-white shadow-lg rounded-md z-50 py-1 w-48 context-menu"
                        style={{
                            left: `${contextMenuPos.x}px`,
                            top: `${contextMenuPos.y}px`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 text-gray-500"
                            onClick={() => setShowContextMenu(false)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>

                        <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                            onClick={replaceImage}
                        >
                            <Replace className="h-4 w-4" />
                            Reemplazar imagen
                        </button>
                        <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                            onClick={duplicateElement}
                        >
                            <Copy className="h-4 w-4" />
                            Duplicar
                        </button>
                        <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => {
                                onUpdate({
                                    filters: {
                                        ...element.filters,
                                        opacity: Math.max(
                                            0,
                                            (element.filters?.opacity || 100) - 10
                                        ),
                                    },
                                });
                                setShowContextMenu(false);
                            }}
                        >
                            <CircleDot className="h-4 w-4" />
                            Reducir opacidad
                        </button>
                        <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => {
                                onDelete();
                                setShowContextMenu(false);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
