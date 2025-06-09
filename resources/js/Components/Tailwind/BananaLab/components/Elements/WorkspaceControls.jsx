const WorkspaceControls = ({ currentSize, onSizeChange, presetData, workspaceDimensions }) => {
    const sizes = [
        { id: "preset", label: "Preset Original", description: "Usar dimensiones del preset" },
        { id: "square", label: "Cuadrado (1:1)", width: 600, height: 600 },
        { id: "landscape", label: "Paisaje (16:9)", width: 1280, height: 720 },
        { id: "portrait", label: "Retrato (3:4)", width: 600, height: 800 },
        { id: "wide", label: "Ancho (2:1)", width: 1200, height: 600 },
        { id: "tall", label: "Alto (9:16)", width: 540, height: 960 },
    ];

    // Función para obtener las dimensiones del preset
    const getPresetDimensions = () => {
        if (presetData?.canvas_config) {
            const canvasConfig = typeof presetData.canvas_config === 'string' 
                ? JSON.parse(presetData.canvas_config) 
                : presetData.canvas_config;
            let width = canvasConfig.width;
            let height = canvasConfig.height;
            // Siempre mostrar cm
            return { width, height, unit: 'cm' };
        }
        return null;
    };

    const presetDimensions = getPresetDimensions();

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 h-full items-center">
            {/* Mostrar información de las dimensiones actuales */}
            {workspaceDimensions && (
                <div className="text-sm customtext-neutral-dark font-medium ml-2">
                   {/* <div>Actual: {workspaceDimensions.width}x{workspaceDimensions.height} px</div>
                    {workspaceDimensions.originalWidth && (
                        <div>Original: {workspaceDimensions.originalWidth}x{workspaceDimensions.originalHeight} cm</div>
                    )}
                    {workspaceDimensions.originalWidthPx && (
                        <div>Original en px: {workspaceDimensions.originalWidthPx}x{workspaceDimensions.originalHeightPx} px</div>
                    )}
                    {workspaceDimensions.scale && workspaceDimensions.scale < 1 && (
                        <div>Escala: {Math.round(workspaceDimensions.scale * 100)}%</div>
                    )} */}

                     {workspaceDimensions.originalWidth && (
                        <div>Dimensiones: {workspaceDimensions.originalWidth} cm x{workspaceDimensions.originalHeight} cm</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkspaceControls;
