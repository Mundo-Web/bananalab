import { useState } from "react";
import { imageMasks } from "../../constants/masks";
import IconMapper from "../UI/IconMapper";

export const MaskSelector = ({
    selectedMask,
    onSelect,
    availableMasks = [],
}) => {
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
