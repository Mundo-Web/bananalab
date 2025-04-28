import { FlipHorizontal, FlipVertical } from "lucide-react";
import { blendModes } from "../../constants/blendModes";
import Button from "../UI/Button";
import Slider from "../UI/Slider";

export const AdvancedSettings = ({ element, onUpdate }) => {
    return (
        <div className="space-y-4">
            <h3 className="font-medium">Ajustes avanzados</h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modo de mezcla
                </label>
                <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={element.filters?.blendMode || "normal"}
                    onChange={(e) =>
                        onUpdate({
                            filters: {
                                ...element.filters,
                                blendMode: e.target.value,
                            },
                        })
                    }
                >
                    {blendModes.map((mode) => (
                        <option key={mode} value={mode}>
                            {mode}
                        </option>
                    ))}
                </select>
            </div>

            <Slider
                label="Opacidad"
                value={[element.filters?.opacity || 100]}
                min={0}
                max={100}
                onValueChange={(value) =>
                    onUpdate({
                        filters: { ...element.filters, opacity: value[0] },
                    })
                }
            />

            <div className="grid grid-cols-2 gap-3">
                <Button
                    variant={
                        element.filters?.flipHorizontal
                            ? "secondary"
                            : "outline"
                    }
                    size="sm"
                    onClick={() =>
                        onUpdate({
                            filters: {
                                ...element.filters,
                                flipHorizontal:
                                    !element.filters?.flipHorizontal,
                            },
                        })
                    }
                >
                    <FlipHorizontal className="h-4 w-4 mr-1" />
                    Voltear H
                </Button>
                <Button
                    variant={
                        element.filters?.flipVertical ? "secondary" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                        onUpdate({
                            filters: {
                                ...element.filters,
                                flipVertical: !element.filters?.flipVertical,
                            },
                        })
                    }
                >
                    <FlipVertical className="h-4 w-4 mr-1" />
                    Voltear V
                </Button>
            </div>
        </div>
    );
};
