// src/pages/AlbumEditorPage.jsx
import React, { useState } from "react";
import AlbumCanvas from "../components/AlbumEditor/AlbumCanvas";
import PageEditor from "../components/AlbumEditor/PageEditor";

const mockLayouts = [
    {
        id: "layout-1",
        spaces: [
            { id: "space-1", x: 10, y: 10, width: 35, height: 40 },
            { id: "space-2", x: 55, y: 10, width: 35, height: 40 },
        ],
    },
    {
        id: "layout-2",
        spaces: [{ id: "space-1", x: 10, y: 10, width: 80, height: 80 }],
    },
];

const AlbumEditorPage = () => {
    const [pages, setPages] = useState([
        { id: "page-1", layoutId: "layout-1", elements: [] },
        { id: "page-2", layoutId: "layout-2", elements: [] },
    ]);
    const [currentPageId, setCurrentPageId] = useState("page-1");

    const handleUpdateElement = (pageId, elementId, imageUrl) => {
        setPages((prevPages) =>
            prevPages.map((page) => {
                if (page.id === pageId) {
                    const existingElement = page.elements.find(
                        (el) => el.id === elementId
                    );
                    if (existingElement) {
                        existingElement.image = imageUrl;
                    } else {
                        page.elements.push({ id: elementId, image: imageUrl });
                    }
                }
                return { ...page };
            })
        );
    };

    const handleAddPage = () => {
        const newPageId = `page-${Date.now()}`;
        const randomLayout =
            mockLayouts[Math.floor(Math.random() * mockLayouts.length)];

        const newPage = {
            id: newPageId,
            layoutId: randomLayout.id,
            elements: [],
        };

        setPages((prevPages) => [...prevPages, newPage]);
        setCurrentPageId(newPageId);
    };

    const handleDeletePage = () => {
        if (pages.length <= 1) {
            alert("Debe haber al menos una página en el álbum.");
            return;
        }

        const newPages = pages.filter((page) => page.id !== currentPageId);
        setPages(newPages);

        if (newPages.length > 0) {
            setCurrentPageId(newPages[0].id);
        }
    };

    const currentPage = pages.find((page) => page.id === currentPageId);

    return (
        <div className="flex flex-col h-full">
            {/* Botones para agregar y eliminar páginas */}
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
                <div className="flex gap-2">
                    <button
                        onClick={handleAddPage}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        ➕ Nueva Página
                    </button>
                    <button
                        onClick={handleDeletePage}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        🗑️ Eliminar Página
                    </button>
                </div>
                <div className="text-gray-700 font-semibold">
                    Total de páginas: {pages.length}
                </div>
            </div>

            {/* Canvas y editor */}
            <div className="flex flex-1 overflow-hidden">
                <AlbumCanvas
                    pages={pages}
                    currentPageId={currentPageId}
                    onSelectPage={(id) => setCurrentPageId(id)}
                />

                <div className="flex-1 p-4 overflow-auto">
                    {currentPage ? (
                        <PageEditor
                            page={currentPage}
                            layouts={mockLayouts}
                            onUpdateElement={handleUpdateElement}
                        />
                    ) : (
                        <div className="text-center text-gray-500">
                            Selecciona una página
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlbumEditorPage;
