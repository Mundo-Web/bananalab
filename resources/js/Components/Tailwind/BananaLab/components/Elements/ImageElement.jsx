import { useDrag } from "react-dnd";
import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCw, Trash2, Replace, Copy, CircleDot } from "lucide-react";
import ContextMenu from "../UI/ContextMenu";
import { imageMasks } from "../../constants/masks";

export default function ImageElement({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    availableMasks = [],
}) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "IMAGE_ELEMENT",
        item: { id: element.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const elementRef = useRef(null);
    const [isDraggingInside, setIsDraggingInside] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
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

    const handleMouseDown = (e) => {
        if (isSelected) {
            e.stopPropagation();
            setIsDraggingInside(true);
            setStartPos({
                x: e.clientX - element.position.x,
                y: e.clientY - element.position.y,
            });
        }
    };

    /*  const handleMouseMove = (e) => {
        if (isDraggingInside && elementRef.current) {
            const parentRect =
                elementRef.current.parentElement.getBoundingClientRect();
            const newX = e.clientX - startPos.x;
            const newY = e.clientY - startPos.y;

            const maxX = parentRect.width - elementRef.current.offsetWidth;
            const maxY = parentRect.height - elementRef.current.offsetHeight;

            const boundedX = Math.max(0, Math.min(newX, maxX));
            const boundedY = Math.max(0, Math.min(newY, maxY));

            onUpdate({ position: { x: boundedX, y: boundedY } });
        }
    };*/
    const handleMouseMove = (e) => {
        if (isDraggingInside && elementRef.current) {
            const newX = e.clientX - startPos.x;
            const newY = e.clientY - startPos.y;

            // Elimina por completo los límites
            onUpdate({
                position: {
                    x: newX,
                    y: newY,
                },
            });
        }
    };

    const handleMouseUp = () => {
        setIsDraggingInside(false);
    };

    useEffect(() => {
        if (isDraggingInside) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        // Manejador de clic global mejorado
        const handleGlobalClick = (e) => {
            if (showContextMenu && !e.target.closest(".context-menu")) {
                setShowContextMenu(false);
            }
        };

        document.addEventListener("click", handleGlobalClick);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("click", handleGlobalClick);
        };
    }, [isDraggingInside, startPos, showContextMenu]);

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
                x: element.position.x + 20,
                y: element.position.y + 20,
            },
        };
        onUpdate(newElement, true); // true indica que es un duplicado
        setShowContextMenu(false);
    };

    // Estados para el redimensionamiento
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState(null);
    const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
    const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });

    // Función para iniciar el redimensionamiento
    const startResize = (e, direction) => {
        e.stopPropagation();
        e.preventDefault();

        setIsResizing(true);
        setResizeDirection(direction);
        setInitialMousePos({ x: e.clientX, y: e.clientY });
        setInitialSize({
            width:
                element.size?.width || elementRef.current?.offsetWidth || 200,
            height:
                element.size?.height || elementRef.current?.offsetHeight || 200,
        });
    };

    // Función para manejar el redimensionamiento
    const handleResize = useCallback(
        (e) => {
            if (!isResizing || !elementRef.current) return;

            const deltaX = e.clientX - initialMousePos.x;
            const deltaY = e.clientY - initialMousePos.y;
            const parentRect =
                elementRef.current.parentElement.getBoundingClientRect();

            let newWidth = initialSize.width;
            let newHeight = initialSize.height;

            // Calcula proporciones basadas en la dirección
            switch (resizeDirection) {
                case "right":
                    newWidth = Math.max(50, initialSize.width + deltaX);
                    break;
                case "bottom":
                    newHeight = Math.max(50, initialSize.height + deltaY);
                    break;
                case "bottomRight":
                    newWidth = Math.max(50, initialSize.width + deltaX);
                    newHeight = Math.max(50, initialSize.height + deltaY);
                    break;
            }

            // Actualiza inmediatamente
            onUpdate({
                size: {
                    width: newWidth,
                    height:
                        resizeDirection === "right"
                            ? initialSize.height
                            : newHeight,
                },
            });
        },
        [
            isResizing,
            initialMousePos,
            initialSize,
            resizeDirection,
            element.position,
        ]
    );
    // Función para terminar el redimensionamiento
    const stopResize = useCallback(() => {
        setIsResizing(false);
        setResizeDirection(null);
    }, []);

    // Efecto para manejar el redimensionamiento
    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", handleResize);
            window.addEventListener("mouseup", stopResize);
        }
        return () => {
            window.removeEventListener("mousemove", handleResize);
            window.removeEventListener("mouseup", stopResize);
        };
    }, [isResizing, handleResize, stopResize]);

    // Adaptar a porcentaje si existen size/position en %
    // Si el elemento tiene position/size en 0-1, se interpreta como porcentaje
    const getPx = (val, total) => (val <= 1 ? val * total : val);
    // Recibe el tamaño del workspace por prop (vía EditableCell)
    const workspaceSize = element.workspaceSize || { width: 800, height: 600 };
    const left = getPx(element.position.x, workspaceSize.width);
    const top = getPx(element.position.y, workspaceSize.height);
    const width = element.size?.width ? getPx(element.size.width, workspaceSize.width) : 200;
    const height = element.size?.height ? getPx(element.size.height, workspaceSize.height) : 200;

    return (
        <div
            ref={ref}
            className={`absolute ${mask.class} ${
                isSelected ? "ring-2 ring-purple-500" : ""
            } ${isDragging ? "opacity-50" : "opacity-100"}`}
            style={{
                position: "absolute",
                left,
                top,
                width,
                height,
                cursor: isSelected ? "move" : "pointer",
                zIndex: isSelected ? 1 : 0,
                opacity: isSelected ? 0.9 : 1,
                transition: "opacity 0.2s, z-index 0.2s",
                pointerEvents: "all",
                overflow: "visible",
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e);
                if (!isSelected) {
                    onUpdate({
                        zIndex:
                            Math.max(...elements.map((el) => el.zIndex || 0)) +
                            1,
                    });
                }
            }}
            onContextMenu={handleContextMenu}
        >
            <div className="w-full h-full overflow-hidden relative">
                <img
                    src={element.content}
                    alt="Imagen cargada"
                    className="w-full h-full object-cover"
                    style={{
                        ...filterStyle,
                        mixBlendMode: element.filters?.blendMode || "normal",
                        opacity: (element.filters?.opacity || 100) / 100,
                    }}
                />

                {/* Controles de redimensionamiento */}
                {isSelected && (
                    <>
                        <div
                            className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 rounded-full cursor-se-resize"
                            style={{ transform: "translate(50%, 50%)" }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                startResize(e, "bottomRight");
                            }}
                        />
                        <div
                            className="absolute bottom-0 w-3 h-3 bg-purple-500 rounded-full cursor-s-resize"
                            style={{
                                left: "50%",
                                transform: "translateX(-50%) translateY(50%)",
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                startResize(e, "bottom");
                            }}
                        />
                        <div
                            className="absolute right-0 w-3 h-3 bg-purple-500 rounded-full cursor-e-resize"
                            style={{
                                top: "50%",
                                transform: "translateY(-50%) translateX(50%)",
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                startResize(e, "right");
                            }}
                        />
                    </>
                )}
            </div>

            {isSelected && (
                <div className="absolute top-2 right-2 flex gap-2">
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

            {showContextMenu && (
                <>
                    {/* Overlay para cerrar el menú al hacer clic en cualquier parte */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowContextMenu(false)}
                    />

                    {/* Menú contextual con botón de cerrar */}
                    <div
                        className="fixed bg-white shadow-lg rounded-md z-50 py-1 w-48 context-menu"
                        style={{
                            left: `${contextMenuPos.x}px`,
                            top: `${contextMenuPos.y}px`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Botón de cerrar */}
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

                        {/* Opciones del menú */}
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
                                            (element.filters?.opacity || 100) -
                                                10
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
