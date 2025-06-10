import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, X, Book, Image } from "lucide-react";
import Tippy from "@tippyjs/react";
import Number2Currency from "../../../Utils/Number2Currency";
import { Local } from "sode-extend-react";
import Global from "../../../Utils/Global";
import "tippy.js/dist/tippy.css";

const CartItemRowBananaLab = ({ setCart, triggerShake, ...item }) => {
    const onDeleteClicked = (itemId) => {
        setCart((old) => {
            const newCart = old.filter((x) => x.id !== itemId);
            // Actualizar localStorage
            Local.set(`${Global.APP_CORRELATIVE}_cart`, newCart);
            return newCart;
        });
        
        // Disparar evento de actualización
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { cart: setCart, action: 'remove', itemId }
        }));
    };

    const onPlusClicked = () => {
        // Para álbumes personalizados, no permitir incrementar cantidad ya que cada uno es único
        if (item.type === 'custom_album') {
            triggerShake && triggerShake();
            return;
        }
        
        setCart((old) => {
            const newCart = old.map((x) =>
                x.id === item.id ? { ...x, quantity: (x.quantity || 1) + 1 } : x
            );
            // Actualizar localStorage
            Local.set(`${Global.APP_CORRELATIVE}_cart`, newCart);
            return newCart;
        });
    };

    const onMinusClicked = () => {
        // Para álbumes personalizados, solo permitir eliminar completamente
        if (item.type === 'custom_album') {
            onDeleteClicked(item.id);
            return;
        }
        
        setCart((old) => {
            const newCart = old
                .map((x) => {
                    if (x.id === item.id) {
                        const newQuantity = (x.quantity || 1) - 1;
                        if (newQuantity <= 0) {
                            onDeleteClicked(item.id);
                            return null;
                        }
                        return { ...x, quantity: newQuantity };
                    }
                    return x;
                })
                .filter(Boolean);
            // Actualizar localStorage
            Local.set(`${Global.APP_CORRELATIVE}_cart`, newCart);
            return newCart;
        });
    };

    // Función para obtener la imagen del producto
    const getProductImage = () => {
        if (item.type === 'custom_album') {
            // Para álbumes personalizados, usar la imagen del preset o thumbnail
            if (item.image && item.image.startsWith('data:')) {
                // Es un thumbnail base64
                return item.image;
            } else if (item.image) {
                // Es una imagen del preset
                return `/storage/images/item/${item.image}`;
            } else if (item.preset_data?.cover_image) {
                // Fallback a la imagen del preset
                return `/storage/images/item_preset/${item.preset_data.cover_image}`;
            }
            // Fallback final
            return "/api/cover/thumbnail/null";
        } else {
            // Productos normales
            return `/storage/images/item/${item.image}`;
        }
    };

    // Función para obtener el nombre del producto
    const getProductName = () => {
        if (item.type === 'custom_album') {
            return item.name || `Álbum Personalizado - ${item.preset_data?.name || 'Sin título'}`;
        }
        return item.name;
    };

    return (
        <motion.tr
            className="border-b border-gray-100 font-font-general hover:bg-gray-50 transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
        >
            <td className="p-4 w-28">
                <div className="relative">
                    <img
                        src={getProductImage()}
                        className="block bg-white rounded-lg p-0 aspect-square w-20 h-20 object-cover object-center shadow-sm"
                        alt={getProductName()}
                        onError={(e) =>
                            (e.target.src = "/api/cover/thumbnail/null")
                        }
                    />
                    {/* Indicador de álbum personalizado */}
                    {item.type === 'custom_album' && (
                        <motion.div
                            className="absolute -top-2 -right-2 bg-purple-500 text-white p-1 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                        >
                            <Book size={12} />
                        </motion.div>
                    )}
                    {item.discount > 0 && (
                        <motion.div
                            className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                        >
                            -{Math.round((item.discount / item.price) * 100)}%
                        </motion.div>
                    )}
                </div>
            </td>

            <td className="p-4">
                <div className="flex flex-col h-full justify-between">
                    <div>
                        {item.type === 'custom_album' ? (
                            <div>
                                <span className="block text-xs text-purple-600 mb-1 font-medium">
                                    📖 Álbum Personalizado
                                </span>
                                <h3 className="font-semibold text-gray-800 line-clamp-2">
                                    {getProductName()}
                                </h3>
                                {item.album_data && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        <p>🔗 {item.album_data.pages_count} páginas</p>
                                        <p>🎨 {item.preset_data?.name}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                {item?.category && (
                                    <span className="block text-xs text-gray-500 mb-1">
                                        {item?.category?.name ?? "Sin categoría"}
                                    </span>
                                )}
                                <h3 className="font-semibold text-gray-800 line-clamp-2">
                                    {getProductName()}
                                </h3>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                        {item.type === 'custom_album' ? (
                            // Para álbumes personalizados, solo mostrar botón de eliminar
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 bg-purple-50 px-2 py-1 rounded">
                                    Cantidad: 1 (único)
                                </span>
                                <Tippy content="Eliminar álbum personalizado">
                                    <motion.button
                                        type="button"
                                        onClick={() => onDeleteClicked(item.id)}
                                        className="w-8 h-8 flex justify-center items-center bg-red-50 hover:bg-red-100 transition-colors rounded-lg"
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Trash2 size={16} className="text-red-600" />
                                    </motion.button>
                                </Tippy>
                            </div>
                        ) : (
                            // Para productos normales, controles de cantidad normales
                            <motion.div
                                className="flex items-center border border-gray-200 rounded-lg overflow-hidden"
                                whileHover={{
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                }}
                            >
                                <motion.button
                                    type="button"
                                    onClick={onMinusClicked}
                                    className="w-8 h-8 flex justify-center items-center bg-gray-50 hover:bg-gray-100 transition-colors"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Minus size={16} className="text-gray-600" />
                                </motion.button>

                                <div className="w-8 h-8 flex justify-center items-center bg-white">
                                    <span className="font-medium text-sm text-gray-800">
                                        {item.quantity || 1}
                                    </span>
                                </div>

                                <motion.button
                                    type="button"
                                    onClick={onPlusClicked}
                                    className="w-8 h-8 flex justify-center items-center bg-gray-50 hover:bg-gray-100 transition-colors"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Plus size={16} className="text-gray-600" />
                                </motion.button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </td>

            <td className="p-4 text-right w-28">
                <div className="flex flex-col items-end h-full justify-between">
                    <div>
                        {item?.discount > 0 && (
                            <span className="block text-xs text-gray-400 line-through mb-1">
                                S/. {Number2Currency(item?.price)}
                            </span>
                        )}
                        <p className="font-bold customtext-neutral-dark text-base">
                            S/. {Number2Currency(item?.final_price)}
                        </p>
                    </div>

                    <Tippy
                        content="Eliminar"
                        placement="left"
                        animation="scale"
                    >
                        <motion.button
                            type="button"
                            onClick={() => onDeleteClicked(item?.id)}
                            className="mt-3 p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Trash2 size={18} />
                        </motion.button>
                    </Tippy>
                </div>
            </td>
        </motion.tr>
    );
};

export default CartItemRowBananaLab;
