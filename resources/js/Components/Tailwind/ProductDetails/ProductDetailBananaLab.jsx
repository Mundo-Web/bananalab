import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingCart,
    Store,
    Home,
    Phone,
    CircleUserRound,
    ChevronDown,
    CheckSquare,
    Plus,
    ChevronUp,
    CircleCheckIcon,
    DotIcon,
    Brush,
    Heart,
    CheckCircleIcon,
    ChevronRight,
} from "lucide-react";

import ItemsRest from "../../../Actions/ItemsRest";
import Swal from "sweetalert2";
import { Notify } from "sode-extend-react";
import ProductInfinite from "../Products/ProductInfinite";
import CartModal from "../Components/CartModal";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import ProductNavigation from "../Products/ProductNavigation";
import ProductBananaLab from "../Products/ProductBananaLab";
import { toast } from "sonner";

export default function ProductDetailBananaLab({
    item,
    data,
    setCart,
    cart,
    favorites,
    setFavorites,
    generals,
}) {
    const itemsRest = new ItemsRest();
    const phone_whatsapp = generals?.find(
        (general) => general.correlative === "phone_whatsapp"
    );

    const numeroWhatsApp = phone_whatsapp?.description; // Reemplaza con tu número
    const mensajeWhatsApp = encodeURIComponent(
        `¡Hola! Tengo dudas sobre este producto: ${item.name}`
    );
    const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeWhatsApp}`;

    const handleClickWhatsApp = () => {
        window.open(linkWhatsApp, "_blank");
    };
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState({
        url: item?.image,
        type: "main",
    });
    const [expandedSpecificationMain, setExpanded] = useState(false);

    const [quantity, setQuantity] = useState(1);
    const handleChange = (e) => {
        let value = parseInt(e.target.value, 10);
        if (isNaN(value) || value < 1) value = 1;
        if (value > 10) value = 10;
        setQuantity(value);
    };

    const [isExpanded, setIsExpanded] = useState(false);
    const [associatedItems, setAssociatedItems] = useState([]);
    const [relationsItems, setRelationsItems] = useState([]);
    const [variationsItems, setVariationsItems] = useState([]);
    const inCart = cart?.find((x) => x.id == item?.id);

    useEffect(() => {
        if (item?.id) {
            productosRelacionados(item);
            obtenerCombo(item);
            handleViewUpdate(item);
            handleVariations(item);
        }
    }, [item]);

    // Animaciones
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } },
    };

    const slideUp = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const handleViewUpdate = async (item) => {
        try {
            const request = {
                id: item?.id,
            };
            const response = await itemsRest.updateViews(request);
            if (!response) {
                return;
            }
        } catch (error) {
            return;
        }
    };

    const obtenerCombo = async (item) => {
        try {
            const request = {
                id: item?.id,
            };
            const response = await itemsRest.verifyCombo(request);
            if (!response) {
                return;
            }
            const associated = response[0].associated_items;
            setAssociatedItems(Object.values(associated));
        } catch (error) {
            return;
        }
    };

    const productosRelacionados = async (item) => {
        try {
            const request = {
                id: item?.id,
            };
            const response = await itemsRest.productsRelations(request);
            if (!response) {
                return;
            }
            const relations = response;
            setRelationsItems(Object.values(relations));
        } catch (error) {
            return;
        }
    };

    const handleVariations = async (item) => {
        try {
            const request = {
                slug: item?.slug,
            };
            const response = await itemsRest.getVariations(request);
            if (!response) {
                return;
            }
            const variations = response;
            setVariationsItems(variations.variants);
        } catch (error) {
            return;
        }
    };

    const total = associatedItems.reduce(
        (sum, product) => sum + parseFloat(product.final_price),
        0
    );

    const addAssociatedItems = () => {
        setCart((prevCart) => {
            const newCart = structuredClone(prevCart);
            [...associatedItems, item].forEach((product) => {
                const index = newCart.findIndex((x) => x.id === product.id);
                if (index === -1) {
                    newCart.push({ ...product, quantity: quantity });
                } else {
                    newCart[index].quantity++;
                }
            });
            return newCart;
        });
        Notify.add({
            icon: "/assets/img/icon.svg",
            title: "Carrito de Compras",
            body: "Se agregaron con éxito los productos",
        });
    };

    const onAddClicked = (product) => {
        const newCart = structuredClone(cart);
        const index = newCart.findIndex((x) => x.id == product.id);
        if (index == -1) {
            newCart.push({ ...product, quantity: quantity });
        } else {
            newCart[index].quantity++;
        }
        setCart(newCart);

        Swal.fire({
            title: "Producto agregado",
            text: `Se agregó ${product.name} al carrito`,
            icon: "success",
            timer: 1500,
        });
    };

    const isFavorite = favorites.some((x) => x.id === item.id);

    const onAddFavoritesClicked = (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        const newFavorites = structuredClone(favorites);
        const index = newFavorites.findIndex((x) => x.id == product.id);

        if (index == -1) {
            newFavorites.push({ ...product, quantity: 1 });
            toast.success("Producto agregado", {
                description: `${product.name} se ha añadido a los favoritos.`,
                icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
                duration: 3000,
                position: "bottom-center",
            });
        } else {
            newFavorites.splice(index, 1);
            toast.info("Producto removido", {
                description: `${product.name} se ha quitado de los favoritos.`,
                icon: <CheckCircleIcon className="h-5 w-5 text-blue-500" />,
                duration: 3000,
                position: "bottom-center",
            });
        }

        setFavorites(newFavorites);
    };
    console.log(item);
    return (
        <>
            <div className="bg-sections-color py-2 text-sm">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className=" px-primary 2xl:max-w-7xl 2xl:px-0 mx-auto text-sm font-semibold font-paragraph flex items-center customtext-neutral-dark"
                >
                    {item?.collection?.name && (
                        <a
                            href={`/catalogo?collection=${item?.collection?.slug}`}
                            className="flex gap-2 items-center customtext-primary cursor-pointer"
                        >
                            {item?.collection?.name}{" "}
                            <ChevronRight strokeWidth={1.5} />
                        </a>
                    )}

                    {item?.category?.name && (
                        <a
                            href={`/catalogo?category=${item?.category.slug}`}
                            className="flex gap-2 items-center customtext-primary cursor-pointer"
                        >
                            {item?.category?.name}{" "}
                            <ChevronRight strokeWidth={1.5} />
                        </a>
                    )}
                    {item?.subcategory?.name && (
                        <a
                            href={`/catalogo?subcategory=${item?.subcategory.slug}`}
                            className="flex gap-2 items-center customtext-primary cursor-pointer"
                        >
                            {item?.subcategory?.name}{" "}
                            <ChevronRight subcategory={1.5} />
                        </a>
                    )}
                    {item?.name}
                </motion.div>
            </div>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className=" px-primary 2xl:max-w-7xl 2xl:px-0 mx-auto py-4 md:py-6 xl:py-8 bg-white font-paragraph"
            >
                <motion.div variants={slideUp} className="bg-white rounded-xl ">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-20 2xl:gap-32">
                        {/* Left Column - Images and Delivery Options */}
                        <div className="space-y-6">
                            {/* Product Images */}
                            <motion.div
                                variants={staggerContainer}
                                className="flex flex-col gap-6"
                            >
                                {/* Main Image */}
                                <motion.div
                                    variants={slideUp}
                                    className="flex-1"
                                >
                                    <motion.img
                                        src={
                                            selectedImage.type === "main"
                                                ? `/storage/images/item/${selectedImage.url}`
                                                : `/storage/images/item/${selectedImage.url}`
                                        }
                                        onError={(e) =>
                                            (e.target.src =
                                                "/api/cover/thumbnail/null")
                                        }
                                        alt="Product main"
                                        className="w-full object-cover aspect-square rounded-3xl"
                                        whileHover={{ scale: 1.02 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 10,
                                        }}
                                    />
                                </motion.div>

                                {/* Thumbnails */}
                                <motion.div
                                    variants={slideUp}
                                    className="flex flex-row gap-2 items-center"
                                >
                                    <motion.button
                                        onClick={() =>
                                            setSelectedImage({
                                                url: item?.image,
                                                type: "main",
                                            })
                                        }
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`w-16 h-16  rounded-xl object-cover overflow-hidden ${
                                            selectedImage.url === item?.image
                                                ? "shadow-2xl w-20 h-20"
                                                : "shadow"
                                        }`}
                                    >
                                        <img
                                            src={`/storage/images/item/${item?.image}`}
                                            alt="Main Thumbnail"
                                            className="w-full h-full object-cover"
                                            onError={(e) =>
                                                (e.target.src =
                                                    "/api/cover/thumbnail/null")
                                            }
                                        />
                                    </motion.button>
                                    {item?.images.map((image, index) => (
                                        <motion.button
                                            key={index}
                                            onClick={() =>
                                                setSelectedImage({
                                                    url: image.url,
                                                    type: "gallery",
                                                })
                                            }
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`w-16 h-16  rounded-xl object-cover overflow-hidden ${
                                                selectedImage.url === image.url
                                                    ? "shadow-2xl w-20 h-20"
                                                    : "shadow"
                                            }`}
                                        >
                                            <img
                                                src={
                                                    `/storage/images/item/${image.url}` ||
                                                    "/api/cover/thumbnail/null"
                                                }
                                                alt={`Thumbnail ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) =>
                                                    (e.target.src =
                                                        "/api/cover/thumbnail/null")
                                                }
                                            />
                                        </motion.button>
                                    ))}
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Right Column - Product Info */}
                        <motion.div
                            variants={staggerContainer}
                            className="flex flex-col gap-2"
                        >
                            {/* Brand and Title */}
                            <motion.div
                                variants={slideUp}
                                className="font-font-general"
                            >
                                <motion.h1
                                    className="customtext-neutral-dark text-3xl lg:text-4xl 2xl:text-5xl font-bold mt-2"
                                    whileHover={{ x: 5 }}
                                >
                                    {item?.name}
                                </motion.h1>
                            </motion.div>

                            {/* SKU and Availability */}
                            <motion.div
                                variants={slideUp}
                                className="flex flex-wrap customtext-neutral-light items-center gap-y-2 gap-x-8 text-sm font-font-general"
                            >
                                <span className="customtext-neutral-light text-sm 2xl:text-base">
                                    SKU:{" "}
                                    <span className="customtext-neutral-dark font-bold">
                                        {item?.sku}
                                    </span>
                                </span>
                                <span className="customtext-neutral-light text-sm 2xl:text-base">
                                    Disponibilidad:{" "}
                                    <span className="customtext-neutral-dark font-bold">
                                        {item?.stock > 0
                                            ? "En stock"
                                            : "Agotado"}
                                    </span>
                                </span>
                            </motion.div>

                            {/* Price Section */}
                            <motion.div
                                variants={slideUp}
                                className="flex flex-col w-full xl:w-1/2 !font-font-general max-w-xl mt-5"
                            >
                                <p className="text-sm 2xl:text-base customtext-neutral-light">
                                    Precio:{" "}
                                    <span className="line-through">
                                        S/ {item?.price}
                                    </span>
                                </p>
                                <div className="flex flex-row items-center gap-4 relative">
                                    <motion.span
                                        className="text-[40px] font-bold customtext-neutral-dark"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        S/ {item?.final_price}
                                    </motion.span>
                                    <motion.span
                                        className="bg-[#F93232] text-white font-bold px-3 py-2 rounded-xl text-base"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        -
                                        {Number(item?.discount_percent).toFixed(
                                            1
                                        )}
                                        %
                                    </motion.span>
                                </div>
                            </motion.div>

                            {/* Specifications */}
                            <div className="block  flex-1 w-full ">
                                <div className="bg-sections-color rounded-lg p-6">
                                    <ul
                                        className={`space-y-2  customtext-neutral-light mb-4 transition-all duration-300 ${
                                            expandedSpecificationMain
                                                ? "max-h-full"
                                                : "max-h-24 overflow-hidden"
                                        }`}
                                        style={{ listStyleType: "disc" }}
                                    >
                                        {item?.specifications.map(
                                            (spec, index) =>
                                                spec.type === "principal" && (
                                                    <li
                                                        key={index}
                                                        className="flex gap-2"
                                                    >
                                                        <CircleCheckIcon className="customtext-primary" />
                                                        <span className="font-semibold">
                                                            {spec.title} :
                                                        </span>
                                                        {spec.description}
                                                    </li>
                                                )
                                        )}
                                    </ul>
                                    <button
                                        className="customtext-primary text-sm font-semibold hover:underline flex items-center gap-1 transition-all duration-300"
                                        onClick={() =>
                                            setExpanded(
                                                !expandedSpecificationMain
                                            )
                                        }
                                    >
                                        {expandedSpecificationMain
                                            ? "Ver menos"
                                            : "Ver más especificaciones"}
                                        {expandedSpecificationMain ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Selector de variantes */}
                            <motion.div
                                variants={slideUp}
                                className="variants-selector flex flex-col gap-3"
                            >
                                <h3 className="w-full block opacity-85 customtext-neutral-dark text-sm 2xl:text-base">
                                    Colores
                                </h3>

                                <div className="flex gap-3 items-center justify-start w-full flex-wrap">
                                    {/* Variante actual (principal) */}
                                    <Tippy content={item.color}>
                                        <motion.a
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className={`variant-option rounded-full object-fit-cover ${
                                                !variationsItems.some(
                                                    (v) => v.slug === item.slug
                                                )
                                                    ? "active p-[2px] border-2 border-primary"
                                                    : ""
                                            }`}
                                        >
                                            <img
                                                className="color-box rounded-full h-9 w-9 object-cover"
                                                src={`/storage/images/item/${item.texture}`}
                                                onError={(e) =>
                                                    (e.target.src =
                                                        "/api/cover/thumbnail/null")
                                                }
                                            />
                                        </motion.a>
                                    </Tippy>
                                    {/* Otras variantes */}
                                    {variationsItems.map((variant) => (
                                        <Tippy
                                            content={variant.color}
                                            key={variant.slug}
                                        >
                                            <motion.a
                                                href={`/product/${variant.slug}`}
                                                className="variant-option rounded-full object-fit-cover"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <img
                                                    className="color-box rounded-full h-9 w-9 object-fit-cover"
                                                    src={`/storage/images/item/${variant.texture}`}
                                                />
                                            </motion.a>
                                        </Tippy>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Quantity 
                            <motion.div
                                variants={slideUp}
                                className="flex flex-col mt-8"
                            >
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="flex items-center space-x-4 customtext-neutral-light text-sm 2xl:text-base">
                                        <span className="opacity-85">
                                            Cantidad
                                        </span>
                                        <motion.div
                                            className="relative flex items-center border rounded-md px-2 py-1"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={handleChange}
                                                min="1"
                                                max="10"
                                                className="w-10 py-1 customtext-neutral-dark text-center bg-transparent outline-none appearance-none"
                                            />
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>*/}

                            {/* Add to Cart */}
                            <motion.div
                                variants={slideUp}
                                className="flex flex-col mt-4"
                            >
                                <motion.a
                                    href="/canva1"
                                    className="w-full flex gap-4 items-center justify-center font-paragraph text-base 2xl:text-lg bg-primary text-white py-3 font-semibold rounded-3xl hover:opacity-90 transition-all duration-300 mt-3"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Crea y edita tu regalo
                                    <Brush width={20} />
                                </motion.a>
                                <motion.button
                                    onClick={(e) =>
                                        onAddFavoritesClicked(e, item)
                                    }
                                    className="w-full flex gap-4 items-center fill-primary justify-center font-paragraph text-base 2xl:text-lg bg-white border-2 border-primary customtext-primary py-3 font-semibold rounded-3xl hover:opacity-90 transition-all duration-300 mt-3"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Lista de deseos
                                    {isFavorite ? (
                                        <Heart
                                            width={18}
                                            strokeWidth={3}
                                            fill="current"
                                        />
                                    ) : (
                                        <Heart width={18} strokeWidth={1.5} />
                                    )}
                                </motion.button>
                            </motion.div>

                            {/* Whatsapp */}
                            <motion.div
                                variants={slideUp}
                                className="w-full mt-5"
                            >
                                <motion.div
                                    className="bg-[#F7F9FB] flex flex-row rounded-xl p-5 gap-3"
                                    whileHover={{ y: -2 }}
                                >
                                    <img
                                        src="/assets/img/salafabulosa/whatsapp.png"
                                        onError={(e) =>
                                            (e.target.src =
                                                "assets/img/noimage/no_imagen_circular.png")
                                        }
                                        className="w-12 h-12 object-contain"
                                        loading="lazy"
                                    />
                                    <div className="customtext-neutral-dark cursor-pointer font-font-general text-base 2xl:text-xl font-semibold">
                                        <p>
                                            ¿Tienes dudas sobre este producto?
                                            Haz{" "}
                                            <a
                                                className="underline"
                                                onClick={handleClickWhatsApp}
                                            >
                                                clic aquí
                                            </a>{" "}
                                            y chatea con nosotros por WhatsApp
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    variants={slideUp}
                    className="grid gap-10 lg:gap-20 md:grid-cols-2 bg-white rounded-xl py-8 font-font-general"
                >
                    {/* Specifications Section */}
                    {item?.specifications?.length > 0 && (
                        <motion.div variants={slideUp}>
                            <h2 className="text-2xl font-bold customtext-neutral-dark mb-4 border-b pb-3">
                                Especificaciones
                            </h2>
                            <div className="space-y-1">
                                {item.specifications.map(
                                    (spec, index) =>
                                        spec.type === "general" && (
                                            <motion.div
                                                key={index}
                                                className={`grid grid-cols-2 gap-4 p-4 ${
                                                    index % 2 === 0
                                                        ? "bg-sections-color"
                                                        : "bg-white"
                                                }`}
                                                whileHover={{ x: 5 }}
                                            >
                                                <div className="customtext-neutral-light opacity-85">
                                                    {spec.title}
                                                </div>
                                                <div className="customtext-neutral-dark">
                                                    {spec.description}
                                                </div>
                                            </motion.div>
                                        )
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Additional Information Section */}
                    <motion.div
                        variants={slideUp}
                        className="font-font-general"
                    >
                        {item?.description?.replace(/<[^>]+>/g, "") && (
                            <h2 className="text-2xl font-bold customtext-neutral-dark mb-4 border-b pb-3">
                                Información adicional
                            </h2>
                        )}

                        <motion.div
                            className={`space-y-2 ${
                                !isExpanded
                                    ? "max-h-[400px] overflow-hidden"
                                    : ""
                            }`}
                        >
                            {item?.description?.replace(/<[^>]+>/g, "") && (
                                <>
                                    <h3 className="text-xl font-semibold customtext-neutral-dark mb-4">
                                        Acerca de este artículo
                                    </h3>
                                    <motion.div
                                        className="customtext-neutral-dark"
                                        dangerouslySetInnerHTML={{
                                            __html: item?.description,
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                    ></motion.div>
                                </>
                            )}

                            {item?.features?.length > 0 && (
                                <motion.div
                                    className="pl-10"
                                    variants={staggerContainer}
                                >
                                    <ul className="list-disc pl-5 space-y-2">
                                        {item?.features.map(
                                            (feature, index) => (
                                                <motion.li
                                                    key={index}
                                                    className="customtext-neutral-dark"
                                                    variants={slideUp}
                                                >
                                                    {feature.feature}
                                                </motion.li>
                                            )
                                        )}
                                    </ul>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                </motion.div>

                <CartModal
                    cart={cart}
                    setCart={setCart}
                    modalOpen={modalOpen}
                    setModalOpen={setModalOpen}
                />
            </motion.div>
            {/* Productos relacionados */}
            {relationsItems.length > 0 && (
                <motion.div
                    className="my-10"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <ProductBananaLab
                        data={{
                            title: "Productos relacionados",
                            link_catalog: "/catalogo",
                        }}
                        items={relationsItems}
                        cart={cart}
                        setCart={setCart}
                        favorites={favorites}
                        setFavorites={setFavorites}
                    />
                </motion.div>
            )}
        </>
    );
}
