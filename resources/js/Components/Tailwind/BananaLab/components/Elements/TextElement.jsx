import { useState, useRef, useEffect, useCallback } from "react";
import { useDrag } from "react-dnd";
import { Trash2, Type, Copy, CircleDot } from "lucide-react";
import ContextMenu from "../UI/ContextMenu";

export default function TextElement({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef(null);
    const elementRef = useRef(null);
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "TEXT_ELEMENT",
        item: { id: element.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const [isDraggingInside, setIsDraggingInside] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

    const handleDoubleClick = () => {
        setIsEditing(true);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, 0);
    };

    const handleBlur = () => {
        setIsEditing(false);
    };

    const handleChange = (e) => {
        onUpdate({ content: e.target.value });
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            setIsEditing(false);
        }
    };

    const handleMouseDown = (e) => {
        if (isSelected && !isEditing) {
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

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    const duplicateElement = () => {
        const newElement = {
            ...JSON.parse(JSON.stringify(element)),
            id: `text-${Date.now()}`,
            position: {
                x: element.position.x + 10,
                y: element.position.y + 10,
            },
        };
        onUpdate(newElement, true); // true indica que es un duplicado
        setShowContextMenu(false);
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

    const textShadow = element.style?.textShadow
        ? `${element.style.textShadowX || 0}px ${
              element.style.textShadowY || 0
          }px ${element.style.textShadowBlur || 0}px ${
              element.style.textShadowColor || "rgba(0,0,0,0.5)"
          }`
        : "none";

    const combinedStyle = {
        ...element.style,
        position: "absolute",
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        cursor: isSelected && !isEditing ? "move" : "pointer",
        textShadow,
        zIndex: 10,
    };

    return (
        <div
            ref={ref}
            className={`${isSelected ? "ring-2 ring-purple-500" : ""} ${
                isDragging ? "opacity-50" : "opacity-100"
            }`}
            style={combinedStyle}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={element.content}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full p-1 border border-gray-300 rounded bg-white"
                    style={{
                        fontFamily: element.style?.fontFamily,
                        fontSize: element.style?.fontSize,
                        fontWeight: element.style?.fontWeight,
                        fontStyle: element.style?.fontStyle,
                        textDecoration: element.style?.textDecoration,
                        color: element.style?.color,
                        textAlign: element.style?.textAlign,
                        minWidth: "100px",
                    }}
                    autoFocus
                />
            ) : (
                <div
                    className="p-2 rounded"
                    style={{
                        backgroundColor:
                            element.style?.backgroundColor || "transparent",
                        padding: element.style?.padding || "8px",
                        borderRadius: element.style?.borderRadius || "0px",
                        border: element.style?.border || "none",
                    }}
                >
                    {element.content || "Editar texto"}
                </div>
            )}

            {isSelected && (
                <div className="absolute top-0 right-0 transform translate-y-[-100%] flex gap-1 bg-white rounded-t-md p-1 shadow-sm">
                    <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate({
                                style: {
                                    ...element.style,
                                    fontWeight:
                                        element.style?.fontWeight === "bold"
                                            ? "normal"
                                            : "bold",
                                },
                            });
                        }}
                    >
                        <span
                            className={`text-xs ${
                                element.style?.fontWeight === "bold"
                                    ? "font-bold"
                                    : ""
                            }`}
                        >
                            B
                        </span>
                    </button>
                    <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate({
                                style: {
                                    ...element.style,
                                    fontStyle:
                                        element.style?.fontStyle === "italic"
                                            ? "normal"
                                            : "italic",
                                },
                            });
                        }}
                    >
                        <span
                            className={`text-xs ${
                                element.style?.fontStyle === "italic"
                                    ? "italic"
                                    : ""
                            }`}
                        >
                            I
                        </span>
                    </button>
                    <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate({
                                style: {
                                    ...element.style,
                                    textDecoration:
                                        element.style?.textDecoration ===
                                        "underline"
                                            ? "none"
                                            : "underline",
                                },
                            });
                        }}
                    >
                        <span
                            className={`text-xs ${
                                element.style?.textDecoration === "underline"
                                    ? "underline"
                                    : ""
                            }`}
                        >
                            U
                        </span>
                    </button>
                    <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Trash2 className="h-3 w-3 text-gray-700" />
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
                        onClick={() => {
                            setIsEditing(true);
                            setShowContextMenu(false);
                        }}
                    >
                        <Type className="h-4 w-4" />
                        Editar texto
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
                                style: {
                                    ...element.style,
                                    opacity: Math.max(
                                        0,
                                        (element.style?.opacity || 1) - 0.1
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
