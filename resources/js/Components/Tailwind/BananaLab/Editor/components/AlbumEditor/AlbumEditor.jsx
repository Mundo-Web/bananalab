// src/components/AlbumEditor/AlbumEditor.jsx
import React, { useState } from "react";
import ImageUpload from "./ImageUpload";
import DraggableImage from "./DraggableImage";

const AlbumEditor = () => {
    const [images, setImages] = useState([]);

    const handleImageUpload = (imageData) => {
        setImages((prevImages) => [
            ...prevImages,
            {
                src: imageData,
                position: { x: 100, y: 100 },
                size: { width: 200, height: 150 },
            },
        ]);
    };

    const handleImageMove = (index, newPosition) => {
        const newImages = [...images];
        newImages[index].position = newPosition;
        setImages(newImages);
    };

    const handleImageResize = (index, newSize) => {
        const newImages = [...images];
        newImages[index].size = newSize;
        setImages(newImages);
    };

    return (
        <div className="album-editor">
            <h2>Editor de Álbumes</h2>

            <ImageUpload onImageUpload={handleImageUpload} />

            <div className="canvas">
                {images.map((image, index) => (
                    <DraggableImage
                        key={index}
                        src={image.src}
                        onMove={(e, data) =>
                            handleImageMove(index, { x: data.x, y: data.y })
                        }
                        onResize={(size) => handleImageResize(index, size)}
                    />
                ))}
            </div>
        </div>
    );
};

export default AlbumEditor;
