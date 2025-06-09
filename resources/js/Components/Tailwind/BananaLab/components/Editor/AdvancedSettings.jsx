import { FlipHorizontal, FlipVertical } from "lucide-react";
import Button from "../UI/Button";
import Slider from "../UI/Slider";

export const AdvancedSettings = ({ filters = {}, onFilterChange, selectedElement }) => {
    const updateFilter = (key, value) => {
        const newFilters = {
            ...filters,
            [key]: value
        };
        onFilterChange(newFilters);
    };

    return (
        <div className="space-y-4">
            <h3 className="font-medium">Ajustes avanzados</h3>

            {/* Opacity control */}
            <div className="space-y-3">
                <Slider
                    label="Opacidad"
                    value={filters.opacity || 100}
                    onChange={(value) => updateFilter("opacity", value)}
                    min={0}
                    max={100}
                    step={1}
                    unit="%"
                />
            </div>

            {/* Blend mode selection for images */}
            {selectedElement?.type === "image" && (
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Modo de mezcla</label>
                    <select
                        value={filters.blendMode || "normal"}
                        onChange={(e) => updateFilter("blendMode", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                        <option value="normal">Normal</option>
                        <option value="multiply">Multiplicar</option>
                        <option value="screen">Pantalla</option>
                        <option value="overlay">Superposición</option>
                        <option value="soft-light">Luz suave</option>
                        <option value="hard-light">Luz fuerte</option>
                        <option value="color-dodge">Sobreexponer color</option>
                        <option value="color-burn">Subexponer color</option>
                        <option value="darken">Oscurecer</option>
                        <option value="lighten">Aclarar</option>
                        <option value="difference">Diferencia</option>
                        <option value="exclusion">Exclusión</option>
                    </select>
                </div>
            )}

            {/* Additional transform controls */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Transformaciones adicionales</h4>
                
                {/* Z-index control */}
                <Slider
                    label="Profundidad (Z-Index)"
                    value={filters.zIndex || 1}
                    onChange={(value) => updateFilter("zIndex", value)}
                    min={1}
                    max={100}
                    step={1}
                />

                {/* Advanced blur */}
                <Slider
                    label="Desenfoque gaussiano"
                    value={filters.gaussianBlur || 0}
                    onChange={(value) => updateFilter("gaussianBlur", value)}
                    min={0}
                    max={50}
                    step={0.5}
                    unit="px"
                />
            </div>
        </div>
    );
};
