// src/components/AlbumEditor/TextBlock.jsx
import React, { useState, useRef } from "react";
import TextControls from "./TextControls";

const TextBlock = ({ position, onTextUpdate }) => {
    const [dragging, setDragging] = useState(false);
    const [text, setText] = useState("Haz clic para editar");
    const [localPosition, setLocalPosition] = useState(position);
    const [style, setStyle] = useState({
        fontSize: "18px",
        fontFamily: "Arial",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        textAlign: "left",
        color: "#000000",
    });
    const textRef = useRef(null);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;

        const newX = e.clientX - textRef.current.offsetWidth / 2;
        const newY = e.clientY - textRef.current.offsetHeight / 2;

        setLocalPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setDragging(false);
        onTextUpdate(localPosition, text, style); // Actualiza la posición, el texto y el estilo
    };

    const handleChangeText = (e) => {
        setText(e.target.value);
        onTextUpdate(localPosition, e.target.value, style); // Actualiza el texto
    };

    const handleStyleChange = (newStyle) => {
        setStyle((prevStyle) => ({ ...prevStyle, ...newStyle }));
    };

    return (
        <div>
            <TextControls textRef={textRef} onStyleChange={handleStyleChange} />

            <div
                ref={textRef}
                style={{
                    position: "absolute",
                    left: `${localPosition.x}px`,
                    top: `${localPosition.y}px`,
                    cursor: dragging ? "grabbing" : "grab",
                    fontSize: style.fontSize,
                    fontFamily: style.fontFamily,
                    fontWeight: style.fontWeight,
                    fontStyle: style.fontStyle,
                    textDecoration: style.textDecoration,
                    textAlign: style.textAlign,
                    color: style.color,
                    padding: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <textarea
                    value={text}
                    onChange={handleChangeText}
                    style={{
                        width: "100%",
                        height: "100px",
                        border: "none",
                        backgroundColor: "transparent",
                        outline: "none",
                        fontSize: "inherit",
                        fontFamily: "inherit",
                    }}
                />
            </div>
        </div>
    );
};

export default TextBlock;
