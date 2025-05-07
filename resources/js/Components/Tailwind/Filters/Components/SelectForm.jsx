import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

const SelectForm = ({
    options = [],
    placeholder = "Select an option",
    onChange,
    valueKey,
    labelKey,
    label,
    labelClass,
    className = "customtext-neutral-dark   rounded-xl ",
    disabled = false,
    defaultOption = null,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(defaultOption);
    const [searchTerm, setSearchTerm] = useState("");
    const selectRef = useRef(null);

    // Detectar si `options` es un array de strings o de objetos
    const isArrayOfObjects =
        options.length > 0 && typeof options[0] === "object";

    // Si `options` es un array de strings, usamos valores predeterminados
    const computedValueKey = isArrayOfObjects
        ? valueKey || Object.keys(options[0])[0]
        : null;
    const computedLabelKey = isArrayOfObjects
        ? labelKey || Object.keys(options[0])[1]
        : null;

    // Convertir todas las opciones a un formato uniforme { value, label }
    const normalizedOptions = options.map(
        (option) =>
            isArrayOfObjects
                ? {
                      value: option[computedValueKey],
                      label: option[computedLabelKey],
                  }
                : { value: option, label: option } // Si es un string, lo usamos como value y label
    );

    // Filtrar opciones por búsqueda
    const filteredOptions = normalizedOptions.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                selectRef.current &&
                !selectRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        setSelectedOption(option);
        onChange(option.value);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={selectRef}>
            {label && (
                <label
                    className={`block text-sm mb-1 customtext-neutral-dark ${labelClass}`}
                >
                    {label}
                </label>
            )}
            <button
                className={`w-full relative text-start  px-4 py-3 border focus:ring-0 focus:outline-0   transition-all duration-300 customtext-primary ${className}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                disabled={disabled}
            >
                <span className="block truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center justify-center py-3 pr-2 pointer-events-none">
                    <ChevronDown
                        className={`w-5 h-5 customtext-primary transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                        }`}
                    />
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-[999] w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div className="sticky top-0 bg-white p-2">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 `}
                                placeholder="Search options..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <ul className="py-1" role="listbox">
                        {filteredOptions.map((option) => (
                            <li
                                key={option.value}
                                className={`px-4 py-2 cursor-pointer flex items-center justify-between 
                                    ${
                                        selectedOption &&
                                        selectedOption.value === option.value
                                            ? "bg-blue-500 text-white"
                                            : "hover:bg-gray-100"
                                    }`}
                                onClick={() => handleSelect(option)}
                                role="option"
                                aria-selected={
                                    selectedOption &&
                                    selectedOption.value === option.value
                                }
                            >
                                <span className="block truncate">
                                    {option.label}
                                </span>
                                {selectedOption &&
                                    selectedOption.value === option.value && (
                                        <Check className="w-5 h-5" />
                                    )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SelectForm;
