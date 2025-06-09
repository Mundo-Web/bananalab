import { useState, useRef, useEffect } from "react";
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    ChevronDown,
    Italic,
    Palette,
    Underline,
    X,
    Type,
    Minus,
    Plus,
    Maximize2,
    Minimize2,
    Strikethrough,
    Superscript,
    Subscript,
    PaintBucket,
    Square,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    List,
    ListOrdered,
    Indent,
    Outdent,
    RotateCcw,
    RotateCw,
    Highlighter,
    Quote,
    Code,
    ChevronsUpDown,
} from "lucide-react";

const fontFamilies = [
    { name: "Arial", value: "Arial" },
    { name: "Times New Roman", value: "'Times New Roman'" },
    { name: "Helvetica", value: "Helvetica" },
    { name: "Courier New", value: "'Courier New'" },
    { name: "Georgia", value: "Georgia" },
    { name: "Verdana", value: "Verdana" },
    { name: "Impact", value: "Impact" },
    { name: "Roboto", value: "'Roboto', sans-serif" },
    { name: "Open Sans", value: "'Open Sans', sans-serif" },
    { name: "Lato", value: "'Lato', sans-serif" },
    { name: "Pacifico (Cursiva)", value: "'Pacifico', cursive" },
    { name: "Lobster (Estilo Poster)", value: "'Lobster', cursive" },
    { name: "Indie Flower (Manuscrita)", value: "'Indie Flower', cursive" },
    {
        name: "Permanent Marker (Rotulador)",
        value: "'Permanent Marker', cursive",
    },
    { name: "Dancing Script (Elegante)", value: "'Dancing Script', cursive" },
    {
        name: "Shadows Into Light (Dibujada)",
        value: "'Shadows Into Light', cursive",
    },
    { name: "Amatic SC (Minimalista)", value: "'Amatic SC', cursive" },
    { name: "Handlee (Natural)", value: "'Handlee', cursive" },
    { name: "Caveat (Caligráfica)", value: "'Caveat', cursive" },
    { name: "Kalam (Pincel)", value: "'Kalam', cursive" },
];

const fontSizes = [
    "8px",
    "9px",
    "10px",
    "11px",
    "12px",
    "14px",
    "16px",
    "18px",
    "20px",
    "22px",
    "24px",
    "28px",
    "32px",
    "36px",
    "42px",
    "48px",
    "64px",
    "72px",
];

const textTransforms = [
    { label: "Normal", value: "none" },
    { label: "MAYÚSCULAS", value: "uppercase" },
    { label: "minúsculas", value: "lowercase" },
    { label: "Capitalizado", value: "capitalize" },
];

const colorPresets = [
    { color: "#000000", name: "Negro" },
    { color: "#ffffff", name: "Blanco" },
    { color: "#f43f5e", name: "Rojo" },
    { color: "#22c55e", name: "Verde" },
    { color: "#3b82f6", name: "Azul" },
    { color: "#eab308", name: "Amarillo" },
    { color: "#06b6d4", name: "Cian" },
    { color: "#d946ef", name: "Magenta" },
    { color: "#6b7280", name: "Gris" },
    { color: "#a855f7", name: "Púrpura" },
    { color: "#ec4899", name: "Rosa" },
    { color: "#f97316", name: "Naranja" },
    { color: "#0f172a", name: "Azul oscuro" },
    { color: "#7c2d12", name: "Marrón" },
    { color: "#14532d", name: "Verde oscuro" },
    { color: "#4c1d95", name: "Violeta" },
    { color: "#1e293b", name: "Gris oscuro" },
    { color: "#fef3c7", name: "Crema" },
];

const backgroundColorPresets = [
    { color: "transparent", name: "Transparente" },
    { color: "#ffffff", name: "Blanco" },
    { color: "#f8fafc", name: "Gris claro" },
    { color: "#f1f5f9", name: "Plata" },
    { color: "#fef3c7", name: "Crema" },
    { color: "#ffedd5", name: "Melocotón" },
    { color: "#fee2e2", name: "Rosa claro" },
    { color: "#dbeafe", name: "Azul claro" },
    { color: "#dcfce7", name: "Verde claro" },
    { color: "#f3e8ff", name: "Lavanda" },
];

const borderStyles = [
    { label: "Ninguno", value: "none" },
    { label: "Sólido", value: "solid" },
    { label: "Punteado", value: "dotted" },
    { label: "Discontinuo", value: "dashed" },
    { label: "Doble", value: "double" },
    { label: "Acanalado", value: "groove" },
];

