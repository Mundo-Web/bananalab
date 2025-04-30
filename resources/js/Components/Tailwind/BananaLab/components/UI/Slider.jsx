import { useState } from "react";

const Slider = ({
    value = [50],
    min = 0,
    max = 100,
    step = 1,
    onValueChange,
    label,
    unit = "%",
}) => {
    const [currentValue, setCurrentValue] = useState(value[0]);

    const handleChange = (e) => {
        const newValue = Number.parseInt(e.target.value);
        setCurrentValue(newValue);
        if (onValueChange) {
            onValueChange([newValue]);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
                <span className="text-sm text-gray-500">
                    {currentValue}
                    {unit}
                </span>
            </div>
            <div className="relative flex w-full touch-none select-none items-center">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
            </div>
        </div>
    );
};
export default Slider;
