import { useState, useEffect } from "react";
import { Sliders, Palette, Layers, Settings, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import Button from "../UI/Button";
import Slider from "../UI/Slider";
import { FilterPresets } from "./FilterPresets";
import { AdvancedSettings } from "./AdvancedSettings";

export const FilterControls = ({ filters = {}, onFilterChange, selectedElement }) => {
    const [activeFilterTab, setActiveFilterTab] = useState("basic");
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        color: true,
        transform: false,
        advanced: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Default filter values
    const defaultFilters = {
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
        flipHorizontal: false,
        flipVertical: false,
        ...filters
    };

    const updateFilter = (key, value) => {
        const newFilters = {
            ...defaultFilters,
            [key]: value
        };
        onFilterChange(newFilters);
    };

    const resetFilters = () => {
        const resetValues = {
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
            flipHorizontal: false,
            flipVertical: false
        };
        onFilterChange(resetValues);
    };    const filterTabs = [
        { id: "basic", label: "Básico", icon: Sliders },
        ...(selectedElement?.type === "image" ? [{ id: "presets", label: "Presets", icon: Palette }] : []),
        { id: "advanced", label: "Avanzado", icon: Settings }
    ];

    // Reset to basic tab if presets are not available and current tab is presets
    useEffect(() => {
        if (activeFilterTab === "presets" && selectedElement?.type !== "image") {
            setActiveFilterTab("basic");
        }
    }, [selectedElement?.type, activeFilterTab]);

    return (
        <div className="space-y-4">
            {/* Filter tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
                {filterTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilterTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                                activeFilterTab === tab.id
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>            {/* Reset button */}
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h4 className="text-sm font-medium text-gray-800">
                        {activeFilterTab === "basic" && "Controles básicos"}
                        {activeFilterTab === "presets" && "Filtros predefinidos"}
                        {activeFilterTab === "advanced" && "Configuración avanzada"}
                    </h4>
                    {selectedElement && (
                        <span className="text-xs text-gray-500">
                            {selectedElement.type === "image" ? "Imagen" : "Texto"} seleccionado
                        </span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-xs"
                    icon={<RotateCcw className="h-3 w-3" />}
                >
                    Reset
                </Button>
            </div>

            {/* Filter content */}
            <div className="space-y-4">
                {activeFilterTab === "basic" && (
                    <div className="space-y-4">
                        {/* Basic adjustments */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Ajustes básicos</span>
                                <button
                                    onClick={() => toggleSection("basic")}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {expandedSections.basic ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                            </div>
                            
                            {expandedSections.basic && (
                                <div className="space-y-3">
                                    <Slider
                                        label="Brillo"
                                        value={defaultFilters.brightness}
                                        onChange={(value) => updateFilter("brightness", value)}
                                        min={0}
                                        max={200}
                                        step={1}
                                        unit="%"
                                    />
                                    <Slider
                                        label="Contraste"
                                        value={defaultFilters.contrast}
                                        onChange={(value) => updateFilter("contrast", value)}
                                        min={0}
                                        max={200}
                                        step={1}
                                        unit="%"
                                    />
                                    <Slider
                                        label="Saturación"
                                        value={defaultFilters.saturation}
                                        onChange={(value) => updateFilter("saturation", value)}
                                        min={0}
                                        max={200}
                                        step={1}
                                        unit="%"
                                    />
                                    <Slider
                                        label="Opacidad"
                                        value={defaultFilters.opacity}
                                        onChange={(value) => updateFilter("opacity", value)}
                                        min={0}
                                        max={100}
                                        step={1}
                                        unit="%"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Color adjustments */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Color</span>
                                <button
                                    onClick={() => toggleSection("color")}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {expandedSections.color ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                            </div>
                            
                            {expandedSections.color && (
                                <div className="space-y-3">
                                    <Slider
                                        label="Matiz"
                                        value={defaultFilters.hue}
                                        onChange={(value) => updateFilter("hue", value)}
                                        min={-180}
                                        max={180}
                                        step={1}
                                        unit="°"
                                    />
                                    <Slider
                                        label="Tinte sepia"
                                        value={defaultFilters.tint}
                                        onChange={(value) => updateFilter("tint", value)}
                                        min={0}
                                        max={100}
                                        step={1}
                                        unit="%"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Transform */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Transformar</span>
                                <button
                                    onClick={() => toggleSection("transform")}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {expandedSections.transform ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                            </div>
                            
                            {expandedSections.transform && (
                                <div className="space-y-3">
                                    <Slider
                                        label="Escala"
                                        value={defaultFilters.scale}
                                        onChange={(value) => updateFilter("scale", value)}
                                        min={0.1}
                                        max={3}
                                        step={0.1}
                                        unit="x"
                                    />
                                    <Slider
                                        label="Rotación"
                                        value={defaultFilters.rotate}
                                        onChange={(value) => updateFilter("rotate", value)}
                                        min={-180}
                                        max={180}
                                        step={1}
                                        unit="°"
                                    />
                                    <Slider
                                        label="Desenfoque"
                                        value={defaultFilters.blur}
                                        onChange={(value) => updateFilter("blur", value)}
                                        min={0}
                                        max={20}
                                        step={0.5}
                                        unit="px"
                                    />
                                    
                                    {/* Flip controls */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant={defaultFilters.flipHorizontal ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => updateFilter("flipHorizontal", !defaultFilters.flipHorizontal)}
                                            className="text-xs"
                                        >
                                            Voltear H
                                        </Button>
                                        <Button
                                            variant={defaultFilters.flipVertical ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => updateFilter("flipVertical", !defaultFilters.flipVertical)}
                                            className="text-xs"
                                        >
                                            Voltear V
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}                {activeFilterTab === "presets" && (
                    <FilterPresets
                        onSelectPreset={(presetFilters) => {
                            onFilterChange({ ...defaultFilters, ...presetFilters });
                        }}
                        selectedImage={selectedElement || null}
                    />
                )}                {activeFilterTab === "advanced" && (
                    <AdvancedSettings
                        filters={defaultFilters}
                        onFilterChange={onFilterChange}
                        selectedElement={selectedElement}
                    />
                )}
            </div>
        </div>
    );
};
