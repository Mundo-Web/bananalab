import { useDrop } from "react-dnd";
import { Upload } from "lucide-react";
import ImageElement from "./ImageElement";
import TextElement from "./TextElement";

export default function EditableCell({
    id,
    elements = [],
    selectedElement,
    onSelectElement,
    onAddElement,
    onUpdateElement,
    onDeleteElement,
    availableMasks = [],
    workspaceSize = { width: 800, height: 600 }, // Tamaño del workspace completo
    cellSize = "auto", // Tamaño específico de esta celda si se necesita
    cellStyle = "", // Estilo dinámico del layout
}) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ["IMAGE_FILE", "TEXT_ELEMENT", "IMAGE_ELEMENT"],
        drop: (item) => {
            if (item.files) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        const newElement = {
                            id: `img-${Date.now()}`,
                            type: "image",
                            content: e.target.result,
                            position: { x: 0.05, y: 0.05 }, // Posición en porcentajes
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
                        onAddElement(newElement, id);
                        console.log('[EditableCell] onAddElement', { cellId: id, elementId: newElement.id });
                        onSelectElement(newElement.id, id);
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
                            position: { x: 0.05, y: 0.05 }, // Posición en porcentajes
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
                        onAddElement(newElement, id);
                        console.log('[EditableCell] onAddElement', { cellId: id, elementId: newElement.id });
                        onSelectElement(newElement.id, id);
                    }
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        };
        input.click();
    };

    // Definir las clases de tamaño (mantenidas para compatibilidad)
    const sizeClasses = {
        square: "aspect-square", // 1:1
        landscape: "aspect-video", // 16:9
        portrait: "aspect-[3/4]", // 3:4
        wide: "aspect-[2/1]", // 2:1
        tall: "aspect-[9/16]", // 9:16
        custom: "h-[500px]", // tamaño personalizado
        auto: "w-full h-full", // Ocupa todo el espacio disponible en el grid
    };

    // Determinar si la celda tiene contenido para aplicar el border correcto
    const hasContent = elements.length > 0;

    return (
        <div
            ref={drop}
            className={`relative w-full h-full ${cellStyle || 'rounded-lg overflow-hidden'} ${
                isOver ? "ring-2 ring-purple-500 bg-transparent" : ""
            } ${
                !hasContent 
                    ? "border-2 border-dashed border-gray-300 bg-transparent hover:border-gray-400 hover:bg-transparent hover:text-white" 
                    : "bg-transparent"
            }`}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onSelectElement(null, id);
                }
            }}
            style={{
                isolation: "isolate",
                background: hasContent ? "transparent" : undefined,
                minHeight: "120px", // Altura mínima para celdas muy pequeñas
            }}
        >
            {elements.length === 0 ? (
                <div
                    className="absolute group inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        openFileExplorer();
                    }}
                >
                    <Upload className="h-8 w-8 text-gray-300 group-hover:text-white" />
                    <p className="text-sm text-gray-400 group-hover:text-white">
                        Haz clic o arrastra una imagen
                    </p>
                </div>
            ) : (
                elements.map((element) => (
                    <div
                        key={element.id}
                        className="absolute inset-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {element.type === "image" ? (
                            <ImageElement
                                element={element}
                                isSelected={selectedElement === element.id}
                                onSelect={() => onSelectElement(element.id, id)}
                                onUpdate={(updates) =>
                                    onUpdateElement(element.id, updates)
                                }
                                onDelete={() => onDeleteElement(element.id)}
                                availableMasks={availableMasks}
                                workspaceSize={workspaceSize}
                            />
                        ) : (
                            <TextElement
                                element={element}
                                workspaceSize={workspaceSize}
                                isSelected={selectedElement === element.id}
                                onSelect={() => onSelectElement(element.id, id)}
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
}
