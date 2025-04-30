const WorkspaceControls = ({ currentSize, onSizeChange }) => {
    const sizes = [
        { id: "square", label: "Cuadrado (1:1)", width: 600, height: 600 },
        { id: "landscape", label: "Paisaje (16:9)", width: 1280, height: 720 },
        { id: "portrait", label: "Retrato (3:4)", width: 600, height: 800 },
        { id: "wide", label: "Ancho (2:1)", width: 1200, height: 600 },
        { id: "tall", label: "Alto (9:16)", width: 540, height: 960 },
    ];

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 h-full items-center">
            <label
                htmlFor="canvas-size"
                className="text-sm font-medium text-gray-700"
            >
                Lienzo:
            </label>
            <div className="relative w-full sm:w-40">
                <select
                    id="canvas-size"
                    value={currentSize}
                    onChange={(e) => onSizeChange(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                    {sizes.map((size) => (
                        <option key={size.id} value={size.id}>
                            {size.label}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceControls;
