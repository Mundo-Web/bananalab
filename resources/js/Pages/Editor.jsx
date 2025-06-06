import React from 'react';
import { Head } from '@inertiajs/react';
import EditorLibro from '../Components/Tailwind/BananaLab/Editor';

export default function Editor({ albumId, itemId, presetId, pages }) {
    return (
        <>
            <Head title="Editor de Álbum" />
            
            <div className="editor-page">
                <EditorLibro 
                    albumId={albumId}
                    itemId={itemId}
                    presetId={presetId}
                    pages={pages}
                />
            </div>
        </>
    );
}
