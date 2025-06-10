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
        <div className="space-y-3">
            {/* Pestañas - formato compacto */}
            <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
                {Object.keys(categories).slice(0, 2).map(
                    (category) =>
                        categories[category].length > 0 && (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`py-1.5 px-2 text-xs rounded-md transition font-medium ${
                                    activeCategory === category
                                        ? "bg-white text-purple-700 shadow-sm"
                                        : "text-gray-600 hover:text-purple-600"
                                }`}
                            >
                                {category}
                            </button>
                        )
                )}
            </div>

            {/* Cuadrícula de máscaras - compacta */}
            <div className="grid grid-cols-3 gap-2">
                {categories[activeCategory]?.slice(0, 6).map((mask) => (
                    <div
                        key={mask.id}
                        onClick={() => onSelect(mask.id)}
                        className={`cursor-pointer border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
                            selectedMask === mask.id
                                ? "ring-2 ring-purple-500 border-purple-300"
                                : "border-gray-200"
                        }`}
                    >
                        <div className="aspect-square bg-white flex items-center justify-center p-1">
                            {selectedImage?.content ? (
                                <img
                                    src={selectedImage.content}
                                    alt={mask.name}
                                    className={`w-full h-full object-cover ${mask.class}`}
                                />
                            ) : (
                                <div className={`w-full h-full bg-gray-200 ${mask.class}`} />
                            )}
                        </div>
                        <p className="text-center text-[10px] text-gray-700 p-1 truncate">
                            {mask.name}
                        </p>
                    </div>
                ))}
            </div>
            
            {/* Ver más opciones */}
            {categories[activeCategory]?.length > 6 && (
                <button className="w-full py-2 text-xs text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition">
                    Ver más máscaras ({categories[activeCategory].length - 6} más)
                </button>
            )}
        </div>
    );
};
