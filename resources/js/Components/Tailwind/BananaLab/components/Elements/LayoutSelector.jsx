import { useState } from "react";
import { layouts } from "../../constants/layouts";

export default function LayoutSelector({ currentLayoutId, onLayoutChange }) {
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Organizar layouts por categorías
    const categories = {
        all: { name: "Todos", layouts: layouts },
        hero: { name: "Hero", layouts: layouts.filter(l => l.category === "hero") },
        editorial: { name: "Editorial", layouts: layouts.filter(l => l.category === "editorial") },
        storytelling: { name: "Historia", layouts: layouts.filter(l => l.category === "storytelling") },
        minimal: { name: "Minimal", layouts: layouts.filter(l => l.category === "minimal") },
        creative: { name: "Creativo", layouts: layouts.filter(l => l.category === "creative") },
        classic: { name: "Clásico", layouts: layouts.filter(l => l.category === "classic") }
    };

    const categoryKeys = Object.keys(categories).filter(key =>
        key === "all" || categories[key].layouts.length > 0
    );

    return (
        <div className="w-full">
            {/* Selector de categorías 
            
             <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
                {categoryKeys.map(categoryKey => (
                    <button
                        key={categoryKey}
                        onClick={() => setSelectedCategory(categoryKey)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                            selectedCategory === categoryKey
                                ? "bg-purple-600 text-white shadow-md"
                                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                        }`}
                    >
                        {categories[categoryKey].name}
                        <span className="ml-1 text-xs opacity-75">
                            ({categoryKey === "all" ? layouts.length : categories[categoryKey].layouts.length})
                        </span>
                    </button>
                ))}
            </div>
            */}


            {/* Grid de layouts */}
            <div className="grid grid-cols-2  gap-3 overflow-x-hidden custom-scroll">
                {categories[selectedCategory].layouts.map((layout) => (
                    <div
                        key={layout.id}
                        className={`relative group cursor-pointer transition-all duration-200 
                                 hover:shadow-md hover:scale-102
                        `}
                        onClick={() => onLayoutChange(layout.id)}
                    >
                        {/* Vista previa del layout */}
                        <div className="aspect-square relative bg-white rounded-lg p-2 border border-gray-200">
                            <div
                                className={`w-full h-full grid ${layout.template}`}
                                style={{
                                    gap: '2px',
                                    padding: '4px'
                                }}
                            >
                                {Array.from({ length: layout.cells }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`bg-gradient-to-br from-purple-100 to-purple-200 ${layout.cellStyles?.[i]?.includes('rounded')
                                                ? 'rounded'
                                                : 'rounded-sm'
                                            }`}
                                        style={{
                                            minHeight: '8px'
                                        }}
                                    />
                                ))}
                            </div>
                             {/* Indicador de selección */}
                        {currentLayoutId === layout.id && (
                            <div className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        </div>

                        {/* Información del layout */}
                        <div className="mt-2 text-center">
                            <h4 className="text-xs font-medium text-gray-900 truncate">
                                {layout.name}
                            </h4>
                            {layout.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {layout.description}
                                </p>
                            )}
                            <div className="flex items-center justify-center mt-1 space-x-2">

                                <span className="text-xs text-gray-400">
                                    {layout.cells} {layout.cells === 1 ? 'celda' : 'celdas'}
                                </span>
                            </div>
                        </div>

                       
                    </div>
                ))}
            </div>

            {/* Información adicional */}
            {categories[selectedCategory].layouts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>No hay layouts disponibles en esta categoría.</p>
                </div>
            )}
        </div>
    );
}
