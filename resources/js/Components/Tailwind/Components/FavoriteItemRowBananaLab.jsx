import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, X } from "lucide-react";
import Tippy from "@tippyjs/react";
import Number2Currency from "../../../Utils/Number2Currency";
import "tippy.js/dist/tippy.css";

const FavoriteItemRowBananaLab = ({ setFavorites, ...item }) => {
    const onDeleteClicked = (itemId) => {
        setFavorites((old) => old.filter((x) => x.id !== itemId));
    };

    const onPlusClicked = () => {
        setFavorites((old) =>
            old.map((x) =>
                x.id === item.id ? { ...x, quantity: (x.quantity || 1) + 1 } : x
            )
        );
    };

    const onMinusClicked = () => {
        setFavorites((old) =>
            old
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
                .filter(Boolean)
        );
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
                        src={`/storage/images/item/${item.image}`}
                        className="block bg-white rounded-lg p-0 aspect-square w-20 h-20 object-cover object-center shadow-sm"
                        alt={item.name}
                        onError={(e) =>
                            (e.target.src = "/api/cover/thumbnail/null")
                        }
                    />
                    {item.discount > 0 && (
                        <motion.div
                            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
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
                        {item?.category && (
                            <span className="block text-xs text-gray-500 mb-1">
                                {item?.category?.name ?? "Sin categoría"}
                            </span>
                        )}
                        <h3 className="font-semibold text-gray-800 line-clamp-2">
                            {item.name}
                        </h3>
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

export default FavoriteItemRowBananaLab;