const TextToolbar = ({ element, onUpdate, onClose }) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showBgColorPicker, setShowBgColorPicker] = useState(false);
    const [showBorderOptions, setShowBorderOptions] = useState(false);
    const [showFontOptions, setShowFontOptions] = useState(false);
    const [showSizeOptions, setShowSizeOptions] = useState(false);
    const [showTransformOptions, setShowTransformOptions] = useState(false);
    const [showHeadingOptions, setShowHeadingOptions] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");

    const [color, setColor] = useState(element?.style?.color || "#000000");
    const [bgColor, setBgColor] = useState(
        element?.style?.backgroundColor || "transparent"
    );

    const colorPickerRef = useRef(null);
    const bgColorPickerRef = useRef(null);
    const fontOptionsRef = useRef(null);
    const sizeOptionsRef = useRef(null);
    const transformOptionsRef = useRef(null);
    const borderOptionsRef = useRef(null);
    const headingOptionsRef = useRef(null);

    // Cerrar los dropdowns al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                colorPickerRef.current &&
                !colorPickerRef.current.contains(event.target)
            ) {
                setShowColorPicker(false);
            }
            if (
                bgColorPickerRef.current &&
                !bgColorPickerRef.current.contains(event.target)
            ) {
                setShowBgColorPicker(false);
            }
            if (
                fontOptionsRef.current &&
                !fontOptionsRef.current.contains(event.target)
            ) {
                setShowFontOptions(false);
            }
            if (
                sizeOptionsRef.current &&
                !sizeOptionsRef.current.contains(event.target)
            ) {
                setShowSizeOptions(false);
            }
            if (
                transformOptionsRef.current &&
                !transformOptionsRef.current.contains(event.target)
            ) {
                setShowTransformOptions(false);
            }
            if (
                borderOptionsRef.current &&
                !borderOptionsRef.current.contains(event.target)
            ) {
                setShowBorderOptions(false);
            }
            if (
                headingOptionsRef.current &&
                !headingOptionsRef.current.contains(event.target)
            ) {
                setShowHeadingOptions(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleStyleChange = (property, value) => {
        onUpdate({
            style: {
                ...element?.style,
                [property]: value,
            },
        });
    };

    const toggleStyle = (property, value1, value2) => {
        onUpdate({
            style: {
                ...element?.style,
                [property]:
                    element?.style?.[property] === value1 ? value2 : value1,
            },
        });
    };

    const handleSliderChange = (property, value) => {
        handleStyleChange(property, value);
    };

    if (!element) return null;

    // Función para crear un botón de estilo
    const StyleButton = ({ active, onClick, icon, title, className = "" }) => (
        <button
            type="button"
            className={`p-1.5 rounded-sm transition-colors ${
                active
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-700 hover:bg-gray-100"
            } ${className}`}
            onClick={onClick}
            title={title}
        >
            {icon}
        </button>
    );

    // Función para crear un botón de dropdown
    const DropdownButton = ({ onClick, icon, text, isOpen, title }) => (
        <button
            type="button"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md border ${
                isOpen
                    ? "bg-gray-100 border-gray-300"
                    : "border-gray-200 hover:bg-gray-50"
            }`}
            onClick={onClick}
            title={title}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {text && <span className="text-sm truncate">{text}</span>}
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
    );

    return (
        <div className="  bg-white  rounded-lg shadow-sm px-4  border-gray-200  z-50 transition-all duration-200">
            <div className="w-full ">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium flex items-center gap-1.5">
                        <Type className="h-4 w-4" />
                        Formato de texto
                    </h3>
                    <div className="flex items-center gap-1">
                        <button
                            className="p-1 rounded-md hover:bg-gray-100"
                            onClick={() => setIsExpanded(!isExpanded)}
                            title={
                                isExpanded ? "Modo compacto" : "Modo expandido"
                            }
                        >
                            {isExpanded ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </button>
                        <button
                            className="p-1 rounded-md hover:bg-gray-100"
                            onClick={onClose}
                            title="Cerrar"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Pestañas para modo expandido */}
                {isExpanded && (
                    <div className="flex border-b mb-2">
                        <button
                            className={`px-3 py-1.5 text-sm font-medium ${
                                activeTab === "basic"
                                    ? "border-b-2 border-primary customtext-primary"
                                    : "customtext-neutral-dark"
                            }`}
                            onClick={() => setActiveTab("basic")}
                        >
                            Básico
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm font-medium ${
                                activeTab === "paragraph"
                                    ? "border-b-2 border-primary customtext-primary"
                                    : "customtext-neutral-dark"
                            }`}
                            onClick={() => setActiveTab("paragraph")}
                        >
                            Párrafo
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm font-medium ${
                                activeTab === "advanced"
                                    ? "border-b-2 border-primary customtext-primary"
                                    : "customtext-neutral-dark"
                            }`}
                            onClick={() => setActiveTab("advanced")}
                        >
                            Avanzado
                        </button>
                    </div>
                )}

                {/* Controles básicos - siempre visibles */}
                {(activeTab === "basic" || !isExpanded) && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                        {/* Selector de familia de fuente */}
                        <div className="relative" ref={fontOptionsRef}>
                            <select
                                className="px-2 py-1 border rounded-md text-sm"
                                value={element.style?.fontFamily || "Arial"}
                                onChange={(e) => {
                                    handleStyleChange(
                                        "fontFamily",
                                        e.target.value
                                    );
                                }}
                            >
                                {fontFamilies.map((font) => (
                                    <option
                                        key={font.value}
                                        value={font.value}
                                        style={{ fontFamily: font.value }}
                                    >
                                        {font.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector de tamaño de fuente */}
                        <div className="relative" ref={sizeOptionsRef}>
                            <DropdownButton
                                onClick={() =>
                                    setShowSizeOptions(!showSizeOptions)
                                }
                                text={element.style?.fontSize || "16px"}
                                isOpen={showSizeOptions}
                                title="Tamaño de fuente"
                            />

                            {showSizeOptions && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] max-h-60 overflow-y-auto w-24">
                                    {fontSizes.map((size) => (
                                        <button
                                            key={size}
                                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm"
                                            onClick={() => {
                                                handleStyleChange(
                                                    "fontSize",
                                                    size
                                                );
                                                setShowSizeOptions(false);
                                            }}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Botones de estilo básico */}
                        <div className="flex items-center gap-0.5 border rounded-md">
                            <StyleButton
                                active={element.style?.fontWeight === "bold"}
                                onClick={() =>
                                    toggleStyle("fontWeight", "bold", "normal")
                                }
                                icon={<Bold className="h-4 w-4" />}
                                title="Negrita"
                            />
                            <StyleButton
                                active={element.style?.fontStyle === "italic"}
                                onClick={() =>
                                    toggleStyle("fontStyle", "italic", "normal")
                                }
                                icon={<Italic className="h-4 w-4" />}
                                title="Cursiva"
                            />
                            <StyleButton
                                active={
                                    element.style?.textDecoration ===
                                    "underline"
                                }
                                onClick={() =>
                                    toggleStyle(
                                        "textDecoration",
                                        "underline",
                                        "none"
                                    )
                                }
                                icon={<Underline className="h-4 w-4" />}
                                title="Subrayado"
                            />
                            <StyleButton
                                active={
                                    element.style?.textDecoration ===
                                    "line-through"
                                }
                                onClick={() =>
                                    toggleStyle(
                                        "textDecoration",
                                        "line-through",
                                        "none"
                                    )
                                }
                                icon={<Strikethrough className="h-4 w-4" />}
                                title="Tachado"
                            />
                        </div>

                        {/* Botones de alineación */}
                        <div className="flex items-center gap-0.5 border rounded-md">
                            <StyleButton
                                active={element.style?.textAlign === "left"}
                                onClick={() =>
                                    handleStyleChange("textAlign", "left")
                                }
                                icon={<AlignLeft className="h-4 w-4" />}
                                title="Alinear a la izquierda"
                            />
                            <StyleButton
                                active={element.style?.textAlign === "center"}
                                onClick={() =>
                                    handleStyleChange("textAlign", "center")
                                }
                                icon={<AlignCenter className="h-4 w-4" />}
                                title="Centrar"
                            />
                            <StyleButton
                                active={element.style?.textAlign === "right"}
                                onClick={() =>
                                    handleStyleChange("textAlign", "right")
                                }
                                icon={<AlignRight className="h-4 w-4" />}
                                title="Alinear a la derecha"
                            />
                            <StyleButton
                                active={element.style?.textAlign === "justify"}
                                onClick={() =>
                                    handleStyleChange("textAlign", "justify")
                                }
                                icon={<AlignJustify className="h-4 w-4" />}
                                title="Justificar"
                            />
                        </div>

                        {/* Selector de color de texto */}
                        <div className="relative" ref={colorPickerRef}>
                            <button
                                className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                                onClick={() =>
                                    setShowColorPicker(!showColorPicker)
                                }
                                title="Color de texto"
                            >
                                <div
                                    className="w-4 h-4 rounded-sm border"
                                    style={{ backgroundColor: color }}
                                />
                                <Palette className="h-4 w-4" />
                            </button>

                            {showColorPicker && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] p-3 w-64">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium">
                                                Color personalizado
                                            </span>
                                            <div
                                                className="w-6 h-6 rounded-md border"
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            />
                                        </div>

                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => {
                                                setColor(e.target.value);
                                                handleStyleChange(
                                                    "color",
                                                    e.target.value
                                                );
                                            }}
                                            className="w-full h-8 cursor-pointer"
                                        />

                                        <div>
                                            <div className="text-xs font-medium mb-1.5">
                                                Colores predefinidos
                                            </div>
                                            <div className="grid grid-cols-6 gap-1.5">
                                                {colorPresets.map((preset) => (
                                                    <button
                                                        key={preset.color}
                                                        type="button"
                                                        className={`w-8 h-8 rounded-md cursor-pointer border transition-all hover:scale-110 ${
                                                            color ===
                                                            preset.color
                                                                ? "ring-2 ring-offset-1 ring-blue-500"
                                                                : ""
                                                        }`}
                                                        style={{
                                                            backgroundColor:
                                                                preset.color,
                                                        }}
                                                        onClick={() => {
                                                            setColor(
                                                                preset.color
                                                            );
                                                            handleStyleChange(
                                                                "color",
                                                                preset.color
                                                            );
                                                        }}
                                                        title={preset.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selector de color de fondo */}
                        <div className="relative" ref={bgColorPickerRef}>
                            <button
                                className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                                onClick={() =>
                                    setShowBgColorPicker(!showBgColorPicker)
                                }
                                title="Color de fondo"
                            >
                                <div
                                    className="w-4 h-4 rounded-sm border"
                                    style={{
                                        backgroundColor: bgColor,
                                        backgroundImage:
                                            bgColor === "transparent"
                                                ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)"
                                                : "none",
                                        backgroundSize: "8px 8px",
                                        backgroundPosition: "0 0, 4px 4px",
                                    }}
                                />
                                <PaintBucket className="h-4 w-4" />
                            </button>

                            {showBgColorPicker && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] p-3 w-64">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium">
                                                Color de fondo personalizado
                                            </span>
                                            <div
                                                className="w-6 h-6 rounded-md border"
                                                style={{
                                                    backgroundColor: bgColor,
                                                    backgroundImage:
                                                        bgColor ===
                                                        "transparent"
                                                            ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)"
                                                            : "none",
                                                    backgroundSize: "8px 8px",
                                                    backgroundPosition:
                                                        "0 0, 4px 4px",
                                                }}
                                            />
                                        </div>

                                        <input
                                            type="color"
                                            value={
                                                bgColor === "transparent"
                                                    ? "#ffffff"
                                                    : bgColor
                                            }
                                            onChange={(e) => {
                                                setBgColor(e.target.value);
                                                handleStyleChange(
                                                    "backgroundColor",
                                                    e.target.value
                                                );
                                            }}
                                            className="w-full h-8 cursor-pointer"
                                        />

                                        <div>
                                            <div className="text-xs font-medium mb-1.5">
                                                Fondos predefinidos
                                            </div>
                                            <div className="grid grid-cols-5 gap-1.5">
                                                {backgroundColorPresets.map(
                                                    (preset) => (
                                                        <button
                                                            key={preset.color}
                                                            type="button"
                                                            className={`w-10 h-10 rounded-md cursor-pointer border transition-all hover:scale-110 ${
                                                                bgColor ===
                                                                preset.color
                                                                    ? "ring-2 ring-offset-1 ring-blue-500"
                                                                    : ""
                                                            }`}
                                                            style={{
                                                                backgroundColor:
                                                                    preset.color,
                                                                backgroundImage:
                                                                    preset.color ===
                                                                    "transparent"
                                                                        ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)"
                                                                        : "none",
                                                                backgroundSize:
                                                                    "8px 8px",
                                                                backgroundPosition:
                                                                    "0 0, 4px 4px",
                                                            }}
                                                            onClick={() => {
                                                                setBgColor(
                                                                    preset.color
                                                                );
                                                                handleStyleChange(
                                                                    "backgroundColor",
                                                                    preset.color
                                                                );
                                                            }}
                                                            title={preset.name}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Opciones de transformación de texto */}
                        <div className="relative" ref={transformOptionsRef}>
                            <button
                                className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                                onClick={() =>
                                    setShowTransformOptions(
                                        !showTransformOptions
                                    )
                                }
                                title="Transformación de texto"
                            >
                                <ChevronsUpDown className="h-4 w-4" />
                            </button>

                            {showTransformOptions && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] w-48">
                                    {textTransforms.map((transform) => (
                                        <button
                                            key={transform.value}
                                            className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm ${
                                                element.style?.textTransform ===
                                                transform.value
                                                    ? "bg-gray-100"
                                                    : ""
                                            }`}
                                            style={{
                                                textTransform: transform.value,
                                            }}
                                            onClick={() => {
                                                handleStyleChange(
                                                    "textTransform",
                                                    transform.value
                                                );
                                                setShowTransformOptions(false);
                                            }}
                                        >
                                            {transform.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Opciones de encabezado */}
                        <div className="relative" ref={headingOptionsRef}>
                            <button
                                className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                                onClick={() =>
                                    setShowHeadingOptions(!showHeadingOptions)
                                }
                                title="Encabezados"
                            >
                                <Type className="h-4 w-4" />
                            </button>

                            {showHeadingOptions && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-48">
                                    <button
                                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm flex items-center gap-2"
                                        onClick={() => {
                                            handleStyleChange(
                                                "fontSize",
                                                "32px"
                                            );
                                            handleStyleChange(
                                                "fontWeight",
                                                "bold"
                                            );
                                            setShowHeadingOptions(false);
                                        }}
                                    >
                                        <Heading1 className="h-4 w-4" />{" "}
                                        Encabezado 1
                                    </button>
                                    <button
                                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm flex items-center gap-2"
                                        onClick={() => {
                                            handleStyleChange(
                                                "fontSize",
                                                "24px"
                                            );
                                            handleStyleChange(
                                                "fontWeight",
                                                "bold"
                                            );
                                            setShowHeadingOptions(false);
                                        }}
                                    >
                                        <Heading2 className="h-4 w-4" />{" "}
                                        Encabezado 2
                                    </button>
                                    <button
                                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm flex items-center gap-2"
                                        onClick={() => {
                                            handleStyleChange(
                                                "fontSize",
                                                "20px"
                                            );
                                            handleStyleChange(
                                                "fontWeight",
                                                "bold"
                                            );
                                            setShowHeadingOptions(false);
                                        }}
                                    >
                                        <Heading3 className="h-4 w-4" />{" "}
                                        Encabezado 3
                                    </button>
                                    <button
                                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm flex items-center gap-2"
                                        onClick={() => {
                                            handleStyleChange(
                                                "fontSize",
                                                "16px"
                                            );
                                            handleStyleChange(
                                                "fontWeight",
                                                "bold"
                                            );
                                            setShowHeadingOptions(false);
                                        }}
                                    >
                                        <Heading4 className="h-4 w-4" />{" "}
                                        Encabezado 4
                                    </button>
                                    <button
                                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm flex items-center gap-2"
                                        onClick={() => {
                                            handleStyleChange(
                                                "fontSize",
                                                "16px"
                                            );
                                            handleStyleChange(
                                                "fontWeight",
                                                "normal"
                                            );
                                            setShowHeadingOptions(false);
                                        }}
                                    >
                                        <Type className="h-4 w-4" /> Párrafo
                                        normal
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Botones adicionales */}
                        <div className="flex items-center gap-0.5 border rounded-md">
                            <StyleButton
                                active={
                                    element.style?.verticalAlign === "super"
                                }
                                onClick={() =>
                                    toggleStyle(
                                        "verticalAlign",
                                        "super",
                                        "baseline"
                                    )
                                }
                                icon={<Superscript className="h-4 w-4" />}
                                title="Superíndice"
                            />
                            <StyleButton
                                active={element.style?.verticalAlign === "sub"}
                                onClick={() =>
                                    toggleStyle(
                                        "verticalAlign",
                                        "sub",
                                        "baseline"
                                    )
                                }
                                icon={<Subscript className="h-4 w-4" />}
                                title="Subíndice"
                            />
                        </div>
                    </div>
                )}

                {/* Controles de párrafo - visibles en modo expandido */}
                {isExpanded && activeTab === "paragraph" && (
                    <div className="flex flex-wrap gap-2 items-center mt-2">
                        {/* Opciones de lista */}
                        <div className="flex items-center gap-0.5 border rounded-md">
                            <StyleButton
                                active={element.style?.listStyleType === "disc"}
                                onClick={() =>
                                    handleStyleChange(
                                        "listStyleType",
                                        element.style?.listStyleType === "disc"
                                            ? "none"
                                            : "disc"
                                    )
                                }
                                icon={<List className="h-4 w-4" />}
                                title="Lista con viñetas"
                            />
                            <StyleButton
                                active={
                                    element.style?.listStyleType === "decimal"
                                }
                                onClick={() =>
                                    handleStyleChange(
                                        "listStyleType",
                                        element.style?.listStyleType ===
                                            "decimal"
                                            ? "none"
                                            : "decimal"
                                    )
                                }
                                icon={<ListOrdered className="h-4 w-4" />}
                                title="Lista numerada"
                            />
                        </div>

                        {/* Opciones de sangría */}
                        <div className="flex items-center gap-0.5 border rounded-md">
                            <StyleButton
                                onClick={() => {
                                    const currentIndent = Number.parseInt(
                                        element.style?.textIndent || "0"
                                    );
                                    handleStyleChange(
                                        "textIndent",
                                        `${currentIndent + 20}px`
                                    );
                                }}
                                icon={<Indent className="h-4 w-4" />}
                                title="Aumentar sangría"
                            />
                            <StyleButton
                                onClick={() => {
                                    const currentIndent = Number.parseInt(
                                        element.style?.textIndent || "0"
                                    );
                                    if (currentIndent >= 20) {
                                        handleStyleChange(
                                            "textIndent",
                                            `${currentIndent - 20}px`
                                        );
                                    }
                                }}
                                icon={<Outdent className="h-4 w-4" />}
                                title="Disminuir sangría"
                            />
                        </div>

                        {/* Control de espaciado de línea */}
                        <div className="flex items-center gap-2 border rounded-md p-2">
                            <span className="text-xs font-medium">
                                Altura de línea:
                            </span>
                            <div className="flex items-center gap-1">
                                <Minus className="h-3 w-3 text-gray-500" />
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="0.1"
                                    value={Number.parseFloat(
                                        element.style?.lineHeight || "1.5"
                                    )}
                                    onChange={(e) =>
                                        handleSliderChange(
                                            "lineHeight",
                                            e.target.value
                                        )
                                    }
                                    className="w-24"
                                />
                                <Plus className="h-3 w-3 text-gray-500" />
                            </div>
                            <span className="text-xs">
                                {element.style?.lineHeight || "1.5"}
                            </span>
                        </div>

                        {/* Control de espaciado entre letras */}
                        <div className="flex items-center gap-2 border rounded-md p-2">
                            <span className="text-xs font-medium">
                                Espaciado:
                            </span>
                            <div className="flex items-center gap-1">
                                <Minus className="h-3 w-3 text-gray-500" />
                                <input
                                    type="range"
                                    min="-2"
                                    max="10"
                                    step="1"
                                    value={Number.parseInt(
                                        element.style?.letterSpacing || "0"
                                    )}
                                    onChange={(e) =>
                                        handleSliderChange(
                                            "letterSpacing",
                                            `${e.target.value}px`
                                        )
                                    }
                                    className="w-24"
                                />
                                <Plus className="h-3 w-3 text-gray-500" />
                            </div>
                            <span className="text-xs">
                                {element.style?.letterSpacing || "0px"}
                            </span>
                        </div>

                        {/* Opciones de cita y código */}
                        <div className="flex items-center gap-0.5 border rounded-md">
                            <StyleButton
                                active={
                                    element.style?.fontStyle === "italic" &&
                                    element.style?.paddingLeft === "20px" &&
                                    element.style?.borderLeft ===
                                        "4px solid #ccc"
                                }
                                onClick={() => {
                                    if (
                                        element.style?.fontStyle === "italic" &&
                                        element.style?.paddingLeft === "20px" &&
                                        element.style?.borderLeft ===
                                            "4px solid #ccc"
                                    ) {
                                        handleStyleChange(
                                            "fontStyle",
                                            "normal"
                                        );
                                        handleStyleChange("paddingLeft", "0");
                                        handleStyleChange("borderLeft", "none");
                                    } else {
                                        handleStyleChange(
                                            "fontStyle",
                                            "italic"
                                        );
                                        handleStyleChange(
                                            "paddingLeft",
                                            "20px"
                                        );
                                        handleStyleChange(
                                            "borderLeft",
                                            "4px solid #ccc"
                                        );
                                    }
                                }}
                                icon={<Quote className="h-4 w-4" />}
                                title="Formato de cita"
                            />
                            <StyleButton
                                active={
                                    element.style?.fontFamily ===
                                        "'Courier New', monospace" &&
                                    element.style?.backgroundColor ===
                                        "#f5f5f5" &&
                                    element.style?.padding === "2px 4px"
                                }
                                onClick={() => {
                                    if (
                                        element.style?.fontFamily ===
                                            "'Courier New', monospace" &&
                                        element.style?.backgroundColor ===
                                            "#f5f5f5"
                                    ) {
                                        handleStyleChange(
                                            "fontFamily",
                                            "Arial, sans-serif"
                                        );
                                        handleStyleChange(
                                            "backgroundColor",
                                            "transparent"
                                        );
                                        handleStyleChange("padding", "0");
                                    } else {
                                        handleStyleChange(
                                            "fontFamily",
                                            "'Courier New', monospace"
                                        );
                                        handleStyleChange(
                                            "backgroundColor",
                                            "#f5f5f5"
                                        );
                                        handleStyleChange("padding", "2px 4px");
                                    }
                                }}
                                icon={<Code className="h-4 w-4" />}
                                title="Formato de código"
                            />
                        </div>
                    </div>
                )}

                {/* Controles avanzados - visibles en modo expandido */}
                {isExpanded && activeTab === "advanced" && (
                    <div className="flex flex-wrap gap-2 items-center mt-2">
                        {/* Opciones de borde */}
                        <div className="relative" ref={borderOptionsRef}>
                            <button
                                className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                                onClick={() =>
                                    setShowBorderOptions(!showBorderOptions)
                                }
                                title="Opciones de borde"
                            >
                                <Square className="h-4 w-4" />
                                <span className="text-sm">Bordes</span>
                            </button>

                            {showBorderOptions && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] p-3 w-64">
                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <label className="text-xs font-medium block mb-1">
                                                Estilo de borde
                                            </label>
                                            <select
                                                className="w-full p-1.5 border rounded-md text-sm"
                                                value={
                                                    element.style
                                                        ?.borderStyle || "none"
                                                }
                                                onChange={(e) =>
                                                    handleStyleChange(
                                                        "borderStyle",
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                {borderStyles.map((style) => (
                                                    <option
                                                        key={style.value}
                                                        value={style.value}
                                                    >
                                                        {style.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {element.style?.borderStyle &&
                                            element.style?.borderStyle !==
                                                "none" && (
                                                <>
                                                    <div>
                                                        <label className="text-xs font-medium block mb-1">
                                                            Ancho de borde
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="10"
                                                                step="1"
                                                                value={Number.parseInt(
                                                                    element
                                                                        .style
                                                                        ?.borderWidth ||
                                                                        "1"
                                                                )}
                                                                onChange={(e) =>
                                                                    handleStyleChange(
                                                                        "borderWidth",
                                                                        `${e.target.value}px`
                                                                    )
                                                                }
                                                                className="flex-1"
                                                            />
                                                            <span className="text-xs">
                                                                {element.style
                                                                    ?.borderWidth ||
                                                                    "1px"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-medium block mb-1">
                                                            Color de borde
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={
                                                                    element
                                                                        .style
                                                                        ?.borderColor ||
                                                                    "#000000"
                                                                }
                                                                onChange={(e) =>
                                                                    handleStyleChange(
                                                                        "borderColor",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-8 h-8"
                                                            />
                                                            <div className="grid grid-cols-5 gap-1 flex-1">
                                                                {[
                                                                    "#000000",
                                                                    "#cccccc",
                                                                    "#ff0000",
                                                                    "#0000ff",
                                                                    "#00ff00",
                                                                ].map(
                                                                    (color) => (
                                                                        <button
                                                                            key={
                                                                                color
                                                                            }
                                                                            type="button"
                                                                            className="w-6 h-6 rounded-sm border"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    color,
                                                                            }}
                                                                            onClick={() =>
                                                                                handleStyleChange(
                                                                                    "borderColor",
                                                                                    color
                                                                                )
                                                                            }
                                                                        />
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-medium block mb-1">
                                                            Radio de borde
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="50"
                                                                step="1"
                                                                value={Number.parseInt(
                                                                    element
                                                                        .style
                                                                        ?.borderRadius ||
                                                                        "0"
                                                                )}
                                                                onChange={(e) =>
                                                                    handleStyleChange(
                                                                        "borderRadius",
                                                                        `${e.target.value}px`
                                                                    )
                                                                }
                                                                className="flex-1"
                                                            />
                                                            <span className="text-xs">
                                                                {element.style
                                                                    ?.borderRadius ||
                                                                    "0px"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Opciones de sombra de texto */}
                        <div className="flex items-center gap-2 border rounded-md p-2">
                            <span className="text-xs font-medium">Sombra:</span>
                            <button
                                className={`px-2 py-1 text-xs rounded ${
                                    element.style?.textShadow
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100"
                                }`}
                                onClick={() => {
                                    if (element.style?.textShadow) {
                                        handleStyleChange("textShadow", "");
                                    } else {
                                        handleStyleChange(
                                            "textShadow",
                                            "1px 1px 2px rgba(0,0,0,0.3)"
                                        );
                                    }
                                }}
                            >
                                {element.style?.textShadow
                                    ? "Quitar"
                                    : "Añadir"}
                            </button>
                            {element.style?.textShadow && (
                                <select
                                    className="text-xs p-1 border rounded"
                                    value={element.style?.textShadow}
                                    onChange={(e) =>
                                        handleStyleChange(
                                            "textShadow",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="1px 1px 2px rgba(0,0,0,0.3)">
                                        Suave
                                    </option>
                                    <option value="2px 2px 4px rgba(0,0,0,0.4)">
                                        Medio
                                    </option>
                                    <option value="3px 3px 6px rgba(0,0,0,0.5)">
                                        Fuerte
                                    </option>
                                    <option value="0 0 5px rgba(0,0,255,0.5)">
                                        Resplandor azul
                                    </option>
                                    <option value="0 0 5px rgba(255,0,0,0.5)">
                                        Resplandor rojo
                                    </option>
                                </select>
                            )}
                        </div>

                        {/* Opciones de opacidad */}
                        <div className="flex items-center gap-2 border rounded-md p-2">
                            <span className="text-xs font-medium">
                                Opacidad:
                            </span>
                            <div className="flex items-center gap-1">
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={Number.parseFloat(
                                        element.style?.opacity || "1"
                                    )}
                                    onChange={(e) =>
                                        handleSliderChange(
                                            "opacity",
                                            e.target.value
                                        )
                                    }
                                    className="w-24"
                                />
                            </div>
                            <span className="text-xs">
                                {Math.round(
                                    Number.parseFloat(
                                        element.style?.opacity || "1"
                                    ) * 100
                                )}
                                %
                            </span>
                        </div>

                        {/* Opciones de resaltado */}
                        <div className="flex items-center gap-1">
                            <button
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-md border ${
                                    element.style?.backgroundColor === "#ffff00"
                                        ? "bg-yellow-100"
                                        : "bg-white hover:bg-gray-50"
                                }`}
                                onClick={() => {
                                    if (
                                        element.style?.backgroundColor ===
                                        "#ffff00"
                                    ) {
                                        handleStyleChange(
                                            "backgroundColor",
                                            "transparent"
                                        );
                                    } else {
                                        handleStyleChange(
                                            "backgroundColor",
                                            "#ffff00"
                                        );
                                    }
                                }}
                                title="Resaltar texto"
                            >
                                <Highlighter className="h-4 w-4" />
                                <span className="text-sm">Resaltar</span>
                            </button>
                        </div>

                        {/* Botones de historial */}
                        <div className="flex items-center gap-0.5 border rounded-md ml-auto">
                            <StyleButton
                                onClick={() => {
                                    // Aquí iría la lógica para deshacer
                                    alert("Función deshacer (implementar)");
                                }}
                                icon={<RotateCcw className="h-4 w-4" />}
                                title="Deshacer"
                            />
                            <StyleButton
                                onClick={() => {
                                    // Aquí iría la lógica para rehacer
                                    alert("Función rehacer (implementar)");
                                }}
                                icon={<RotateCw className="h-4 w-4" />}
                                title="Rehacer"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextToolbar;
