// src/components/AlbumEditor/ImageSlot.jsx
import React, { useRef, useState } from "react";

const ImageSlot = ({ space, imageUrl, onImageUpload }) => {
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    const [dragging, setDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleImageClick = () => {
        inputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            onImageUpload(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        const container = containerRef.current;
        const image = imageRef.current;
        if (!container || !image) return;

        const rect = container.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const imgWidth = image.offsetWidth;
        const imgHeight = image.offsetHeight;
        const contWidth = container.offsetWidth;
        const contHeight = container.offsetHeight;

        const newX = offsetX - imgWidth / 2;
        const newY = offsetY - imgHeight / 2;

        // Limitar movimiento para que no salga del espacio
        const limitX = Math.min(0, Math.max(contWidth - imgWidth, newX));
        const limitY = Math.min(0, Math.max(contHeight - imgHeight, newY));

        setPosition({ x: limitX, y: limitY });
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                left: `${space.x}%`,
                top: `${space.y}%`,
                width: `${space.width}%`,
                height: `${space.height}%`,
                border: "1px dashed #999",
                overflow: "hidden",
                cursor: imageUrl ? (dragging ? "grabbing" : "grab") : "pointer",
                backgroundColor: "#f0f0f0",
            }}
            onClick={!imageUrl ? handleImageClick : undefined}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {imageUrl ? (
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Uploaded"
                    style={{
                        position: "absolute",
                        top: `${position.y}px`,
                        left: `${position.x}px`,
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                    + Añadir Foto
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
        </div>
    );
};

export default ImageSlot;
