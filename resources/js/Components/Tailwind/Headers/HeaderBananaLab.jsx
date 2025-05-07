import {
    Menu,
    X,
    Search,
    User,
    Heart,
    ShoppingCart,
    UserRound,
    UserCircle,
    DoorClosed,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Global from "../../../Utils/Global";
import CartModal from "../Components/CartModal";
import AuthRest from "../../../Actions/AuthRest";
import Logout from "../../../Actions/Logout";
import CartModalBananaLab from "../Components/CartModalBananaLab";
import FavoritesModalBananaLab from "../Components/FavoritesModalBananaLab";

const HeaderBananaLab = ({
    items,
    data,
    cart,
    setCart,
    favorites,
    setFavorites,

    isUser,
    pages,
    generals = [],
}) => {
    const menuItems = [
        { name: "Inicio", href: "/" },
        { name: "Productos", href: "/catalog" },
        { name: "Colecciones", href: "/collections" },
        { name: "Nosotros", href: "/about" },
        { name: "Contacto", href: "/contact" },
    ];

    const phoneWhatsappObj = generals.find(
        (item) => item.correlative === "phone_whatsapp"
    );
    const messageWhatsappObj = generals.find(
        (item) => item.correlative === "message_whatsapp"
    );

    const phoneWhatsapp = phoneWhatsappObj
        ? phoneWhatsappObj.description
        : null;
    const messageWhatsapp = messageWhatsappObj
        ? messageWhatsappObj.description
        : null;

    const [modalOpen, setModalOpen] = useState(false);
    const [modalOpenFavorites, setModalOpenFavorites] = useState(false);
    const [openMenu, setOpenMenu] = useState(false);
    const [searchMobile, setSearchMobile] = useState(false);
    const totalCount = cart.reduce((acc, item) => {
        return Number(acc) + Number(item.quantity);
    }, 0);
    const totalPrice = cart.reduce((acc, item) => {
        const finalPrice = item.discount ? item.discount : item.price;
        return acc + Number(item.quantity) * finalPrice;
    }, 0);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const userMenuRef = useRef(null);

    const totalCountFavorites = favorites.reduce((acc, item) => {
        return Number(acc) + Number(item.quantity);
    }, 0);

    // Cerrar menús al hacer click fuera
    useEffect(() => {
        function handleClickOutside(event) {
            // Menú principal mobile
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenu(false);
            }

            // Menú de usuario
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target)
            ) {
                setIsMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const [search, setSearch] = useState("");

    return (
        <motion.nav
            className="bg-[#F8F9FA] shadow-md fonts-paragraph "
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            {/* Desktop HeaderBananaLab */}
            <div className="px-primary mx-auto py-2 font-paragraph relative 2xl:px-0 2xl:max-w-7xl">
                <div className="flex items-center justify-between h-20 lg:h-16">
                    {/* Mobile menu button */}
                    <div className="flex md:hidden">
                        <motion.button
                            onClick={() => setOpenMenu(!openMenu)}
                            className="inline-flex items-center justify-center py-2 rounded-md customtext-neutral-light hover:customtext-primary transition-colors duration-200"
                            whileTap={{ scale: 0.9 }}
                        >
                            {openMenu ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </motion.button>
                    </div>

                    {/* Logo */}
                    <motion.a
                        href="/"
                        className="flex-shrink-0"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <img
                            className="h-8 w-auto"
                            src={`/assets/resources/logo.png?v=${crypto.randomUUID()}`}
                            alt={Global.APP_NAME}
                            onError={(e) =>
                                (e.target.src = "/api/thumbnail/null")
                            }
                        />
                    </motion.a>

                    {/* Mobile menu button */}
                    <div className="-mr-2 flex md:hidden">
                        <motion.button
                            className="inline-flex items-center justify-center p-2 rounded-md customtext-neutral-light hover:customtext-primary transition-colors duration-200"
                            whileTap={{ scale: 0.9 }}
                        >
                            <Search className="h-6 w-6" />
                        </motion.button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <motion.div
                                className="relative w-[450px] mx-auto"
                                whileHover={{ scale: 1.01 }}
                            >
                                <input
                                    type="search"
                                    placeholder="Buscar productos"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pr-14 py-3 pl-4 border-0 rounded-full focus:ring-0 focus:outline-none ring-0 bg-sections-color"
                                />
                                <a
                                    href={
                                        search.trim()
                                            ? `/catalogo?search=${encodeURIComponent(
                                                  search
                                              )}`
                                            : "#"
                                    }
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 customtext-neutral-dark rounded-lg"
                                    aria-label="Buscar"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Search />
                                </a>
                            </motion.div>
                        </div>
                    </div>

                    {/* Desktop Right Icons */}
                    <div className="hidden md:flex items-center space-x-4">
                        <div className="relative" ref={userMenuRef}>
                            {isUser ? (
                                <motion.button
                                    className="customtext-neutral-light flex gap-2 hover:customtext-primary transition-colors duration-200"
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <UserCircle className="customtext-primary" />
                                    <span className="hidden md:inline">
                                        {isUser.name}
                                    </span>
                                </motion.button>
                            ) : (
                                <motion.a
                                    href="/iniciar-sesion"
                                    className="customtext-neutral-light hover:customtext-primary transition-colors duration-200"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <UserCircle className="h-5 w-5" />
                                </motion.a>
                            )}

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.div
                                        className="absolute z-50 right-0 mt-2 bg-white shadow-xl rounded-xl w-48"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="p-2">
                                            <ul className="space-y-2">
                                                <motion.li
                                                    whileHover={{ x: 3 }}
                                                >
                                                    <a
                                                        href="/mi-cuenta"
                                                        className="flex items-center gap-2 px-3 py-2 customtext-neutral-dark text-sm hover:customtext-primary transition-colors duration-300 cursor-pointer"
                                                    >
                                                        <UserCircle
                                                            className="customtext-primary"
                                                            height="1rem"
                                                        />
                                                        <span>Mi cuenta</span>
                                                    </a>
                                                </motion.li>
                                                <motion.li
                                                    whileHover={{ x: 3 }}
                                                >
                                                    <button
                                                        onClick={Logout}
                                                        className="w-full flex items-center gap-2 px-3 py-2 customtext-neutral-dark text-sm hover:customtext-primary transition-colors duration-300 cursor-pointer"
                                                    >
                                                        <DoorClosed
                                                            className="customtext-primary"
                                                            height="1rem"
                                                        />
                                                        <span>
                                                            Cerrar sesión
                                                        </span>
                                                    </button>
                                                </motion.li>
                                            </ul>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button
                            onClick={() => setModalOpenFavorites(true)}
                            className="relative customtext-neutral-light hover:customtext-primary transition-colors duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Heart className="h-5 w-5" />
                            <motion.span
                                className="h-3 w-3 bg-secondary absolute -top-1 -right-2 text-[10px] flex items-center justify-center text-white rounded-full"
                                animate={
                                    totalCountFavorites > 0
                                        ? { scale: [1, 1.2, 1] }
                                        : {}
                                }
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                {totalCountFavorites}
                            </motion.span>
                        </motion.button>

                        <motion.button
                            onClick={() => setModalOpen(true)}
                            className="relative customtext-neutral-light hover:customtext-primary transition-colors duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ShoppingCart className="h-5 w-5" />
                            <motion.span
                                className="h-3 w-3 bg-secondary absolute -top-1 -right-2 text-[10px] flex items-center justify-center text-white rounded-full"
                                animate={
                                    totalCount > 0 ? { scale: [1, 1.2, 1] } : {}
                                }
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                {totalCount}
                            </motion.span>
                        </motion.button>

                        <div className="hidden md:block ml-2 text-left">
                            <p className="text-xs font-medium">Tu carrito</p>
                            <p className="text-sm font-bold">
                                S/ {totalPrice.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <motion.div
                className={`md:hidden ${openMenu ? "block" : "hidden"}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{
                    opacity: openMenu ? 1 : 0,
                    height: openMenu ? "auto" : 0,
                }}
                transition={{ duration: 0.2 }}
                ref={menuRef}
            >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#F8F9FA]">
                    {menuItems.map((item, index) => (
                        <motion.a
                            key={item.name}
                            href={item.href}
                            className="fonts-paragraph customtext-neutral-dark hover:customtext-primaryy block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            {item.name}
                        </motion.a>
                    ))}
                    <div className="flex items-center space-x-4 px-3 py-2">
                        <motion.button
                            className="customtext-neutral-light hover:customtext-primary transition-colors duration-200"
                            whileTap={{ scale: 0.9 }}
                        >
                            <Search className="h-5 w-5" />
                        </motion.button>

                        <div className="relative" ref={userMenuRef}>
                            {isUser ? (
                                <motion.button
                                    className="customtext-neutral-light hover:customtext-primary transition-colors duration-200"
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <UserCircle className="customtext-primary" />
                                </motion.button>
                            ) : (
                                <motion.a
                                    href="/iniciar-sesion"
                                    className="customtext-neutral-light hover:customtext-primary transition-colors duration-200"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <User className="h-5 w-5" />
                                </motion.a>
                            )}

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.div
                                        className="fixed z-[9999] right-4 mt-2 bg-white shadow-xl rounded-xl w-48"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <div className="p-2">
                                            <ul className="space-y-2">
                                                <motion.li
                                                    whileHover={{ x: 3 }}
                                                >
                                                    <a
                                                        href="/mi-cuenta"
                                                        className="flex items-center gap-2 px-3 py-2 customtext-neutral-dark text-sm hover:customtext-primary transition-colors duration-300 cursor-pointer"
                                                    >
                                                        <User
                                                            className="customtext-primary"
                                                            height="1rem"
                                                        />
                                                        <span>Mi cuenta</span>
                                                    </a>
                                                </motion.li>
                                                <motion.li
                                                    whileHover={{ x: 3 }}
                                                >
                                                    <button
                                                        onClick={Logout}
                                                        className="w-full flex items-center gap-2 px-3 py-2 customtext-neutral-dark text-sm hover:customtext-primary transition-colors duration-300 cursor-pointer"
                                                    >
                                                        <DoorClosed
                                                            className="customtext-primary"
                                                            height="1rem"
                                                        />
                                                        <span>
                                                            Cerrar sesión
                                                        </span>
                                                    </button>
                                                </motion.li>
                                            </ul>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button
                            onClick={() => setModalOpenFavorites(true)}
                            className="customtext-neutral-light hover:customtext-primary transition-colors duration-200 relative"
                            whileTap={{ scale: 0.9 }}
                        >
                            <Heart className="h-5 w-5" />
                            <motion.span
                                className="h-3 w-3 bg-secondary absolute -top-1 -right-2 text-[10px] flex items-center justify-center text-white rounded-full"
                                animate={
                                    totalCountFavorites > 0
                                        ? { scale: [1, 1.2, 1] }
                                        : {}
                                }
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                {totalCountFavorites}
                            </motion.span>
                        </motion.button>

                        <motion.button
                            onClick={() => setModalOpen(true)}
                            className="customtext-neutral-light hover:customtext-primary transition-colors duration-200 relative"
                            whileTap={{ scale: 0.9 }}
                        >
                            <ShoppingCart className="h-5 w-5" />
                            <motion.span
                                className="h-3 w-3 bg-secondary absolute -top-1 -right-2 text-[10px] flex items-center justify-center text-white rounded-full"
                                animate={
                                    totalCount > 0 ? { scale: [1, 1.2, 1] } : {}
                                }
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                {totalCount}
                            </motion.span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            <CartModalBananaLab
                data={data}
                cart={cart}
                setCart={setCart}
                modalOpen={modalOpen}
                setModalOpen={setModalOpen}
            />
            <FavoritesModalBananaLab
                data={data}
                favorites={favorites}
                setFavorites={setFavorites}
                modalOpen={modalOpenFavorites}
                setModalOpen={setModalOpenFavorites}
            />
        </motion.nav>
    );
};

export default HeaderBananaLab;
