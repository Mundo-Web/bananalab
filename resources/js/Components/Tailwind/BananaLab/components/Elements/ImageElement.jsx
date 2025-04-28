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

    const handleMouseMove = (e) => {
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
    };

    const handleMouseUp = () => {
        setIsDraggingInside(false);
    };

    useEffect(() => {
        if (isDraggingInside) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingInside, startPos]);

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

    return (
        <div
            ref={ref}
            className={`absolute ${mask.class} ${
                isSelected ? "ring-2 ring-purple-500" : ""
            } ${isDragging ? "opacity-50" : "opacity-100"}`}
            style={{
                position: "absolute",
                left: `${element.position.x}px`,
                top: `${element.position.y}px`,
                //  width: "100%",
                //height: "100%",
                cursor: isSelected ? "move" : "pointer",
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
        >
            <div className="w-full h-full overflow-hidden">
                <img
                    src={element.content}
                    alt="Imagen cargada"
                    className="w-full h-full object-cover"
                    style={filterStyle}
                />
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
                <div
                    className="fixed bg-white shadow-lg rounded-md z-50 py-1 w-48"
                    style={{
                        left: `${contextMenuPos.x}px`,
                        top: `${contextMenuPos.y}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
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
            )}
        </div>
    );
}
