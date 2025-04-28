import React from "react";

const AlbumCanvas = ({ pages, currentPageId, onSelectPage }) => {
    return (
        <div className="flex overflow-x-auto space-x-4 p-4 bg-gray-100">
            {pages.map((page, index) => (
                <div
                    key={page.id}
                    className={`w-[200px] h-[150px] bg-white border rounded shadow-md flex items-center justify-center cursor-pointer ${
                        currentPageId === page.id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => onSelectPage(page.id)}
                >
                    <span className="text-sm text-gray-500">
                        Página {index + 1}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default AlbumCanvas;
