import React from 'react';
import { imageMasks } from '../../constants/masks';

const PageRenderer = ({ 
    page, 
    getCurrentLayout, 
    presetData, 
    workspaceDimensions, 
    showBackgroundLayer = true,
    className = "",
    style = {},
    isPreview = false
}) => {
    if (!page || !page.cells || !Array.isArray(page.cells)) return null;

    const layout = getCurrentLayout(page);
    if (!layout) return null;

    return (
        <div
            className={`bg-white rounded-lg shadow-xl ${className}`}
            style={{
                width: workspaceDimensions?.width || '100%',
                height: workspaceDimensions?.height || '100%',
                position: 'relative',
                ...style
            }}
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
                            pointerEvents: 'none',
                        }}
                    />
                ) : null;
            })()}

            {/* Content layer */}
            <div
                className={`grid ${layout.template}`}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    height: '100%',
                    boxSizing: 'border-box',
                    gap: layout.style?.gap || '16px',
                    padding: layout.style?.padding || '16px'
                }}
            >
                {page.cells.map((cell, cellIndex) => {
                    if (!cell || !cell.elements || !Array.isArray(cell.elements)) return null;
                    
                    return (                        <div
                            key={cell.id}
                            className="relative bg-gray-50 rounded-lg overflow-hidden"
                            style={
                                layout.cellStyles?.[cellIndex] && 
                                typeof layout.cellStyles[cellIndex] === 'object' && 
                                !Array.isArray(layout.cellStyles[cellIndex])
                                    ? layout.cellStyles[cellIndex] 
                                    : {}
                            }
                        >
                            {cell.elements.map((element) => {
                                if (!element || !element.id) return null;
                                
                                return element.type === "image" ? (
                                    <div
                                        key={element.id}
                                        className={`absolute ${imageMasks.find(
                                            (m) => m.id === element.mask
                                        )?.class || ""}`}
                                        style={{
                                            left: `${element.position?.x || 0}px`,
                                            top: `${element.position?.y || 0}px`,
                                            width: "100%",
                                            height: "100%",
                                            zIndex: element.zIndex || 1,
                                        }}
                                    >
                                        <img
                                            src={element.content}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            style={{
                                                filter: (() => {
                                                    const brightness = (element.filters?.brightness || 100) / 100;
                                                    const contrast = (element.filters?.contrast || 100) / 100;
                                                    const saturate = (element.filters?.saturation || 100) / 100;
                                                    const sepia = (element.filters?.tint || 0) / 100;
                                                    const hue = (element.filters?.hue || 0) * 3.6;
                                                    const blur = element.filters?.blur || 0;
                                                    return `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) sepia(${sepia}) hue-rotate(${hue}deg) blur(${blur}px)`;
                                                })(),
                                                transform: (() => {
                                                    const scale = element.filters?.scale || 1;
                                                    const rotate = element.filters?.rotate || 0;
                                                    const flipH = element.filters?.flipHorizontal ? "scaleX(-1)" : "";
                                                    const flipV = element.filters?.flipVertical ? "scaleY(-1)" : "";
                                                    return `scale(${scale}) rotate(${rotate}deg) ${flipH} ${flipV}`.trim();
                                                })(),
                                                mixBlendMode: element.filters?.blendMode || "normal",
                                                opacity: (element.filters?.opacity || 100) / 100,
                                            }}
                                        />
                                    </div>
                                ) : (                                    <div
                                        key={element.id}
                                        className="absolute"
                                        style={{
                                            left: `${element.position?.x || 0}px`,
                                            top: `${element.position?.y || 0}px`,
                                            fontFamily: element.style?.fontFamily || undefined,
                                            fontSize: element.style?.fontSize || undefined,
                                            fontWeight: element.style?.fontWeight || undefined,
                                            fontStyle: element.style?.fontStyle || undefined,
                                            textDecoration: element.style?.textDecoration || undefined,
                                            color: element.style?.color || undefined,
                                            textAlign: element.style?.textAlign || undefined,
                                            backgroundColor: element.style?.backgroundColor || "transparent",
                                            padding: element.style?.padding || "8px",
                                            borderRadius: element.style?.borderRadius || "0px",
                                            border: element.style?.border || "none",
                                            opacity: element.style?.opacity !== undefined ? Number(element.style.opacity) : 1,
                                            zIndex: element.zIndex || 1,
                                        }}
                                    >
                                        {element.content}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PageRenderer;
