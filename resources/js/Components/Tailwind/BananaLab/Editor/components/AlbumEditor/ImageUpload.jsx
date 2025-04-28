// src/components/AlbumEditor/ImageUpload.jsx
import React, { useState } from "react";

const ImageUpload = ({ onImageUpload }) => {
    const [image, setImage] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                onImageUpload(reader.result); // Pasamos la imagen al editor principal
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="image-upload">
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {image && (
                <img
                    src={image}
                    alt="Imagen subida"
                    className="preview-image"
                />
            )}
        </div>
    );
};

export default ImageUpload;
