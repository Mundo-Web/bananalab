import { Minus, Plus, PlusCircle, Trash2, Book, Package, Star } from "lucide-react";
import Number2Currency from "../../../../Utils/Number2Currency";

const CardItem = ({ setCart, isModal = false, ...item }) => {    const onDeleteClicked = () => {
        setCart(old => old.filter(x => x.id !== item.id));
    };

    const onPlusClicked = () => {
        setCart(old =>
            old.map(x =>
                x.id === item.id ? { ...x, quantity: (x.quantity || 1) + 1 } : x
            )
        );
    };

    const onMinusClicked = () => {
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
    };
    // Calcular precios y descuentos
    const basePrice = item.price || 0;
    const finalPrice = item.final_price || item.price || 0;
    const hasDiscount = basePrice > finalPrice;
    const discountPercentage = hasDiscount ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0;
    const quantity = item.quantity || 1;
    
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
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 ${isModal ? 'p-4' : 'p-6'}`}>
            <div className={`flex ${isModal ? 'gap-3' : 'gap-6'}`}>
                {/* Imagen del producto */}
                <div className="relative flex-shrink-0">
                    <img
                        src={getImageSrc()}
                        alt={item.name}
                        className={`object-cover rounded-lg ${isModal ? 'w-16 h-16' : 'w-24 h-24'}`}
                    />
                    {item.type === 'custom_album' && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full p-1.5 shadow-lg">
                            <Book size={isModal ? 10 : 14} />
                        </div>
                    )}
                    {hasDiscount && (
                        <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            -{discountPercentage}%
                        </div>
                    )}
                </div>

                {/* Información del producto */}
                <div className="flex-1 min-w-0">
                    <div className={`flex justify-between items-start ${isModal ? 'mb-2' : 'mb-3'}`}>
                        <h3 className={`font-semibold text-gray-900 truncate pr-4 ${isModal ? 'text-base' : 'text-lg'}`}>{item.name}</h3>
                        {item.type === 'custom_album' && (
                            <span className={`inline-flex items-center rounded-full font-medium bg-orange-100 text-orange-800 whitespace-nowrap ${isModal ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
                                <Package size={isModal ? 10 : 12} className="mr-1" />
                                {isModal ? 'Custom' : 'Personalizado'}
                            </span>
                        )}
                    </div>

                    {/* Información específica - Solo mostrar en modo completo */}
                    {!isModal && (
                        <>
                            {item.type === 'custom_album' ? (
                                // Información específica para álbumes personalizados
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center text-gray-600">
                                        <span className="font-medium text-gray-700">Páginas:</span>
                                        <span className="ml-1">{item.album_data?.pages_count || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <span className="font-medium text-gray-700">Tapa:</span>
                                        <span className="ml-1">{item.album_data?.selected_cover_type || 'Estándar'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <span className="font-medium text-gray-700">Acabado:</span>
                                        <span className="ml-1">{item.album_data?.selected_finish || 'Estándar'}</span>
                                    </div>
                                    <div className="flex items-center text-green-600">
                                        <Star size={12} className="mr-1" />
                                        <span className="text-xs font-medium">Diseño Único</span>
                                    </div>
                                </div>
                            ) : (
                                // Información para productos regulares
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center text-gray-600">
                                        <span className="font-medium text-gray-700">Marca:</span>
                                        <span className="ml-1">{item.brand?.name || 'Sin marca'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <span className="font-medium text-gray-700">Stock:</span>
                                        <span className={`ml-1 ${(item.stock || 0) >= quantity ? 'text-green-600' : 'text-red-600'}`}>
                                            {(item.stock || 0) >= quantity ? `${item.stock} disponibles` : "Agotado"}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <span className="font-medium text-gray-700">SKU:</span>
                                        <span className="ml-1">{item.sku || 'N/A'}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Información resumida para modal */}
                    {isModal && (
                        <div className="text-xs text-gray-600">
                            {item.type === 'custom_album' ? (
                                <span>{item.album_data?.pages_count || 'N/A'} páginas • {item.album_data?.selected_cover_type || 'Estándar'}</span>
                            ) : (
                                <span>{item.brand?.name || 'Sin marca'} • {item.sku || 'N/A'}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Precio y controles */}
                <div className={`flex flex-col items-end flex-shrink-0 ${isModal ? 'gap-2' : 'gap-4'}`}>
                    {/* Precio */}
                    <div className="text-right">
                        {hasDiscount && (
                            <div className={`text-gray-400 line-through ${isModal ? 'text-xs' : 'text-sm'}`}>
                                S/ {Number2Currency(basePrice * quantity)}
                            </div>
                        )}
                        <div className={`font-bold text-gray-900 ${isModal ? 'text-lg' : 'text-xl'}`}>
                            S/ {Number2Currency(finalPrice * quantity)}
                        </div>
                        {hasDiscount && (
                            <div className={`text-green-600 font-medium ${isModal ? 'text-xs' : 'text-xs'}`}>
                                Ahorras S/ {Number2Currency((basePrice - finalPrice) * quantity)}
                            </div>
                        )}
                    </div>

                    {/* Controles de cantidad */}
                    <div className={`flex items-center border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white ${isModal ? 'text-sm' : ''}`}>
                        <button
                            type="button"
                            onClick={onMinusClicked}
                            className={`text-gray-600 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${isModal ? 'p-1.5' : 'p-2'}`}
                            aria-label="Decrease quantity"
                        >
                            <Minus size={isModal ? 14 : 16} />
                        </button>
                        <div className={`flex justify-center items-center bg-gray-50 border-x border-gray-200 ${isModal ? 'w-10 h-7' : 'w-14 h-9'}`}>
                            <span className={`font-semibold ${isModal ? 'text-xs' : 'text-sm'}`}>{quantity}</span>
                        </div>
                        <button
                            type="button"
                            onClick={onPlusClicked}
                            className={`text-gray-600 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${isModal ? 'p-1.5' : 'p-2'}`}
                            aria-label="Increase quantity"
                        >
                            <Plus size={isModal ? 14 : 16} />
                        </button>
                    </div>

                    {/* Botón eliminar */}
                    <button
                        onClick={onDeleteClicked}
                        className={`flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-200 font-medium ${isModal ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}
                        aria-label="Remove item"
                    >
                        <Trash2 size={isModal ? 14 : 16} />
                        {isModal ? '' : 'Eliminar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CardItem;
