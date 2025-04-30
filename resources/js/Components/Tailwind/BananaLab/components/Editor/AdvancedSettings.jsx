import { FlipHorizontal, FlipVertical } from "lucide-react";
import { blendModeOptions } from "../../constants/blendModes";
import Button from "../UI/Button";
import Slider from "../UI/Slider";

export const AdvancedSettings = ({ element, onUpdate, selectedImage }) => {
    return (
        <div className="space-y-4">
            <h3 className="font-medium">Ajustes avanzados</h3>

            {/*  <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    {blendModeOptions?.map((mode) => {
                        const isActive =
                            element.filters?.blendMode === mode.value;
                        return (
                            <button
                                key={mode.value}
                                className={`flex flex-col items-center border p-2 rounded-md text-xs transition hover:border-gray-400 ${
                                    isActive
                                        ? "border-purple-500 bg-purple-100"
                                        : "border-gray-200"
                                }`}
                                onClick={() =>
                                    onUpdate({
                                        filters: {
                                            ...element.filters,
                                            blendMode: mode.value,
                                        },
                                    })
                                }
                            >
                                <div
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    style={{
                                        mixBlendMode: mode.value,
                                        backgroundImage: `url(${selectedImage.content})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                />
                                <span className="mt-1">{mode.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>*/}

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
        </div>
    );
};
