import Button from "../UI/Button";
import { ChevronLeft, Eye, Download } from "lucide-react";

export default function EditorHeader({
    onExport,
    onPreviewToggle,
    previewMode,
}) {
    return (
        <header className="border-b bg-white p-4 flex items-center justify-between shadow-sm ">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Regresar
                </Button>
            </div>

            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800">
                    Editor de Fotos Profesional
                </h1>
                <h2 className="text-lg text-gray-600">
                    Crea collages y diseños impresionantes
                </h2>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="secondary"
                    onClick={onPreviewToggle}
                    icon={<Eye className="h-4 w-4" />}
                >
                    {previewMode ? "Editar" : "Vista previa"}
                </Button>
                <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    icon={<Download className="h-4 w-4" />}
                    onClick={onExport}
                >
                    Exportar
                </Button>
            </div>
        </header>
    );
}
