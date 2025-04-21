import EditorToolbar from "./EditorToolbar";
import EditableCell from "../Elements/EditableCell";

export default function PageEditor({
    page,
    layout,
    selectedElement,
    selectedCell,
    onSelectElement,
    onSelectCell,
    onAddElement,
    onUpdateElement,
    onDeleteElement,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onAddImage,
    onAddText,
}) {
    return (
        <div className="space-y-6">
            <EditorToolbar
                onUndo={onUndo}
                onRedo={onRedo}
                onAddImage={onAddImage}
                onAddText={onAddText}
                onDeleteElement={() => {
                    if (selectedElement && selectedCell) {
                        onDeleteElement(selectedCell, selectedElement);
                    }
                }}
                canUndo={canUndo}
                canRedo={canRedo}
                hasSelectedElement={!!selectedElement}
            />

            <div
                className={`bg-white rounded-lg shadow-lg overflow-hidden page-preview ${
                    layout.cells <= 4 ? "aspect-[4/3]" : ""
                }`}
            >
                <div className={`grid ${layout.template} gap-4 h-full p-4`}>
                    {page.cells.map((cell) => (
                        <EditableCell
                            key={cell.id}
                            id={cell.id}
                            elements={cell.elements}
                            selectedElement={
                                selectedCell === cell.id
                                    ? selectedElement
                                    : null
                            }
                            onSelectElement={(elementId) => {
                                onSelectElement(elementId);
                                onSelectCell(cell.id);
                            }}
                            onAddElement={onAddElement}
                            onUpdateElement={(
                                elementId,
                                updates,
                                isDuplicate
                            ) => {
                                onUpdateElement(
                                    cell.id,
                                    elementId,
                                    updates,
                                    isDuplicate
                                );
                            }}
                            onDeleteElement={(elementId) => {
                                onDeleteElement(cell.id, elementId);
                            }}
                            availableMasks={layout.maskCategories.flatMap(
                                (cat) => cat.masks
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
