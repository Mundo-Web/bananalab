// src/components/AlbumEditor/PageEditor.jsx
import React from "react";

const PageEditor = ({ page, layouts, onUpdateElement }) => {
    const layout = layouts.find((l) => l.id === page.layoutId);

    if (!layout) {
        return (
            <div className="text-center text-gray-500">
                Layout no encontrado
            </div>
        );
    }

    const handleImageUpload = (e, elementId) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            onUpdateElement(page.id, elementId, imageUrl);
        }
    };

    return (
        <div className="relative w-full h-full bg-white border rounded shadow-md p-4">
            {layout.spaces.map((space, index) => {
                const element = page.elements.find((el) => el.id === space.id);

                return (
                    <div
                        key={space.id}
                        className="absolute border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50"
                        style={{
                            left: `${space.x}%`,
                            top: `${space.y}%`,
                            width: `${space.width}%`,
                            height: `${space.height}%`,
                        }}
                    >
                        {element?.image ? (
                            <img
                                src={element.image}
                                alt="Imagen"
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <label className="flex flex-col items-center justify-center text-gray-400 text-sm cursor-pointer">
                                <span>Subir foto</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                        handleImageUpload(e, space.id)
                                    }
                                />
                            </label>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default PageEditor;
