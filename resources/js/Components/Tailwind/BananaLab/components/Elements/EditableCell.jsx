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
}) {
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
            className={`relative aspect-square   bg-gray-50 rounded-lg overflow-hidden ${
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
}
