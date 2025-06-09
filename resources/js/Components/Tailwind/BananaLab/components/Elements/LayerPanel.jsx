import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Image, Type, GripVertical } from "lucide-react";

const LayerPanel = ({ elements, onReorder, onSelect, selectedElement }) => {
    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(elements);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        onReorder(items);
    };

    return (
        <div className="bg-white ">
           
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="layers">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                        >
                            {elements.map((element, index) => (
                                <Draggable
                                    key={element.id}
                                    draggableId={element.id}
                                    index={index}
                                >
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`flex items-center p-2 rounded cursor-pointer ${
                                                selectedElement === element.id
                                                    ? "bg-purple-100"
                                                    : "hover:bg-gray-100"
                                            }`}
                                            onClick={() => onSelect(element.id)}
                                        >
                                            <div
                                                {...provided.dragHandleProps}
                                                className="mr-2"
                                            >
                                                <GripVertical size={16} />
                                            </div>
                                            {element.type === "image" ? (
                                                <Image
                                                    size={16}
                                                    className="mr-2"
                                                />
                                            ) : (
                                                <Type
                                                    size={16}
                                                    className="mr-2"
                                                />
                                            )}
                                            <span className="text-sm truncate">
                                                {element.type === "text"
                                                    ? element.content.substring(
                                                          0,
                                                          20
                                                      )
                                                    : `Imagen ${index + 1}`}
                                            </span>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};

export default LayerPanel;
