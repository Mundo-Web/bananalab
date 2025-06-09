import React from 'react';
import { imageMasks } from '../../constants/masks';

const PageRenderer = ({ 
    page, 
    getCurrentLayout, 
    presetData, 
    workspaceDimensions, 
    showBackgroundLayer = true,
    className = "",
    isPreview = false
}) => {
    if (!page || !page.cells || !Array.isArray(page.cells)) return null;

    const layout = getCurrentLayout(page);
    if (!layout) return null;    // Asegurar que workspaceDimensions siempre tenga valores válidos
    const width = workspaceDimensions?.width || 800;
    const height = workspaceDimensions?.height || 600;
    
    // Crear estilos seguros como objetos
    let containerStyle = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        position: 'relative',
        borderRadius: isPreview ? '12px' : undefined,
        overflow: isPreview ? 'hidden' : undefined
    };
    // Si containerStyle llega a ser string, lo forzamos a objeto vacío
    if (typeof containerStyle !== 'object' || Array.isArray(containerStyle)) {
        containerStyle = {};
    }

    let contentStyle = {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        gap: layout.style?.gap || '16px',
        padding: layout.style?.padding || '16px'
    };
    if (typeof contentStyle !== 'object' || Array.isArray(contentStyle)) {
        contentStyle = {};
    }

    return (
        <div
            className={`bg-white rounded-lg shadow-xl ${className}`}
            style={containerStyle}
        >
            {/* Background layer */}
            {showBackgroundLayer && (() => {
                let bgUrl = null;
                if (page.type === 'cover' && presetData?.cover_image) {
                    bgUrl = presetData.cover_image.startsWith('http')
                        ? presetData.cover_image
                        : `/storage/images/item_preset/${presetData.cover_image}`;
                } else if (page.type === 'content' && presetData?.content_layer_image) {
                    bgUrl = presetData.content_layer_image.startsWith('http')
                        ? presetData.content_layer_image
                        : `/storage/images/item_preset/${presetData.content_layer_image}`;
                } else if (page.type === 'final' && presetData?.final_layer_image) {
                    bgUrl = presetData.final_layer_image.startsWith('http')
                        ? presetData.final_layer_image
                        : `/storage/images/item_preset/${presetData.final_layer_image}`;
                }

                const backgroundImageStyle = {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                    pointerEvents: 'none'
                };

                return bgUrl ? (
                    <img
                        src={bgUrl}
                        alt="background"
                        style={backgroundImageStyle}
                    />
                ) : null;
            })()}

            {/* Content layer */}
            <div
                className={`grid ${layout.template}`}
                style={contentStyle}
            >
                {page.cells.map((cell, cellIndex) => {
                    if (!cell || !cell.elements || !Array.isArray(cell.elements)) return null;
                    
                    // Obtener estilos de celda de forma segura
                    let cellStyles = layout.cellStyles?.[cellIndex] || {};
                    if (typeof cellStyles !== 'object' || Array.isArray(cellStyles)) {
                        cellStyles = {};
                    }
                    
                    return (
                        <div
                            key={cell.id}
                            className="relative bg-gray-50 rounded-lg overflow-hidden"
                            style={cellStyles}
                        >
                            {cell.elements.map((element) => {
                                if (!element || !element.id) return null;
                                
                                if (element.type === "image") {
                                    // Crear filtros de imagen de forma segura
                                    const brightness = (element.filters?.brightness || 100) / 100;
                                    const contrast = (element.filters?.contrast || 100) / 100;
                                    const saturate = (element.filters?.saturation || 100) / 100;
                                    const sepia = (element.filters?.tint || 0) / 100;
                                    const hue = (element.filters?.hue || 0) * 3.6;
                                    const blur = element.filters?.blur || 0;
                                    const filterString = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) sepia(${sepia}) hue-rotate(${hue}deg) blur(${blur}px)`;

                                    // Crear transform de forma segura
                                    const scale = element.filters?.scale || 1;
                                    const rotate = element.filters?.rotate || 0;
                                    const flipH = element.filters?.flipHorizontal ? "scaleX(-1)" : "";
                                    const flipV = element.filters?.flipVertical ? "scaleY(-1)" : "";
                                    const transformString = `scale(${scale}) rotate(${rotate}deg) ${flipH} ${flipV}`.trim();

                                    let position = element.position || {};
                                    if (typeof position !== 'object' || Array.isArray(position)) {
                                        position = {};
                                    }
                                    const imageContainerStyle = {
                                        left: `${position.x || 0}px`,
                                        top: `${position.y || 0}px`,
                                        width: "100%",
                                        height: "100%",
                                        zIndex: element.zIndex || 1,
                                        position: 'absolute'
                                    };

                                    const imageStyle = {
                                        filter: filterString,
                                        transform: transformString,
                                        mixBlendMode: element.filters?.blendMode || "normal",
                                        opacity: (element.filters?.opacity || 100) / 100
                                    };

                                    const maskClass = imageMasks.find(m => m.id === element.mask)?.class || "";

                                    return (
                                        <div
                                            key={element.id}
                                            className={`${maskClass}`}
                                            style={imageContainerStyle}
                                        >
                                            <img
                                                src={element.content}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                style={imageStyle}
                                            />
                                        </div>
                                    );
                                } else {
                                    // Elemento de texto
                                    let textPosition = element.position || {};
                                    if (typeof textPosition !== 'object' || Array.isArray(textPosition)) {
                                        textPosition = {};
                                    }
                                    let elementStyle = element.style || {};
                                    if (typeof elementStyle !== 'object' || Array.isArray(elementStyle)) {
                                        elementStyle = {};
                                    }
                                    const textStyle = {
                                        left: `${textPosition.x || 0}px`,
                                        top: `${textPosition.y || 0}px`,
                                        fontFamily: elementStyle.fontFamily || undefined,
                                        fontSize: elementStyle.fontSize || undefined,
                                        fontWeight: elementStyle.fontWeight || undefined,
                                        fontStyle: elementStyle.fontStyle || undefined,
                                        textDecoration: elementStyle.textDecoration || undefined,
                                        color: elementStyle.color || undefined,
                                        textAlign: elementStyle.textAlign || undefined,
                                        backgroundColor: elementStyle.backgroundColor || "transparent",
                                        padding: elementStyle.padding || "8px",
                                        borderRadius: elementStyle.borderRadius || "0px",
                                        border: elementStyle.border || "none",
                                        opacity: elementStyle.opacity || 1,
                                        zIndex: element.zIndex || 1,
                                        position: 'absolute'
                                    };

                                    return (
                                        <div
                                            key={element.id}
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

export default PageRenderer;
