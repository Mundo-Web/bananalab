import Button from "../UI/Button";
import { Copy, Plus, Trash2 } from "lucide-react";

export default function EditorPagesPanel({
    pages,
    currentPage,
    onPageChange,
    onAddPage,
    onDuplicatePage,
    onDeletePage,
}) {
    return (
        <aside className="w-full border-l bg-white p-4 overflow-x-auto shadow-sm">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium">Páginas</h3>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onDuplicatePage}
                        >
                            <Copy />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onDeletePage}
                            disabled={pages.length <= 1}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex gap-4 overflow-x-auto">
                    {pages.map((page, index) => (
                        <PageThumbnail
                            key={page.id}
                            page={page}
                            index={index}
                            isActive={currentPage === index}
                            onClick={() => onPageChange(index)}
                        />
                    ))}

                    <Button
                        variant="outline"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={onAddPage}
                    >
                        Añadir página
                    </Button>
                </div>
            </div>
        </aside>
    );
}

function PageThumbnail({ page, index, isActive, onClick }) {
    return (
        <div
            className={`border rounded-md p-2 cursor-pointer hover:border-purple-500 transition-colors ${
                isActive ? "border-purple-500 ring-2 ring-purple-200" : ""
            }`}
            onClick={onClick}
        >
            <div className="bg-gray-100 w-56 aspect-[4/3] rounded-sm flex items-center justify-center text-xs text-gray-500 relative">
                Pág. {index + 1}
                {page.cells.some((cell) =>
                    cell.elements.some(
                        (el) => el.type === "image" && el.content
                    )
                ) && (
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                        {Array.from({ length: 4 }).map((_, i) => {
                            const cell = page.cells[i];
                            const image = cell?.elements.find(
                                (el) => el.type === "image" && el.content
                            );
                            return (
                                <div
                                    key={i}
                                    className="bg-gray-200 rounded-sm overflow-hidden"
                                >
                                    {image && (
                                        <img
                                            src={image.content}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
