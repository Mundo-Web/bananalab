import { useState } from "react";
import { imageMasks } from "../../constants/masks";

export const MaskSelector = ({
    selectedMask,
    onSelect,
    availableMasks = [],
    selectedImage,
}) => {
    const [activeCategory, setActiveCategory] = useState("Básicas");

    const categories = {};
    imageMasks.forEach((mask) => {
        if (!categories[mask.category]) categories[mask.category] = [];
        if (availableMasks.includes(mask.id) || mask.id === "none") {
            categories[mask.category].push(mask);
        }
    });

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
                Máscaras de imagen
            </h3>

            {/* Pestañas */}
            <div className="flex gap-3 overflow-x-auto pb-2 border-b">
                {Object.keys(categories).map(
                    (category) =>
                        categories[category].length > 0 && (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-2 text-sm rounded-t-md transition font-medium ${
                                    activeCategory === category
                                        ? "bg-purple-100 text-purple-700"
                                        : "text-gray-600 hover:text-purple-600"
                                }`}
                            >
                                {category}
                            </button>
                        )
                )}
            </div>

            {/* Cuadrícula de máscaras */}
            <div className="grid grid-cols-2 gap-4">
                {categories[activeCategory]?.map((mask) => (
                    <div
                        key={mask.id}
                        onClick={() => onSelect(mask.id)}
                        className={`cursor-pointer border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${
                            selectedMask === mask.id
                                ? "ring-2 ring-purple-500 border-purple-300"
                                : "border-gray-200"
                        }`}
                    >
                        <div className="aspect-square bg-white flex items-center justify-center p-2">
                            <img
                                src={selectedImage?.content} // Usa aquí una imagen base de ejemplo para la máscara
                                alt={mask.name}
                                className={`w-full h-full object-cover ${mask.class}`}
                            />
                        </div>
                        <p className="text-center text-sm text-gray-700 p-1 truncate">
                            {mask.name}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
