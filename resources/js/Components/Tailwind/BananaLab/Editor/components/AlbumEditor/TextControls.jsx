// src/components/AlbumEditor/TextControls.jsx
import React, { useState } from "react";

const TextControls = ({ textRef, onStyleChange }) => {
    const [fontSize, setFontSize] = useState(18);
    const [fontFamily, setFontFamily] = useState("Arial");
    const [fontWeight, setFontWeight] = useState("normal");
    const [fontStyle, setFontStyle] = useState("normal");
    const [textDecoration, setTextDecoration] = useState("none");
    const [textAlign, setTextAlign] = useState("left");
    const [color, setColor] = useState("#000000");

    const handleFontSizeChange = (e) => {
        setFontSize(e.target.value);
        onStyleChange({ fontSize: e.target.value });
    };

    const handleFontFamilyChange = (e) => {
        setFontFamily(e.target.value);
        onStyleChange({ fontFamily: e.target.value });
    };

    const handleFontWeightChange = () => {
        const newWeight = fontWeight === "normal" ? "bold" : "normal";
        setFontWeight(newWeight);
        onStyleChange({ fontWeight: newWeight });
    };

    const handleFontStyleChange = () => {
        const newStyle = fontStyle === "normal" ? "italic" : "normal";
        setFontStyle(newStyle);
        onStyleChange({ fontStyle: newStyle });
    };

    const handleTextDecorationChange = () => {
        const newDecoration = textDecoration === "none" ? "underline" : "none";
        setTextDecoration(newDecoration);
        onStyleChange({ textDecoration: newDecoration });
    };

    const handleTextAlignChange = (e) => {
        setTextAlign(e.target.value);
        onStyleChange({ textAlign: e.target.value });
    };

    const handleColorChange = (e) => {
        setColor(e.target.value);
        onStyleChange({ color: e.target.value });
    };

    return (
        <div className="text-controls">
            <div>
                <label>Fuente</label>
                <select value={fontFamily} onChange={handleFontFamilyChange}>
                    <option value="Arial">Arial</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                </select>
            </div>

            <div>
                <label>Tamaño</label>
                <input
                    type="number"
                    min="10"
                    max="72"
                    value={fontSize}
                    onChange={handleFontSizeChange}
                />
            </div>

            <div>
                <label>Color</label>
                <input
                    type="color"
                    value={color}
                    onChange={handleColorChange}
                />
            </div>

            <div>
                <button onClick={handleFontWeightChange}>
                    {fontWeight === "normal" ? "Negrita" : "Quitar Negrita"}
                </button>
                <button onClick={handleFontStyleChange}>
                    {fontStyle === "normal" ? "Cursiva" : "Quitar Cursiva"}
                </button>
                <button onClick={handleTextDecorationChange}>
                    {textDecoration === "none"
                        ? "Subrayado"
                        : "Quitar Subrayado"}
                </button>
            </div>

            <div>
                <label>Alineación</label>
                <select value={textAlign} onChange={handleTextAlignChange}>
                    <option value="left">Izquierda</option>
                    <option value="center">Centro</option>
                    <option value="right">Derecha</option>
                </select>
            </div>
        </div>
    );
};

export default TextControls;
