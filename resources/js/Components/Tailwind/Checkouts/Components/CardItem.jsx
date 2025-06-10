import { Minus, Plus, PlusCircle, Trash2, Book } from "lucide-react";

const CardItem = ({ setCart, ...item }) => {

    const onDeleteClicked = () => {
        setCart(old => old.filter(x => x.id !== item.id));
    }

    const onPlusClicked = () => {
        // Para álbumes personalizados, no permitir incrementar cantidad
        if (item.type === 'custom_album') {
            return;
        }
        
        setCart(old =>
            old.map(x =>
                x.id === item.id ? { ...x, quantity: (x.quantity || 1) + 1 } : x
            )
        );
    }

    const onMinusClicked = () => {
        // Para álbumes personalizados, solo eliminar
        if (item.type === 'custom_album') {
            onDeleteClicked();
            return;
        }
        
        setCart(old =>
            old.map(x => {
                if (x.id === item.id) {
                    const newQuantity = (x.quantity || 1) - 1;
                    if (newQuantity <= 0) {
                        onDeleteClicked(item.id);
                        return null;
                    }
                    return { ...x, quantity: newQuantity };
                }
                return x;
            }).filter(Boolean)
        );
    }
console.log('CardItem: item', item);
    // Determinar la imagen a mostrar
    const getImageSrc = () => {
        if (item.type === 'custom_album') {
        
                return `/storage/images/item_preset/${item.image}`;
           
        }
        return `/storage/images/item/${item.image}`;
    };

    console.log(item);
    return (
        <div key={item.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <img
                        src={getImageSrc()}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                    />
                    {item.type === 'custom_album' && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1">
                            <Book size={12} />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-lg mb-2">{item.name}</h3>

                    {item.type === 'custom_album' ? (
                        // Información específica para álbumes personalizados
                        <>
                            <p className="text-sm customtext-neutral-light">
                                Tipo: <span className="customtext-neutral-dark">🎨 Álbum Personalizado</span>
                            </p>
                            <p className="text-sm customtext-neutral-light">
                                Páginas: <span className="customtext-neutral-dark">{item.album_data?.pages_count || 'N/A'}</span>
                            </p>
                            <p className="text-sm customtext-neutral-light">
                                Estado: <span className="customtext-neutral-dark text-green-600">Diseño Personalizado</span>
                            </p>
                        </>
                    ) : (
                        // Información para productos regulares
                        <>
                            <p className="text-sm customtext-neutral-light">
                                Marca: <span className="customtext-neutral-dark">{item.brand?.name || 'Sin marca'}</span>
                            </p>
                            <p className="text-sm customtext-neutral-light">
                                Disponibilidad: <span className="customtext-neutral-dark">
                                    {(item.stock || 0) >= (item.quantity || 1) ? "En stock" : "Agotado"}
                                </span>
                            </p>
                            <p className="text-sm customtext-neutral-light">
                                SKU: <span className="customtext-neutral-dark">{item.sku || 'N/A'}</span>
                            </p>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-36 text-right">
                        <div className="text-xs text-gray-500 line-through">
                            S/ {Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </div>
                        <div className="font-bold text-lg mt-2">
                            S/ {Number((item.final_price || item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                            {item.type === 'custom_album' ? (
                                // Para álbumes personalizados, solo mostrar cantidad y botón eliminar
                                <div className="flex items-center gap-2">
                                    <div className="border border-gray-200 rounded-lg px-3 py-1 bg-gray-50">
                                        <span className="font-semibold text-sm">Qty: {item.quantity || 1}</span>
                                    </div>
                                    <button
                                        onClick={onDeleteClicked}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                                        aria-label="Remove album"
                                        title="Eliminar álbum personalizado"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ) : (
                                // Para productos regulares, controles normales
                                <>
                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <button
                                            type="button"
                                            onClick={onMinusClicked}
                                            className="p-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <div className="w-12 h-8 flex justify-center items-center bg-white">
                                            <span className="font-semibold text-sm">{item.quantity || 1}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={onPlusClicked}
                                            className="p-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                                            aria-label="Increase quantity"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={onDeleteClicked}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                                        aria-label="Remove item"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>);
}

export default CardItem;
