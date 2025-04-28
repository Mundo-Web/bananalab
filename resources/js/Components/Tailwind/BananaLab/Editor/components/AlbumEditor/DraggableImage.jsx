// src/components/AlbumEditor/DraggableImage.jsx
import React, { useState } from "react";
import { ResizableBox } from "react-resizable";
import { Draggable } from "react-draggable";

const DraggableImage = ({ src, onMove, onResize }) => {
    const [rotation, setRotation] = useState(0);
    const [isCircular, setIsCircular] = useState(false);

    const handleRotate = () => {
        setRotation((prev) => prev + 90);
    };

    const toggleMask = () => {
        setIsCircular(!isCircular);
    };

    return (
        <Draggable onStop={onMove}>
            <div
                style={{
                    transform: `rotate(${rotation}deg)`,
                    cursor: "move",
                    display: "inline-block",
                    borderRadius: isCircular ? "50%" : "0",
                    overflow: "hidden",
                }}
            >
                <ResizableBox
                    width={200}
                    height={150}
                    minConstraints={[100, 100]}
                    maxConstraints={[500, 500]}
                    onResizeStop={(e, data) => onResize(data.size)}
                >
                    <img
                        src={src}
                        alt="Imagen"
                        style={{
                            width: "100%",
                            height: "100%",
                            filter: isCircular ? "grayscale(100%)" : "none",
                        }}
                    />
                </ResizableBox>
                <button onClick={handleRotate}>Rotar</button>
                <button onClick={toggleMask}>Toggle Máscara</button>
            </div>
        </Draggable>
    );
};

export default DraggableImage;
