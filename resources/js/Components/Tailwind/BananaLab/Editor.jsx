import { useState, useRef, useCallback, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
    Camera,
    Undo2,
    Redo2,
    Trash2,
    ChevronLeft,
    ImageIcon,
    Move,
    Type,
    Layers,
    Download,
    Eye,
    Plus,
    Minus,
    FlipHorizontal,
    FlipVertical,
    RotateCw,
    Crop,
    Sliders,
    Palette,
    Text,
    ImagePlus,
    Upload,
    Replace,
    ImageOff,
    Copy,
    Layers2,
    Blend,
    CircleDot,
    Grid,
    Square,
    Circle,
    Heart,
    Star,
    Hexagon,
    Diamond,
    Film,
    Feather,
    Cloud,
    Flower,
    Zap,
    Scissors,
} from "lucide-react";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { layouts } from "./constants/layouts";
import { imageMasks } from "./constants/masks";

// Layouts disponibles con categorías de máscaras

// Máscaras para imágenes con descripciones

// Modos de mezcla

// Filtros predefinidos
const filterPresets = [
    {
        name: "Normal",
        filters: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            tint: 0,
            hue: 0,
            blur: 0,
        },
    },
    {
        name: "Vintage",
        filters: {
            brightness: 90,
            contrast: 110,
            saturation: 80,
            tint: 20,
            hue: 10,
            blur: 1,
        },
    },
    {
        name: "Blanco y negro",
        filters: {
            brightness: 100,
            contrast: 120,
            saturation: 0,
            tint: 0,
            hue: 0,
            blur: 0,
        },
    },
    {
        name: "Brillante",
        filters: {
            brightness: 120,
            contrast: 90,
            saturation: 120,
            tint: 0,
            hue: 0,
            blur: 0,
        },
    },
    {
        name: "Oscuro",
        filters: {
            brightness: 80,
            contrast: 120,
            saturation: 90,
            tint: 10,
            hue: 0,
            blur: 1,
        },
    },
    {
        name: "Sepia",
        filters: {
            brightness: 90,
            contrast: 100,
            saturation: 50,
            tint: 80,
            hue: 0,
            blur: 0,
        },
    },
    {
        name: "Cálido",
        filters: {
            brightness: 100,
            contrast: 100,
            saturation: 110,
            tint: 15,
            hue: 20,
            blur: 0,
        },
    },
    {
        name: "Frío",
        filters: {
            brightness: 100,
            contrast: 100,
            saturation: 110,
            tint: 0,
            hue: 200,
            blur: 0,
        },
    },
];

// Fuentes disponibles
const fontOptions = [
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
    "Impact",
    "Comic Sans MS",
    "Palatino",
    "Garamond",
    "Bookman",
    "Avant Garde",
    "Trebuchet MS",
    "Arial Black",
    "Lucida Sans",
    "Lucida Console",
];

