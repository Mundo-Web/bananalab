import { filterPresets } from "../../constants/filters";
import Button from "../UI/Button";

export const FilterPresets = ({ onSelectPreset }) => {
    return (
        <div className="space-y-4">
            <h3 className="font-medium">Filtros predefinidos</h3>
            <div className="grid grid-cols-2 gap-3">
                {filterPresets.map((preset) => (
                    <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectPreset(preset.filters)}
                    >
                        {preset.name}
                    </Button>
                ))}
            </div>
        </div>
    );
};
