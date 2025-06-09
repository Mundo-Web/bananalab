import React from 'react';
import { imageMasks } from '../../constants/masks';

const PageRendererSimple = ({ 
    page, 
    getCurrentLayout, 
    presetData, 
    workspaceDimensions, 
    showBackgroundLayer = true,
    className = "",
    style = {},
    isPreview = false
}) => {
    // Validaciones básicas
    if (!page || !page.cells || !Array.isArray(page.cells)) {
        return <div>No hay datos de página</div>;
    }

    const layout = getCurrentLayout(page);
    if (!layout) {
        return <div>No hay layout disponible</div>;
    }

    // Crear estilo seguro para el contenedor principal
    let containerStyle = {
        width: (workspaceDimensions && workspaceDimensions.width) ? workspaceDimensions.width : '100%',
        height: (workspaceDimensions && workspaceDimensions.height) ? workspaceDimensions.height : '100%',
        position: 'relative'
    };
    // Validar que style sea un objeto
    if (style && typeof style === 'object' && !Array.isArray(style)) {
        Object.assign(containerStyle, style);
    }
    // Si style es string, ignorar

    return (
        <div
            className={`bg-white rounded-lg shadow-xl ${className}`}
            style={containerStyle}
        >
            {/* Background layer */}
            {showBackgroundLayer && (() => {
                let bgUrl = null;
                if (page.type === 'cover' && presetData && presetData.cover_image) {
                    bgUrl = presetData.cover_image.startsWith('http')
                        ? presetData.cover_image
                        : `/storage/images/item_preset/${presetData.cover_image}`;
                } else if (page.type === 'content' && presetData && presetData.content_layer_image) {
                    bgUrl = presetData.content_layer_image.startsWith('http')
                        ? presetData.content_layer_image
                        : `/storage/images/item_preset/${presetData.content_layer_image}`;
                } else if (page.type === 'final' && presetData && presetData.final_layer_image) {
                    bgUrl = presetData.final_layer_image.startsWith('http')
                        ? presetData.final_layer_image
                        : `/storage/images/item_preset/${presetData.final_layer_image}`;
                }
                
                return bgUrl ? (
                    <img
                        src={bgUrl}
                        alt="background"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            zIndex: 0,
                            pointerEvents: 'none'
                        }}
                    />
                ) : null;
            })()}

            {/* Content layer */}
            <div
                className={`grid ${layout.template || 'grid-cols-1'}`}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    height: '100%',
                    boxSizing: 'border-box',
                    gap: (layout.style && layout.style.gap) ? layout.style.gap : '16px',
                    padding: (layout.style && layout.style.padding) ? layout.style.padding : '16px'
                }}
            >
                {page.cells.map((cell, cellIndex) => {
                    if (!cell || !cell.elements || !Array.isArray(cell.elements)) {
                        return null;
                    }
                    
                    // Estilo seguro para la celda
                    let cellStyle = (layout.cellStyles && layout.cellStyles[cellIndex]) ? layout.cellStyles[cellIndex] : {};
                    if (typeof cellStyle !== 'object' || Array.isArray(cellStyle)) {
                        cellStyle = {};
                    }
                    
                    return (
                        <div
                            key={cell.id || `cell-${cellIndex}`}
                            className="relative bg-gray-50 rounded-lg overflow-hidden"
                            style={cellStyle}
                        >
                            {cell.elements.map((element, elementIndex) => {
                                if (!element || !element.id) {
                                    return null;
                                }
                                
                                if (element.type === "image") {
                                    // Encontrar máscara de forma segura
                                    let maskClass = "";
                                    if (element.mask && imageMasks) {
                                        const mask = imageMasks.find((m) => m.id === element.mask);
                                        if (mask && mask.class) {
                                            maskClass = mask.class;
                                        }
                                    }

                                    // Calcular filtros de forma segura
                                    const filters = element.filters || {};
                                    const brightness = (filters.brightness !== undefined) ? (filters.brightness / 100) : 1;
                                    const contrast = (filters.contrast !== undefined) ? (filters.contrast / 100) : 1;
                                    const saturate = (filters.saturation !== undefined) ? (filters.saturation / 100) : 1;
                                    const sepia = (filters.tint !== undefined) ? (filters.tint / 100) : 0;
                                    const hue = (filters.hue !== undefined) ? (filters.hue * 3.6) : 0;
                                    const blur = filters.blur || 0;

                                    const filterString = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) sepia(${sepia}) hue-rotate(${hue}deg) blur(${blur}px)`;

                                    // Calcular transform de forma segura
                                    const scale = filters.scale || 1;
                                    const rotate = filters.rotate || 0;
                                    const flipH = filters.flipHorizontal ? "scaleX(-1)" : "";
                                    const flipV = filters.flipVertical ? "scaleY(-1)" : "";
                                    const transformString = `scale(${scale}) rotate(${rotate}deg) ${flipH} ${flipV}`.replace(/\s+/g, ' ').trim();

                                    const position = element.position || {};
                                    const x = position.x || 0;
                                    const y = position.y || 0;

                                    return (
                                        <div
                                            key={element.id}
                                            className={`absolute ${maskClass}`}
                                            style={{
                                                left: `${x}px`,
                                                top: `${y}px`,
                                                width: "100%",
                                                height: "100%",
                                                zIndex: element.zIndex || 1
                                            }}
                                        >
                                            <img
                                                src={element.content}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                style={{
                                                    filter: filterString,
                                                    transform: transformString,
                                                    mixBlendMode: filters.blendMode || "normal",
                                                    opacity: (filters.opacity !== undefined) ? (filters.opacity / 100) : 1
                                                }}
                                            />
                                        </div>
                                    );
                                } else {
                                    // Elemento de texto
                                    let elementStyle = element.style || {};
                                    if (typeof elementStyle !== 'object' || Array.isArray(elementStyle)) {
                                        elementStyle = {};
                                    }
                                    let position = element.position || {};
                                    if (typeof position !== 'object' || Array.isArray(position)) {
                                        position = {};
                                    }
                                    const x = position.x || 0;
                                    const y = position.y || 0;

                                    const textStyle = {
                                        left: `${x}px`,
                                        top: `${y}px`,
                                        zIndex: element.zIndex || 1
                                    };

                                    // Agregar estilos de texto de forma segura
                                    if (elementStyle.fontFamily) textStyle.fontFamily = elementStyle.fontFamily;
                                    if (elementStyle.fontSize) textStyle.fontSize = elementStyle.fontSize;
                                    if (elementStyle.fontWeight) textStyle.fontWeight = elementStyle.fontWeight;
                                    if (elementStyle.fontStyle) textStyle.fontStyle = elementStyle.fontStyle;
                                    if (elementStyle.textDecoration) textStyle.textDecoration = elementStyle.textDecoration;
                                    if (elementStyle.color) textStyle.color = elementStyle.color;
                                    if (elementStyle.textAlign) textStyle.textAlign = elementStyle.textAlign;
                                    
                                    textStyle.backgroundColor = elementStyle.backgroundColor || "transparent";
                                    textStyle.padding = elementStyle.padding || "8px";
                                    textStyle.borderRadius = elementStyle.borderRadius || "0px";
                                    textStyle.border = elementStyle.border || "none";
                                    textStyle.opacity = elementStyle.opacity || 1;

                                    return (
                                        <div
                                            key={element.id}
                                            className="absolute"
                                            style={textStyle}
                                        >
                                            {element.content}
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PageRendererSimple;
