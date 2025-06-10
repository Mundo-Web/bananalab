import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactModal from "react-modal";
import CartItemRow from "./CartItemRow";
import Number2Currency from "../../../Utils/Number2Currency";
import { ShoppingBag, X, ArrowRight, ShoppingCart } from "lucide-react";
import { Local } from "sode-extend-react";
import Global from "../../../Utils/Global";
import CartItemRowBananaLab from "./CartItemRowBananaLab";

ReactModal.setAppElement("#app");

const CartModalBananaLab = ({
    data,
    cart,
    setCart,
    modalOpen,
    setModalOpen,
}) => {
    const [isClosing, setIsClosing] = useState(false);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        if (modalOpen) {
            document.body.classList.add("overflow-hidden");
            document.documentElement.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
            document.documentElement.classList.remove("overflow-hidden");
        }
    }, [modalOpen]);

    // Escuchar eventos de actualización del carrito
    useEffect(() => {
        const handleCartUpdate = (event) => {
            console.log('📢 CartModal: Carrito actualizado:', event.detail);
            // Recargar carrito desde localStorage para sincronizar
            const updatedCart = Local.get(`${Global.APP_CORRELATIVE}_cart`) || [];
            console.log('🔄 CartModal: Cargando carrito desde localStorage:', updatedCart);
            
            // Solo actualizar si el carrito realmente cambió
            if (JSON.stringify(updatedCart) !== JSON.stringify(cart)) {
                console.log('✅ CartModal: Actualizando carrito con datos diferentes');
                setCart(updatedCart);
            } else {
                console.log('ℹ️ CartModal: Carrito sin cambios, no actualizar');
            }
            
            // Si el modal está cerrado y se agregó algo, activar shake
            if (!modalOpen && event.detail.action === 'add') {
                triggerShake();
            }
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, [modalOpen, setCart, cart]); // Agregar cart como dependencia

    // También sincronizar cuando se abre el modal
    useEffect(() => {
        if (modalOpen) {
            console.log('🔄 CartModal: Modal abierto, sincronizando carrito...');
            const currentCart = Local.get(`${Global.APP_CORRELATIVE}_cart`) || [];
            console.log('📦 CartModal: Carrito desde localStorage:', currentCart);
            setCart(currentCart);
        }
    }, [modalOpen, setCart]);

    // Escuchar eventos de actualización del carrito
    useEffect(() => {
        const handleCartUpdate = (event) => {
            console.log('📢 CartModal: Carrito actualizado:', event.detail);
            // Recargar carrito desde localStorage para sincronizar
            const updatedCart = Local.get(`${Global.APP_CORRELATIVE}_cart`) || [];
            setCart(updatedCart);
            
            // Si el modal está cerrado y se agregó algo, activar shake
            if (!modalOpen && event.detail.action === 'add') {
                triggerShake();
            }
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, [modalOpen, setCart]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setModalOpen(false);
            setIsClosing(false);
        }, 300);
    };

    const totalPrice = cart.reduce((acc, item) => {
        return acc + item.final_price * item.quantity;
    }, 0);

    const itemCount = cart.reduce((acc, item) => {
        return acc + item.quantity;
    }, 0);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 1000);
    };

    // Animaciones
    const modalVariants = {
        hidden: { x: "100%", opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 300,
            },
        },
        exit: {
            x: "100%",
            opacity: 0,
            transition: {
                ease: "easeInOut",
                duration: 0.3,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.4,
            },
        }),
        exit: { opacity: 0, x: 50 },
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
    };

    return (
        <AnimatePresence>
            {modalOpen && (
                <ReactModal
                    isOpen={modalOpen}
                    onRequestClose={handleClose}
                    closeTimeoutMS={300}
                    contentLabel="Carrito de compras"
                    className="absolute right-0 top-0 bottom-0 bg-white p-6 rounded-l-2xl shadow-2xl w-full max-w-md outline-none h-screen flex flex-col"
                    overlayClassName="fixed inset-0 z-50"
                >
                    <motion.div
                        className="flex-1 flex flex-col"
                        initial="hidden"
                        animate={isClosing ? "exit" : "visible"}
                        exit="exit"
                        variants={modalVariants}
                    >
                        {/* Encabezado */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                            <motion.div
                                className="flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <ShoppingBag
                                    className="text-primary"
                                    size={24}
                                />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Tu Carrito
                                </h2>
                                <motion.span
                                    className="bg-primary text-white text-sm font-medium px-2 py-1 rounded-full"
                                    animate={
                                        shake
                                            ? {
                                                  scale: [1, 1.1, 1],
                                                  rotate: [0, 5, -5, 0],
                                              }
                                            : {}
                                    }
                                    transition={{ duration: 0.6 }}
                                >
                                    {itemCount}{" "}
                                    {itemCount === 1 ? "ítem" : "ítems"}
                                </motion.span>
                            </motion.div>

                            <motion.button
                                onClick={handleClose}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                aria-label="Cerrar carrito"
                            >
                                <X size={24} className="text-gray-500" />
                            </motion.button>
                        </div>

                        {/* Lista de productos */}
                        {cart.length > 0 ? (
                            <motion.div
                                className="flex-1 overflow-y-auto pr-2 scroll__carrito"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <AnimatePresence>
                                    {cart.map((item, index) => (
                                        <motion.table
                                            key={`${item.id}-${index}`}
                                            custom={index}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            variants={itemVariants}
                                            layout
                                            className="mb-4"
                                        >
                                            <CartItemRowBananaLab
                                                {...item}
                                                setCart={setCart}
                                                triggerShake={triggerShake}
                                            />
                                        </motion.table>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <motion.div
                                className="flex-1 flex flex-col items-center justify-center gap-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <ShoppingCart
                                    size={48}
                                    className="text-gray-300"
                                />
                                <p className="text-gray-500 text-lg">
                                    Tu carrito está vacío
                                </p>
                                <motion.button
                                    onClick={handleClose}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-2 bg-primary text-white rounded-lg font-medium"
                                >
                                    Seguir comprando
                                </motion.button>
                            </motion.div>
                        )}

                        {/* Resumen y checkout */}
                        {cart.length > 0 && (
                            <motion.div
                                className="pt-4 border-t border-gray-100"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-gray-700 font-medium">
                                        Subtotal
                                    </span>
                                    <span className="text-gray-900 font-bold text-xl">
                                        S/. {Number2Currency(totalPrice)}
                                    </span>
                                </div>

                                <motion.a
                                    href="/cart"
                                    whileHover={{
                                        scale: 1.02,
                                        boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                                >
                                    Proceder al pago
                                    <ArrowRight size={20} />
                                </motion.a>

                                <motion.button
                                    onClick={handleClose}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full mt-3 bg-white text-primary border border-primary py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    Seguir comprando
                                </motion.button>
                            </motion.div>
                        )}
                    </motion.div>
                </ReactModal>
            )}
        </AnimatePresence>
    );
};

export default CartModalBananaLab;