// Componente Button personalizado
const Button = ({
    children,
    onClick,
    className = "",
    variant = "default",
    size = "default",
    disabled = false,
    icon = null,
}) => {
    const baseStyles =
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

    const variantStyles = {
        default: "bg-purple-600 text-white hover:bg-purple-700",
        outline:
            "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    };

    const sizeStyles = {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md text-sm",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} gap-2`}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <span className="w-4 h-4">{icon}</span>}
            {children}
        </button>
    );
};

// Componente Slider personalizado
const Slider = ({
    value = [50],
    min = 0,
    max = 100,
    step = 1,
    onValueChange,
    label,
    unit = "%",
}) => {
    const [currentValue, setCurrentValue] = useState(value[0]);

    const handleChange = (e) => {
        const newValue = Number.parseInt(e.target.value);
        setCurrentValue(newValue);
        if (onValueChange) {
            onValueChange([newValue]);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
                <span className="text-sm text-gray-500">
                    {currentValue}
                    {unit}
                </span>
            </div>
            <div className="relative flex w-full touch-none select-none items-center">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
            </div>
        </div>
    );
};

// Componente para una celda editable con drag and drop
const EditableCell = ({
    id,
    elements = [],
    selectedElement,
    onSelectElement,
    onAddElement,
    onUpdateElement,
    onDeleteElement,
    availableMasks = [],
}) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ["IMAGE_FILE", "TEXT_ELEMENT", "IMAGE_ELEMENT"],
        drop: (item) => {
            if (item.files) {
                // Es un archivo de imagen
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        const newElement = {
                            id: `img-${Date.now()}`,
                            type: "image",
                            content: e.target.result,
                            position: { x: 10, y: 10 },
                            filters: {
                                brightness: 100,
                                contrast: 100,
                                saturation: 100,
                                tint: 0,
                                hue: 0,
                                blur: 0,
                                scale: 1,
                                rotate: 0,
                                opacity: 100,
                                blendMode: "normal",
                            },
                            mask: "none",
                        };
                        onAddElement(newElement);
                    }
                };
                reader.readAsDataURL(item.files[0]);
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver({ shallow: true }),
        }),
    }));

    const openFileExplorer = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        const newElement = {
                            id: `img-${Date.now()}`,
                            type: "image",
                            content: e.target.result,
                            position: { x: 10, y: 10 },
                            filters: {
                                brightness: 100,
                                contrast: 100,
                                saturation: 100,
                                tint: 0,
                                hue: 0,
                                blur: 0,
                                scale: 1,
                                rotate: 0,
                                opacity: 100,
                                blendMode: "normal",
                            },
                            mask: "none",
                        };
                        onAddElement(newElement);
                    }
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        };
        input.click();
    };

    return (
        <div
            ref={drop}
            className={`relative aspect-square bg-gray-50 rounded-lg overflow-hidden ${
                isOver ? "ring-2 ring-purple-500 bg-purple-50" : ""
            }`}
            onClick={() => onSelectElement(null)}
        >
            {elements.length === 0 ? (
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={openFileExplorer}
                >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500">
                        Haz clic o arrastra una imagen
                    </p>
                </div>
            ) : (
                elements.map((element) => (
                    <div key={element.id} className="absolute inset-0">
                        {element.type === "image" ? (
                            <ImageElement
                                element={element}
                                isSelected={selectedElement === element.id}
                                onSelect={() => onSelectElement(element.id)}
                                onUpdate={(updates) =>
                                    onUpdateElement(element.id, updates)
                                }
                                onDelete={() => onDeleteElement(element.id)}
                                availableMasks={availableMasks}
                            />
                        ) : (
                            <TextElement
                                element={element}
                                isSelected={selectedElement === element.id}
                                onSelect={() => onSelectElement(element.id)}
                                onUpdate={(updates) =>
                                    onUpdateElement(element.id, updates)
                                }
                                onDelete={() => onDeleteElement(element.id)}
                            />
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

// Componente para un elemento de imagen
const ImageElement = ({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    availableMasks = [],
}) => {
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
                left: `${element.position.x}px`,
                top: `${element.position.y}px`,
                width: "100%",
                height: "100%",
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
};

// Componente para un elemento de texto
const TextElement = ({ element, isSelected, onSelect, onUpdate, onDelete }) => {
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
};

// Componente para el selector de máscaras
const MaskSelector = ({ selectedMask, onSelect, availableMasks = [] }) => {
    const [activeCategory, setActiveCategory] = useState("Básicas");

    // Agrupar máscaras por categoría
    const categories = {};
    imageMasks.forEach((mask) => {
        if (!categories[mask.category]) {
            categories[mask.category] = [];
        }
        if (availableMasks.includes(mask.id) || mask.id === "none") {
            categories[mask.category].push(mask);
        }
    });

    return (
        <div className="space-y-4">
            <h3 className="font-medium">Máscaras de imagen</h3>

            {/* Pestañas de categorías */}
            <div className="flex overflow-x-auto pb-2">
                {Object.keys(categories).map(
                    (category) =>
                        categories[category].length > 0 && (
                            <button
                                key={category}
                                className={`px-3 py-1 text-sm whitespace-nowrap ${
                                    activeCategory === category
                                        ? "border-b-2 border-purple-500 font-medium text-purple-600"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category}
                            </button>
                        )
                )}
            </div>

            {/* Máscaras de la categoría activa */}
            <div className="grid grid-cols-3 gap-3">
                {categories[activeCategory]?.map((mask) => (
                    <div
                        key={mask.id}
                        className={`border rounded-md p-2 cursor-pointer hover:border-purple-500 transition-colors ${
                            selectedMask === mask.id
                                ? "border-purple-500 ring-2 ring-purple-200"
                                : ""
                        }`}
                        onClick={() => onSelect(mask.id)}
                    >
                        <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center mb-2">
                            <div
                                className={`w-16 h-16 bg-purple-300 ${mask.class}`}
                            ></div>
                        </div>
                        <p className="text-center text-sm">{mask.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Componente para ajustes avanzados
const AdvancedSettings = ({ element, onUpdate }) => {
    return (
        <div className="space-y-4">
            <h3 className="font-medium">Ajustes avanzados</h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modo de mezcla
                </label>
                <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={element.filters?.blendMode || "normal"}
                    onChange={(e) =>
                        onUpdate({
                            filters: {
                                ...element.filters,
                                blendMode: e.target.value,
                            },
                        })
                    }
                >
                    {blendModes.map((mode) => (
                        <option key={mode} value={mode}>
                            {mode}
                        </option>
                    ))}
                </select>
            </div>

            <Slider
                label="Opacidad"
                value={[element.filters?.opacity || 100]}
                min={0}
                max={100}
                onValueChange={(value) =>
                    onUpdate({
                        filters: { ...element.filters, opacity: value[0] },
                    })
                }
            />

            <div className="grid grid-cols-2 gap-3">
                <Button
                    variant={
                        element.filters?.flipHorizontal
                            ? "secondary"
                            : "outline"
                    }
                    size="sm"
                    onClick={() =>
                        onUpdate({
                            filters: {
                                ...element.filters,
                                flipHorizontal:
                                    !element.filters?.flipHorizontal,
                            },
                        })
                    }
                >
                    <FlipHorizontal className="h-4 w-4 mr-1" />
                    Voltear H
                </Button>
                <Button
                    variant={
                        element.filters?.flipVertical ? "secondary" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                        onUpdate({
                            filters: {
                                ...element.filters,
                                flipVertical: !element.filters?.flipVertical,
                            },
                        })
                    }
                >
                    <FlipVertical className="h-4 w-4 mr-1" />
                    Voltear V
                </Button>
            </div>
        </div>
    );
};

// Componente para filtros predefinidos
const FilterPresets = ({ onSelectPreset }) => {
    return (
        <div className="space-y-4">
            <h3 className="font-medium">Filtros predefinidos</h3>
            <div className="grid grid-cols-2 gap-3">
                {filterPresets.map((preset) => (
                    <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectPreset(preset.filters)}
                    >
                        {preset.name}
                    </Button>
                ))}
            </div>
        </div>
    );
};

// Componente principal del editor
export default function EditorLibro() {
    const [pages, setPages] = useState([
        {
            id: "page-1",
            layout: "layout-1",
            cells: Array.from({ length: 4 }).map((_, i) => ({
                id: `cell-1-${i + 1}`,
                elements: [],
            })),
        },
    ]);

    const [currentPage, setCurrentPage] = useState(0);
    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const [activeTab, setActiveTab] = useState("elements");
    const [filterTab, setFilterTab] = useState("basic");
    const [history, setHistory] = useState([JSON.stringify(pages)]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [previewMode, setPreviewMode] = useState(false);

    // Obtener el layout actual
    const getCurrentLayout = () => {
        return (
            layouts.find((layout) => layout.id === pages[currentPage].layout) ||
            layouts[0]
        );
    };

    // Obtener el elemento seleccionado
    const getSelectedElement = () => {
        if (!selectedElement || !selectedCell) return null;

        const cell = pages[currentPage].cells.find(
            (cell) => cell.id === selectedCell
        );
        if (!cell) return null;

        return cell.elements.find((el) => el.id === selectedElement);
    };

    // Actualizar el estado de las páginas
    const updatePages = (newPages) => {
        setPages(newPages);
        // Actualizar el historial
        const newHistory = [
            ...history.slice(0, historyIndex + 1),
            JSON.stringify(newPages),
        ];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // Cambiar el layout de la página actual
    const changeLayout = (layoutId) => {
        const selectedLayout = layouts.find((l) => l.id === layoutId);
        if (!selectedLayout) return;

        const updatedPages = [...pages];
        const currentPageData = updatedPages[currentPage];

        // Crear nuevas celdas basadas en el layout seleccionado
        const newCells = Array.from({ length: selectedLayout.cells }).map(
            (_, index) => {
                const existingCell = currentPageData.cells[index];
                return (
                    existingCell || {
                        id: `cell-${currentPageData.id}-${index + 1}`,
                        elements: [],
                    }
                );
            }
        );

        updatedPages[currentPage] = {
            ...currentPageData,
            layout: layoutId,
            cells: newCells,
        };

        updatePages(updatedPages);
        setSelectedElement(null);
        setSelectedCell(null);
    };

    // Añadir una nueva página
    const addPage = () => {
        const newPageId = `page-${pages.length + 1}`;
        const layout = getCurrentLayout();
        const newPage = {
            id: newPageId,
            layout: layout.id,
            cells: Array.from({ length: layout.cells }).map((_, index) => ({
                id: `cell-${newPageId}-${index + 1}`,
                elements: [],
            })),
        };

        const updatedPages = [...pages, newPage];
        updatePages(updatedPages);
        setCurrentPage(updatedPages.length - 1);
    };

    // Eliminar la página actual
    const deleteCurrentPage = () => {
        if (pages.length <= 1) return;

        const updatedPages = pages.filter((_, index) => index !== currentPage);
        updatePages(updatedPages);
        setCurrentPage(Math.min(currentPage, updatedPages.length - 1));
    };

    // Duplicar la página actual
    const duplicateCurrentPage = () => {
        const currentPageData = pages[currentPage];
        const newPage = {
            ...JSON.parse(JSON.stringify(currentPageData)),
            id: `page-${pages.length + 1}-copy`,
        };

        const updatedPages = [...pages, newPage];
        updatePages(updatedPages);
        setCurrentPage(updatedPages.length - 1);
    };

    // Añadir un elemento a una celda
    const addElementToCell = (cellId, element) => {
        const updatedPages = [...pages];
        const cellIndex = updatedPages[currentPage].cells.findIndex(
            (cell) => cell.id === cellId
        );

        if (cellIndex !== -1) {
            updatedPages[currentPage].cells[cellIndex].elements.push(element);
            updatePages(updatedPages);
            setSelectedElement(element.id);
            setSelectedCell(cellId);
        }
    };

    // Actualizar un elemento en una celda
    const updateElementInCell = (
        cellId,
        elementId,
        updates,
        isDuplicate = false
    ) => {
        const updatedPages = [...pages];
        const cellIndex = updatedPages[currentPage].cells.findIndex(
            (cell) => cell.id === cellId
        );

        if (cellIndex !== -1) {
            if (isDuplicate) {
                // Añadir como nuevo elemento
                updatedPages[currentPage].cells[cellIndex].elements.push({
                    ...updatedPages[currentPage].cells[cellIndex].elements.find(
                        (el) => el.id === elementId
                    ),
                    ...updates,
                });
            } else {
                // Actualizar elemento existente
                const elementIndex = updatedPages[currentPage].cells[
                    cellIndex
                ].elements.findIndex((el) => el.id === elementId);

                if (elementIndex !== -1) {
                    updatedPages[currentPage].cells[cellIndex].elements[
                        elementIndex
                    ] = {
                        ...updatedPages[currentPage].cells[cellIndex].elements[
                            elementIndex
                        ],
                        ...updates,
                    };
                }
            }
            updatePages(updatedPages);
        }
    };

    // Eliminar un elemento de una celda
    const deleteElementFromCell = (cellId, elementId) => {
        const updatedPages = [...pages];
        const cellIndex = updatedPages[currentPage].cells.findIndex(
            (cell) => cell.id === cellId
        );

        if (cellIndex !== -1) {
            updatedPages[currentPage].cells[cellIndex].elements = updatedPages[
                currentPage
            ].cells[cellIndex].elements.filter((el) => el.id !== elementId);
            updatePages(updatedPages);

            if (selectedElement === elementId) {
                setSelectedElement(null);
            }
        }
    };

    // Deshacer
    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setPages(JSON.parse(history[historyIndex - 1]));
            setSelectedElement(null);
            setSelectedCell(null);
        }
    };

    // Rehacer
    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setPages(JSON.parse(history[historyIndex + 1]));
            setSelectedElement(null);
            setSelectedCell(null);
        }
    };

    // Exportar la página actual como imagen
    const exportPage = () => {
        const canvas = document.createElement("canvas");
        const pageElement = document.querySelector(".page-preview");

        if (!pageElement) return;

        // Configurar el canvas con las dimensiones de la página
        const width = pageElement.offsetWidth;
        const height = pageElement.offsetHeight;
        canvas.width = width * 2; // Doble resolución para mejor calidad
        canvas.height = height * 2;

        const context = canvas.getContext("2d");
        context.scale(2, 2);
        context.fillStyle = "white";
        context.fillRect(0, 0, width, height);

        // Usar html2canvas para renderizar la página
        html2canvas(pageElement, {
            scale: 2,
            backgroundColor: null,
            canvas,
            logging: false,
            useCORS: true,
        }).then((canvas) => {
            canvas.toBlob((blob) => {
                saveAs(blob, `diseño-pagina-${currentPage + 1}.png`);
            });
        });
    };

    // Vista previa de la página actual
    const togglePreview = () => {
        setPreviewMode(!previewMode);
    };

    // Añadir texto desde el botón
    const handleAddText = () => {
        const newId = `text-${Date.now()}`;
        const newElement = {
            id: newId,
            type: "text",
            content: "Haz clic para editar",
            position: { x: 20, y: 20 },
            style: {
                fontSize: "16px",
                fontFamily: "Arial",
                color: "#000000",
                fontWeight: "normal",
                fontStyle: "normal",
                textDecoration: "none",
                textAlign: "left",
                backgroundColor: "transparent",
                padding: "8px",
                borderRadius: "0px",
                border: "none",
                opacity: 1,
            },
        };

        if (selectedCell) {
            // Añadir a la celda seleccionada
            addElementToCell(selectedCell, newElement);
        } else {
            // Añadir a la primera celda
            addElementToCell(pages[currentPage].cells[0].id, newElement);
        }
    };

    // Aplicar filtro predefinido
    const applyFilterPreset = (preset) => {
        if (!selectedElement || !selectedCell) return;

        updateElementInCell(selectedCell, selectedElement, {
            filters: {
                ...getSelectedElement()?.filters,
                ...preset,
            },
        });
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col min-h-screen bg-gray-50 mx-auto max-w-7xl">
                {/* Header */}
                <header className="border-b bg-white p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="h-5 w-5 mr-1" />
                            Regresar
                        </Button>
                    </div>

                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-800">
                            Editor
                        </h1>
                        <h2 className="text-lg text-gray-600">
                            Crea collages y diseños impresionantes
                        </h2>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={togglePreview}
                            icon={<Eye className="h-4 w-4" />}
                        >
                            {previewMode ? "Editar" : "Vista previa"}
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            icon={<Download className="h-4 w-4" />}
                            onClick={exportPage}
                        >
                            Exportar
                        </Button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar izquierdo */}
                    <aside className="w-64 border-r bg-white p-4 overflow-y-auto shadow-sm">
                        <div className="space-y-6">
                            <div className="flex border-b pb-4">
                                <button
                                    className={`flex-1 py-2 text-sm font-medium ${
                                        activeTab === "elements"
                                            ? "text-purple-600 border-b-2 border-purple-600"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                    onClick={() => setActiveTab("elements")}
                                >
                                    Elementos
                                </button>
                                <button
                                    className={`flex-1 py-2 text-sm font-medium ${
                                        activeTab === "filters"
                                            ? "text-purple-600 border-b-2 border-purple-600"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                    onClick={() => setActiveTab("filters")}
                                >
                                    Filtros
                                </button>
                            </div>

                            {activeTab === "elements" && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium mb-2">
                                            Layouts
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {layouts.map((layout) => (
                                                <div
                                                    key={layout.id}
                                                    className={`border rounded-md p-1 cursor-pointer hover:border-purple-500 ${
                                                        pages[currentPage]
                                                            .layout ===
                                                        layout.id
                                                            ? "border-purple-500 ring-1 ring-purple-200"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        changeLayout(layout.id)
                                                    }
                                                >
                                                    <div
                                                        className={`grid ${layout.template} gap-1 h-20`}
                                                    >
                                                        {Array.from({
                                                            length: layout.cells,
                                                        }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="bg-gray-100 rounded-sm flex items-center justify-center"
                                                            >
                                                                <ImageIcon className="h-3 w-3 text-gray-400" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-center mt-1 truncate">
                                                        {layout.name}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-medium mb-2">
                                            Añadir
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={
                                                    <ImageIcon className="h-4 w-4" />
                                                }
                                                onClick={() => {
                                                    const input =
                                                        document.createElement(
                                                            "input"
                                                        );
                                                    input.type = "file";
                                                    input.accept = "image/*";
                                                    input.onchange = (e) => {
                                                        if (
                                                            e.target.files &&
                                                            e.target.files[0]
                                                        ) {
                                                            const newId = `img-${Date.now()}`;
                                                            const newElement = {
                                                                id: newId,
                                                                type: "image",
                                                                content: "",
                                                                position: {
                                                                    x: 10,
                                                                    y: 10,
                                                                },
                                                                filters: {
                                                                    brightness: 100,
                                                                    contrast: 100,
                                                                    saturation: 100,
                                                                    tint: 0,
                                                                    hue: 0,
                                                                    blur: 0,
                                                                    scale: 1,
                                                                    rotate: 0,
                                                                    opacity: 100,
                                                                    blendMode:
                                                                        "normal",
                                                                },
                                                                mask: "none",
                                                            };

                                                            const reader =
                                                                new FileReader();
                                                            reader.onload = (
                                                                e
                                                            ) => {
                                                                if (
                                                                    e.target
                                                                        ?.result
                                                                ) {
                                                                    newElement.content =
                                                                        e.target.result;
                                                                    if (
                                                                        selectedCell
                                                                    ) {
                                                                        addElementToCell(
                                                                            selectedCell,
                                                                            newElement
                                                                        );
                                                                    } else {
                                                                        addElementToCell(
                                                                            pages[
                                                                                currentPage
                                                                            ]
                                                                                .cells[0]
                                                                                .id,
                                                                            newElement
                                                                        );
                                                                    }
                                                                }
                                                            };
                                                            reader.readAsDataURL(
                                                                e.target
                                                                    .files[0]
                                                            );
                                                        }
                                                    };
                                                    input.click();
                                                }}
                                            >
                                                Imagen
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={
                                                    <Type className="h-4 w-4" />
                                                }
                                                onClick={handleAddText}
                                            >
                                                Texto
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "filters" && selectedElement && (
                                <div className="space-y-6">
                                    <div className="flex border-b">
                                        <button
                                            className={`flex-1 py-2 text-sm font-medium ${
                                                filterTab === "basic"
                                                    ? "text-purple-600 border-b-2 border-purple-600"
                                                    : "text-gray-600 hover:text-gray-900"
                                            }`}
                                            onClick={() =>
                                                setFilterTab("basic")
                                            }
                                        >
                                            Básicos
                                        </button>
                                        <button
                                            className={`flex-1 py-2 text-sm font-medium ${
                                                filterTab === "transform"
                                                    ? "text-purple-600 border-b-2 border-purple-600"
                                                    : "text-gray-600 hover:text-gray-900"
                                            }`}
                                            onClick={() =>
                                                setFilterTab("transform")
                                            }
                                        >
                                            Transformar
                                        </button>
                                        <button
                                            className={`flex-1 py-2 text-sm font-medium ${
                                                filterTab === "advanced"
                                                    ? "text-purple-600 border-b-2 border-purple-600"
                                                    : "text-gray-600 hover:text-gray-900"
                                            }`}
                                            onClick={() =>
                                                setFilterTab("advanced")
                                            }
                                        >
                                            Avanzados
                                        </button>
                                    </div>

                                    {filterTab === "basic" && (
                                        <>
                                            {getSelectedElement()?.type ===
                                                "image" && (
                                                <FilterPresets
                                                    onSelectPreset={
                                                        applyFilterPreset
                                                    }
                                                />
                                            )}
                                            <div className="space-y-4">
                                                <h3 className="font-medium">
                                                    Ajustes básicos
                                                </h3>
                                                <Slider
                                                    label="Brillo"
                                                    value={[
                                                        getSelectedElement()
                                                            ?.filters
                                                            ?.brightness || 100,
                                                    ]}
                                                    min={0}
                                                    max={200}
                                                    onValueChange={(value) =>
                                                        updateElementInCell(
                                                            selectedCell,
                                                            selectedElement,
                                                            {
                                                                filters: {
                                                                    ...getSelectedElement()
                                                                        ?.filters,
                                                                    brightness:
                                                                        value[0],
                                                                },
                                                            }
                                                        )
                                                    }
                                                />
                                                <Slider
                                                    label="Contraste"
                                                    value={[
                                                        getSelectedElement()
                                                            ?.filters
                                                            ?.contrast || 100,
                                                    ]}
                                                    min={0}
                                                    max={200}
                                                    onValueChange={(value) =>
                                                        updateElementInCell(
                                                            selectedCell,
                                                            selectedElement,
                                                            {
                                                                filters: {
                                                                    ...getSelectedElement()
                                                                        ?.filters,
                                                                    contrast:
                                                                        value[0],
                                                                },
                                                            }
                                                        )
                                                    }
                                                />
                                                <Slider
                                                    label="Saturación"
                                                    value={[
                                                        getSelectedElement()
                                                            ?.filters
                                                            ?.saturation || 100,
                                                    ]}
                                                    min={0}
                                                    max={200}
                                                    onValueChange={(value) =>
                                                        updateElementInCell(
                                                            selectedCell,
                                                            selectedElement,
                                                            {
                                                                filters: {
                                                                    ...getSelectedElement()
                                                                        ?.filters,
                                                                    saturation:
                                                                        value[0],
                                                                },
                                                            }
                                                        )
                                                    }
                                                />
                                                <Slider
                                                    label="Tono"
                                                    value={[
                                                        getSelectedElement()
                                                            ?.filters?.hue || 0,
                                                    ]}
                                                    min={0}
                                                    max={360}
                                                    unit="°"
                                                    onValueChange={(value) =>
                                                        updateElementInCell(
                                                            selectedCell,
                                                            selectedElement,
                                                            {
                                                                filters: {
                                                                    ...getSelectedElement()
                                                                        ?.filters,
                                                                    hue: value[0],
                                                                },
                                                            }
                                                        )
                                                    }
                                                />
                                                <Slider
                                                    label="Sepia"
                                                    value={[
                                                        getSelectedElement()
                                                            ?.filters?.tint ||
                                                            0,
                                                    ]}
                                                    min={0}
                                                    max={100}
                                                    onValueChange={(value) =>
                                                        updateElementInCell(
                                                            selectedCell,
                                                            selectedElement,
                                                            {
                                                                filters: {
                                                                    ...getSelectedElement()
                                                                        ?.filters,
                                                                    tint: value[0],
                                                                },
                                                            }
                                                        )
                                                    }
                                                />
                                                <Slider
                                                    label="Desenfoque"
                                                    value={[
                                                        getSelectedElement()
                                                            ?.filters?.blur ||
                                                            0,
                                                    ]}
                                                    min={0}
                                                    max={20}
                                                    unit="px"
                                                    onValueChange={(value) =>
                                                        updateElementInCell(
                                                            selectedCell,
                                                            selectedElement,
                                                            {
                                                                filters: {
                                                                    ...getSelectedElement()
                                                                        ?.filters,
                                                                    blur: value[0],
                                                                },
                                                            }
                                                        )
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}

                                    {filterTab === "transform" && (
                                        <div className="space-y-4">
                                            <h3 className="font-medium">
                                                Transformación
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    variant={
                                                        getSelectedElement()
                                                            ?.filters
                                                            ?.flipHorizontal
                                                            ? "secondary"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    icon={
                                                        <FlipHorizontal className="h-4 w-4" />
                                                    }
                                                    onClick={() =>
                                                        updateElementInCell(
                                                            selectedCell,
                                                            selectedElement,
                                                            {
                                                                filters: {
                                                                    ...getSelectedElement()
                                                                        ?.filters,
                                                                    flipHorizontal:
                                                                        !getSelectedElement()
                                                                            ?.filters
                                                                            ?.flipHorizontal,
                                                                },
                                                            }
                                                        )
                                                    }
                                                >
                                                    Voltear H
                                                </Button>
                                                <Button
                                                    variant={
                                                        getSelectedElement()
                                                            ?.filters
                                                            ?.flipVertical
                                                            ? "secondary"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    icon={
                                                        <FlipVertical className="h-4 w-4" />
                                                    }
                                                    onClick={() =>
                                                        updateElementInCell(
                                                            selectedCell,
                                                            selectedElement,
                                                            {
                                                                filters: {
                                                                    ...getSelectedElement()
                                                                        ?.filters,
                                                                    flipVertical:
                                                                        !getSelectedElement()
                                                                            ?.filters
                                                                            ?.flipVertical,
                                                                },
                                                            }
                                                        )
                                                    }
                                                >
                                                    Voltear V
                                                </Button>
                                            </div>
                                            <Slider
                                                label="Rotación"
                                                value={[
                                                    getSelectedElement()
                                                        ?.filters?.rotate || 0,
                                                ]}
                                                min={0}
                                                max={360}
                                                unit="°"
                                                onValueChange={(value) =>
                                                    updateElementInCell(
                                                        selectedCell,
                                                        selectedElement,
                                                        {
                                                            filters: {
                                                                ...getSelectedElement()
                                                                    ?.filters,
                                                                rotate: value[0],
                                                            },
                                                        }
                                                    )
                                                }
                                            />
                                            <Slider
                                                label="Escala"
                                                value={[
                                                    (getSelectedElement()
                                                        ?.filters?.scale || 1) *
                                                        100,
                                                ]}
                                                min={10}
                                                max={200}
                                                onValueChange={(value) =>
                                                    updateElementInCell(
                                                        selectedCell,
                                                        selectedElement,
                                                        {
                                                            filters: {
                                                                ...getSelectedElement()
                                                                    ?.filters,
                                                                scale:
                                                                    value[0] /
                                                                    100,
                                                            },
                                                        }
                                                    )
                                                }
                                            />
                                        </div>
                                    )}

                                    {filterTab === "advanced" && (
                                        <AdvancedSettings
                                            element={getSelectedElement()}
                                            onUpdate={(updates) =>
                                                updateElementInCell(
                                                    selectedCell,
                                                    selectedElement,
                                                    updates
                                                )
                                            }
                                        />
                                    )}

                                    {getSelectedElement()?.type === "image" && (
                                        <MaskSelector
                                            onSelect={(mask) =>
                                                updateElementInCell(
                                                    selectedCell,
                                                    selectedElement,
                                                    { mask }
                                                )
                                            }
                                            selectedMask={
                                                getSelectedElement()?.mask ||
                                                "none"
                                            }
                                            availableMasks={getCurrentLayout().maskCategories.flatMap(
                                                (cat) => cat.masks
                                            )}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Área principal de edición */}
                    <main className="flex-1 overflow-auto bg-gray-100 p-6">
                        <div className="max-w-4xl mx-auto">
                            {previewMode ? (
                                <div className="bg-white p-8 rounded-lg shadow-lg page-preview">
                                    <div
                                        className={`grid ${
                                            getCurrentLayout().template
                                        } gap-6 aspect-[4/3]`}
                                    >
                                        {pages[currentPage].cells.map(
                                            (cell) => (
                                                <div
                                                    key={cell.id}
                                                    className="relative bg-gray-50 rounded-lg overflow-hidden"
                                                >
                                                    {cell.elements.map(
                                                        (element) =>
                                                            element.type ===
                                                            "image" ? (
                                                                <div
                                                                    key={
                                                                        element.id
                                                                    }
                                                                    className={`absolute ${
                                                                        imageMasks.find(
                                                                            (
                                                                                m
                                                                            ) =>
                                                                                m.id ===
                                                                                element.mask
                                                                        )
                                                                            ?.class ||
                                                                        ""
                                                                    }`}
                                                                    style={{
                                                                        left: `${element.position.x}px`,
                                                                        top: `${element.position.y}px`,
                                                                        width: "100%",
                                                                        height: "100%",
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={
                                                                            element.content
                                                                        }
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        style={{
                                                                            filter: `
                                    brightness(${
                                        (element.filters?.brightness || 100) /
                                        100
                                    })
                                    contrast(${
                                        (element.filters?.contrast || 100) / 100
                                    })
                                    saturate(${
                                        (element.filters?.saturation || 100) /
                                        100
                                    })
                                    sepia(${(element.filters?.tint || 0) / 100})
                                    hue-rotate(${
                                        (element.filters?.hue || 0) * 3.6
                                    }deg)
                                    blur(${element.filters?.blur || 0}px)
                                  `,
                                                                            transform: `scale(${
                                                                                element
                                                                                    .filters
                                                                                    ?.scale ||
                                                                                1
                                                                            }) rotate(${
                                                                                element
                                                                                    .filters
                                                                                    ?.rotate ||
                                                                                0
                                                                            }deg) ${
                                                                                element
                                                                                    .filters
                                                                                    ?.flipHorizontal
                                                                                    ? "scaleX(-1)"
                                                                                    : ""
                                                                            } ${
                                                                                element
                                                                                    .filters
                                                                                    ?.flipVertical
                                                                                    ? "scaleY(-1)"
                                                                                    : ""
                                                                            }`,
                                                                            mixBlendMode:
                                                                                element
                                                                                    .filters
                                                                                    ?.blendMode ||
                                                                                "normal",
                                                                            opacity:
                                                                                (element
                                                                                    .filters
                                                                                    ?.opacity ||
                                                                                    100) /
                                                                                100,
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    key={
                                                                        element.id
                                                                    }
                                                                    className="absolute"
                                                                    style={{
                                                                        left: `${element.position.x}px`,
                                                                        top: `${element.position.y}px`,
                                                                        fontFamily:
                                                                            element
                                                                                .style
                                                                                ?.fontFamily,
                                                                        fontSize:
                                                                            element
                                                                                .style
                                                                                ?.fontSize,
                                                                        fontWeight:
                                                                            element
                                                                                .style
                                                                                ?.fontWeight,
                                                                        fontStyle:
                                                                            element
                                                                                .style
                                                                                ?.fontStyle,
                                                                        textDecoration:
                                                                            element
                                                                                .style
                                                                                ?.textDecoration,
                                                                        color: element
                                                                            .style
                                                                            ?.color,
                                                                        textAlign:
                                                                            element
                                                                                .style
                                                                                ?.textAlign,
                                                                        backgroundColor:
                                                                            element
                                                                                .style
                                                                                ?.backgroundColor ||
                                                                            "transparent",
                                                                        padding:
                                                                            element
                                                                                .style
                                                                                ?.padding ||
                                                                            "8px",
                                                                        borderRadius:
                                                                            element
                                                                                .style
                                                                                ?.borderRadius ||
                                                                            "0px",
                                                                        border:
                                                                            element
                                                                                .style
                                                                                ?.border ||
                                                                            "none",
                                                                        opacity:
                                                                            element
                                                                                .style
                                                                                ?.opacity ||
                                                                            1,
                                                                    }}
                                                                >
                                                                    {
                                                                        element.content
                                                                    }
                                                                </div>
                                                            )
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Barra de herramientas */}
                                    <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={undo}
                                            disabled={historyIndex <= 0}
                                        >
                                            <Undo2 className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={redo}
                                            disabled={
                                                historyIndex >=
                                                history.length - 1
                                            }
                                        >
                                            <Redo2 className="h-5 w-5" />
                                        </Button>
                                        <div className="h-6 border-l"></div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const input =
                                                    document.createElement(
                                                        "input"
                                                    );
                                                input.type = "file";
                                                input.accept = "image/*";
                                                input.onchange = (e) => {
                                                    if (
                                                        e.target.files &&
                                                        e.target.files[0]
                                                    ) {
                                                        const newId = `img-${Date.now()}`;
                                                        const newElement = {
                                                            id: newId,
                                                            type: "image",
                                                            content: "",
                                                            position: {
                                                                x: 10,
                                                                y: 10,
                                                            },
                                                            filters: {
                                                                brightness: 100,
                                                                contrast: 100,
                                                                saturation: 100,
                                                                tint: 0,
                                                                hue: 0,
                                                                blur: 0,
                                                                scale: 1,
                                                                rotate: 0,
                                                                opacity: 100,
                                                                blendMode:
                                                                    "normal",
                                                            },
                                                            mask: "none",
                                                        };

                                                        const reader =
                                                            new FileReader();
                                                        reader.onload = (e) => {
                                                            if (
                                                                e.target?.result
                                                            ) {
                                                                newElement.content =
                                                                    e.target.result;
                                                                if (
                                                                    selectedCell
                                                                ) {
                                                                    addElementToCell(
                                                                        selectedCell,
                                                                        newElement
                                                                    );
                                                                } else {
                                                                    addElementToCell(
                                                                        pages[
                                                                            currentPage
                                                                        ]
                                                                            .cells[0]
                                                                            .id,
                                                                        newElement
                                                                    );
                                                                }
                                                            }
                                                        };
                                                        reader.readAsDataURL(
                                                            e.target.files[0]
                                                        );
                                                    }
                                                };
                                                input.click();
                                            }}
                                        >
                                            <ImageIcon className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleAddText}
                                        >
                                            <Type className="h-5 w-5" />
                                        </Button>
                                        <div className="h-6 border-l"></div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (
                                                    selectedElement &&
                                                    selectedCell
                                                ) {
                                                    deleteElementFromCell(
                                                        selectedCell,
                                                        selectedElement
                                                    );
                                                }
                                            }}
                                            disabled={!selectedElement}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    {/* Área de edición */}
                                    <div
                                        className={`bg-white rounded-lg shadow-lg overflow-hidden page-preview ${
                                            getCurrentLayout().cells <= 4
                                                ? "aspect-[4/3]"
                                                : ""
                                        }`}
                                    >
                                        <div
                                            className={`grid ${
                                                getCurrentLayout().template
                                            } gap-4 h-full p-4`}
                                        >
                                            {pages[currentPage].cells.map(
                                                (cell) => (
                                                    <EditableCell
                                                        key={cell.id}
                                                        id={cell.id}
                                                        elements={cell.elements}
                                                        selectedElement={
                                                            selectedCell ===
                                                            cell.id
                                                                ? selectedElement
                                                                : null
                                                        }
                                                        onSelectElement={(
                                                            elementId
                                                        ) => {
                                                            setSelectedElement(
                                                                elementId
                                                            );
                                                            setSelectedCell(
                                                                cell.id
                                                            );
                                                        }}
                                                        onAddElement={(
                                                            element
                                                        ) => {
                                                            const updatedPages =
                                                                [...pages];
                                                            const cellIndex =
                                                                updatedPages[
                                                                    currentPage
                                                                ].cells.findIndex(
                                                                    (c) =>
                                                                        c.id ===
                                                                        cell.id
                                                                );
                                                            if (
                                                                cellIndex !== -1
                                                            ) {
                                                                updatedPages[
                                                                    currentPage
                                                                ].cells[
                                                                    cellIndex
                                                                ].elements.push(
                                                                    element
                                                                );
                                                                updatePages(
                                                                    updatedPages
                                                                );
                                                                setSelectedElement(
                                                                    element.id
                                                                );
                                                                setSelectedCell(
                                                                    cell.id
                                                                );
                                                            }
                                                        }}
                                                        onUpdateElement={(
                                                            elementId,
                                                            updates,
                                                            isDuplicate
                                                        ) => {
                                                            const updatedPages =
                                                                [...pages];
                                                            const cellIndex =
                                                                updatedPages[
                                                                    currentPage
                                                                ].cells.findIndex(
                                                                    (c) =>
                                                                        c.id ===
                                                                        cell.id
                                                                );
                                                            if (
                                                                cellIndex !== -1
                                                            ) {
                                                                if (
                                                                    isDuplicate
                                                                ) {
                                                                    updatedPages[
                                                                        currentPage
                                                                    ].cells[
                                                                        cellIndex
                                                                    ].elements.push(
                                                                        {
                                                                            ...updatedPages[
                                                                                currentPage
                                                                            ].cells[
                                                                                cellIndex
                                                                            ].elements.find(
                                                                                (
                                                                                    el
                                                                                ) =>
                                                                                    el.id ===
                                                                                    elementId
                                                                            ),
                                                                            ...updates,
                                                                        }
                                                                    );
                                                                } else {
                                                                    const elementIndex =
                                                                        updatedPages[
                                                                            currentPage
                                                                        ].cells[
                                                                            cellIndex
                                                                        ].elements.findIndex(
                                                                            (
                                                                                el
                                                                            ) =>
                                                                                el.id ===
                                                                                elementId
                                                                        );
                                                                    if (
                                                                        elementIndex !==
                                                                        -1
                                                                    ) {
                                                                        updatedPages[
                                                                            currentPage
                                                                        ].cells[
                                                                            cellIndex
                                                                        ].elements[
                                                                            elementIndex
                                                                        ] = {
                                                                            ...updatedPages[
                                                                                currentPage
                                                                            ]
                                                                                .cells[
                                                                                cellIndex
                                                                            ]
                                                                                .elements[
                                                                                elementIndex
                                                                            ],
                                                                            ...updates,
                                                                        };
                                                                    }
                                                                }
                                                                updatePages(
                                                                    updatedPages
                                                                );
                                                            }
                                                        }}
                                                        onDeleteElement={(
                                                            elementId
                                                        ) => {
                                                            const updatedPages =
                                                                [...pages];
                                                            const cellIndex =
                                                                updatedPages[
                                                                    currentPage
                                                                ].cells.findIndex(
                                                                    (c) =>
                                                                        c.id ===
                                                                        cell.id
                                                                );
                                                            if (
                                                                cellIndex !== -1
                                                            ) {
                                                                updatedPages[
                                                                    currentPage
                                                                ].cells[
                                                                    cellIndex
                                                                ].elements =
                                                                    updatedPages[
                                                                        currentPage
                                                                    ].cells[
                                                                        cellIndex
                                                                    ].elements.filter(
                                                                        (el) =>
                                                                            el.id !==
                                                                            elementId
                                                                    );
                                                                updatePages(
                                                                    updatedPages
                                                                );
                                                                if (
                                                                    selectedElement ===
                                                                    elementId
                                                                ) {
                                                                    setSelectedElement(
                                                                        null
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                        availableMasks={getCurrentLayout().maskCategories.flatMap(
                                                            (cat) => cat.masks
                                                        )}
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>

                    {/* Sidebar derecho - Navegación de páginas */}
                    <aside className="w-56 border-l bg-white p-4 overflow-y-auto shadow-sm">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium">Páginas</h3>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={duplicateCurrentPage}
                                    >
                                        <svg
                                            width="15"
                                            height="15"
                                            viewBox="0 0 15 15"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                        >
                                            <path
                                                d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z"
                                                fill="currentColor"
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                            ></path>
                                        </svg>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={deleteCurrentPage}
                                        disabled={pages.length <= 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-3">
                                {pages.map((page, index) => (
                                    <div
                                        key={page.id}
                                        className={`border rounded-md p-2 cursor-pointer hover:border-purple-500 transition-colors ${
                                            currentPage === index
                                                ? "border-purple-500 ring-2 ring-purple-200"
                                                : ""
                                        }`}
                                        onClick={() => setCurrentPage(index)}
                                    >
                                        <div className="bg-gray-100 aspect-[4/3] rounded-sm flex items-center justify-center text-xs text-gray-500 relative">
                                            Pág. {index + 1}
                                            {page.cells.some((cell) =>
                                                cell.elements.some(
                                                    (el) =>
                                                        el.type === "image" &&
                                                        el.content
                                                )
                                            ) && (
                                                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                                                    {Array.from({
                                                        length: 4,
                                                    }).map((_, i) => {
                                                        const cell =
                                                            page.cells[i];
                                                        const image =
                                                            cell?.elements.find(
                                                                (el) =>
                                                                    el.type ===
                                                                        "image" &&
                                                                    el.content
                                                            );
                                                        return (
                                                            <div
                                                                key={i}
                                                                className="bg-gray-200 rounded-sm overflow-hidden"
                                                            >
                                                                {image && (
                                                                    <img
                                                                        src={
                                                                            image.content
                                                                        }
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    icon={<Plus className="h-4 w-4" />}
                                    onClick={addPage}
                                >
                                    Añadir página
                                </Button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </DndProvider>
    );
}
