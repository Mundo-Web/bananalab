import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Filter,
    Search,
    Tag,
} from "lucide-react";
import ItemsRest from "../../../Actions/ItemsRest";
import { Loading } from "../Components/Resources/Loading";
import { NoResults } from "../Components/Resources/NoResult";
import SelectForm from "./Components/SelectForm";
import CardProductBananaLab from "../Products/Components/CardProductBananaLab";

const itemsRest = new ItemsRest();
const SkeletonCard = () => {
    return (
        <div
            className={`group font-paragraph animate-pulse w-full transition-transform duration-300 hover:scale-105  sm:w-1/3 flex-shrink-0 font-paragraph customtext-primary cursor-pointer`}
        >
            <div className=" px-4">
                <div className="bg-white rounded-3xl">
                    {/* Imagen del producto y etiqueta de descuento */}
                    <div className="relative">
                        <div className="aspect-square bg-gray-300 rounded-3xl overflow-hidden flex items-center justify-center  bg-secondary">
                            <svg
                                class="w-10 h-10 text-gray-200 "
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 20 18"
                            >
                                <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
const FilterBananaLab = ({
    items,
    data,
    filteredData,
    cart,
    setCart,
    setFavorites,
    favorites,
    collections,
    campaigns,
}) => {
    const { brands } = filteredData;
    const [subcategories, setSubcategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [priceRanges, setPriceRanges] = useState([]);

    // Estados para las secciones del filtro
    const [sections, setSections] = useState({
        collection: true,
        marca: false,
        precio: true,
        categoria: true,
        subcategoria: true,
        colores: false,
    });

    // Estados para los filtros seleccionados
    const [selectedFilters, setSelectedFilters] = useState({
        collection_id: [],
        category_id: [],
        subcategory_id: [],
        brand_id: [],
        price: null,
        name: null,
        sort_by: "created_at",
        order: "desc",
    });

    const [products, setProducts] = useState([]);
    const [sortDefault, setSortDefault] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 21,
        from: 0,
        to: 0,
    });

    // Animaciones
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } },
    };

    const slideUp = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
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

    // Transformar filtros para la API
    const transformFilters = (filters) => {
        const transformedFilters = [];

        if (filters.collection_id.length > 0) {
            const collectionConditions = filters.collection_id.map((id) => [
                "collection_id",
                "=",
                id,
            ]);
            transformedFilters.push(["or", ...collectionConditions]);
        }

        if (filters.category_id.length > 0) {
            const categoryConditions = filters.category_id.map((id) => [
                "category_id",
                "=",
                id,
            ]);
            transformedFilters.push(["or", ...categoryConditions]);
        }

        if (filters.subcategory_id.length > 0) {
            const subcategoryConditions = filters.subcategory_id.map((id) => [
                "subcategory_id",
                "=",
                id,
            ]);
            transformedFilters.push(["or", ...subcategoryConditions]);
        }

        if (filters.brand_id.length > 0) {
            const brandConditions = filters.brand_id.map((id) => [
                "brand_id",
                "=",
                id,
            ]);
            transformedFilters.push(["or", ...brandConditions]);
        }

        if (filters.price) {
            transformedFilters.push([
                "or",
                [
                    ["final_price", ">=", filters.price.min],
                    "and",
                    ["final_price", "<=", filters.price.max],
                ],
            ]);
        }

        if (filters.name) {
            transformedFilters.push(["name", "contains", filters.name]);
        }

        return transformedFilters;
    };

    // Obtener productos filtrados
    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            const filters = transformFilters(selectedFilters);
            const params = {
                filter: filters,
                sort: selectedFilters.sort,
                skip: (page - 1) * pagination.itemsPerPage,
                take: pagination.itemsPerPage,
                requireTotalCount: true,
            };

            const response = await itemsRest.paginate(params);

            setProducts(response.data);
            setPagination({
                currentPage: page,
                totalPages: Math.ceil(
                    response.totalCount / pagination.itemsPerPage
                ),
                totalItems: response.totalCount,
                itemsPerPage: pagination.itemsPerPage,
                from: (page - 1) * pagination.itemsPerPage + 1,
                to: Math.min(
                    page * pagination.itemsPerPage,
                    response.totalCount
                ),
            });
            // console.log(response);
            setCategories(response?.summary.categories);
            setSubcategories(response?.summary.subcategories);
            setPriceRanges(response?.summary.priceRanges);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(pagination.currentPage);
    }, [selectedFilters]);

    // Manejar cambio de página
    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.totalPages) {
            fetchProducts(page);
        }
    };

    // Generar números de página para la paginación
    const getPageNumbers = () => {
        const pages = [];
        const total = pagination.totalPages;
        const current = pagination.currentPage;
        const delta = 2;

        for (let i = 1; i <= total; i++) {
            if (
                i === 1 ||
                i === total ||
                (i >= current - delta && i <= current + delta)
            ) {
                pages.push(i);
            } else if (i === current - delta - 1 || i === current + delta + 1) {
                pages.push("...");
            }
        }

        return pages.filter((page, index, array) => {
            return page !== "..." || array[index - 1] !== "...";
        });
    };
    // Opciones de ordenación
    const sortOptions = [
        { value: "created_at:desc", label: "Más reciente" },
        { value: "created_at:asc", label: "Mas antiguo" },
        { value: "final_price:asc", label: "Precio: Menor a Mayor" },
        { value: "final_price:desc", label: "Precio: Mayor a Menor" },
        { value: "name:asc", label: "Nombre: A-Z" },
        { value: "name:desc", label: "Nombre: Z-A" },
    ];
    // Inicializar filtros desde URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const categoriaParam = params.get("category");
        const collectionParam = params.get("collection");
        const searchParam = params.get("search");
        const campaignParam = params.get("campaign");
        const sortParam = params.get("sort");

        if (categoriaParam) {
            const category = categories.find(
                (item) => item.slug === categoriaParam
            );
            if (category) {
                setSelectedFilters((prev) => ({
                    ...prev,
                    category_id: [category.id],
                }));
            }
        }

        if (collectionParam) {
            const collection = collections.find(
                (item) => item.slug === collectionParam
            );
            if (collection) {
                setSelectedFilters((prev) => ({
                    ...prev,
                    collection_id: [collection.id],
                }));
            }
        }
        if (campaignParam) {
            const campaign = campaigns.find(
                (item) => item.slug === campaignParam
            );
            setProducts(campaign.items);
        }

        if (searchParam) {
            setSelectedFilters((prev) => ({
                ...prev,
                name: searchParam,
            }));
        }

        if (sortParam === "novedades") {
            setSelectedFilters((prev) => ({
                ...prev,
                sort_by: "created_at",
                order: "desc",
            }));

            setSortDefault(sortOptions[0]);
        }
    }, [items]);

    // Manejar cambios en los filtros
    const handleFilterChange = (type, value) => {
        setSelectedFilters((prev) => {
            if (type === "price") {
                return {
                    ...prev,
                    price:
                        prev.price &&
                        prev.price.min === value.min &&
                        prev.price.max === value.max
                            ? null
                            : value,
                };
            }

            const currentValues = Array.isArray(prev[type]) ? prev[type] : [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter((item) => item !== value)
                : [...currentValues, value];

            return { ...prev, [type]: newValues };
        });
    };

    // Alternar secciones de filtros
    const toggleSection = (section) => {
        setSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Estados para búsqueda en filtros
    const [searchCategory, setSearchCategory] = useState("");
    const [searchSubcategory, setSearchSubcategory] = useState("");
    const [searchCollection, setSearchCollection] = useState("");
    const [searchBrand, setSearchBrand] = useState("");

    const filteredCollections = collections.filter((collection) =>
        collection.name.toLowerCase().includes(searchCollection.toLowerCase())
    );
    // Filtrar categorías según búsqueda
    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchCategory.toLowerCase())
    );
    // Filtrar subcategorías según búsqueda
    const filteredSubcategories = subcategories.filter((subcategory) =>
        subcategory.name.toLowerCase().includes(searchSubcategory.toLowerCase())
    );

    // Filtrar marcas según búsqueda
    const filteredBrands = brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchBrand.toLowerCase())
    );

    return (
        <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="py-6 customtext-neutral-dark font-paragraph"
        >
            <div className="mx-auto px-primary">
                <div className="relative flex flex-col sm:flex-row gap-8">
                    {/* Panel de filtros */}
                    <motion.div
                        className="w-full sm:w-1/5  bg-white py-4 rounded-lg h-max shadow-sm"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <p className="customtext-neutral-dark text-2xl font-bold pb-4 mb-4 border-b">
                            Escoge el regalo y personaliza
                        </p>
                        {/* Sección de Collecciones */}
                        <motion.div className="mb-6" variants={slideUp}>
                            <motion.button
                                onClick={() => toggleSection("collection")}
                                className="flex items-center justify-between w-full mb-4"
                                whileHover={{ x: 3 }}
                            >
                                <span className="font-medium">Colleciones</span>
                                <ChevronDown
                                    className={`h-5 w-5 transform transition-transform ${
                                        sections.collection ? "" : "-rotate-180"
                                    }`}
                                />
                            </motion.button>

                            <AnimatePresence>
                                {sections.collection && (
                                    <motion.div
                                        className="space-y-1"
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        variants={{
                                            hidden: { opacity: 0, height: 0 },
                                            visible: {
                                                opacity: 1,
                                                height: "auto",
                                                transition: {
                                                    staggerChildren: 0.1,
                                                },
                                            },
                                        }}
                                    >
                                        <motion.div
                                            className="relative"
                                            variants={slideUp}
                                        >
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar"
                                                className="w-full px-4 pl-10 py-3 border customtext-neutral-dark border-neutral-ligth rounded-xl focus:ring-0 focus:outline-0 transition-all duration-300"
                                                value={searchCollection}
                                                onChange={(e) =>
                                                    setSearchCollection(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </motion.div>

                                        {filteredCollections.map(
                                            (collection) => {
                                                const isChecked =
                                                    selectedFilters.collection_id?.includes(
                                                        collection.id
                                                    );
                                                return (
                                                    <motion.div
                                                        key={collection.id}
                                                        className={`group py-2 rounded-md ${
                                                            isChecked
                                                                ? "bg-primary brightness-125"
                                                                : "bg-transparent"
                                                        }`}
                                                        variants={slideUp}
                                                    >
                                                        <label className="flex items-center justify-between space-x-3 px-4 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "collection_id",
                                                                        collection.id
                                                                    )
                                                                }
                                                                checked={
                                                                    isChecked
                                                                }
                                                            />
                                                            <img
                                                                src={`/storage/images/collection/${collection.image}`}
                                                                onError={(e) =>
                                                                    (e.target.src =
                                                                        "assets/img/noimage/no_imagen_circular.png")
                                                                }
                                                                alt={
                                                                    collection.name
                                                                }
                                                                className="w-8 h-8 rounded-full object-cover order-1"
                                                                loading="lazy"
                                                            />
                                                            <span
                                                                className={`${
                                                                    isChecked
                                                                        ? "text-white"
                                                                        : "text-gray-700"
                                                                }`}
                                                            >
                                                                {
                                                                    collection.name
                                                                }
                                                            </span>
                                                        </label>
                                                    </motion.div>
                                                );
                                            }
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                        {/* Sección de Categorías */}
                        <motion.div className="mb-6" variants={slideUp}>
                            <motion.button
                                onClick={() => toggleSection("categoria")}
                                className="flex items-center justify-between w-full mb-4"
                                whileHover={{ x: 3 }}
                            >
                                <span className="font-medium">Categorías</span>
                                <ChevronDown
                                    className={`h-5 w-5 transform transition-transform ${
                                        sections.categoria ? "" : "-rotate-180"
                                    }`}
                                />
                            </motion.button>

                            <AnimatePresence>
                                {sections.categoria && (
                                    <motion.div
                                        className="space-y-1"
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        variants={{
                                            hidden: {
                                                opacity: 0,
                                                height: 0,
                                            },
                                            visible: {
                                                opacity: 1,
                                                height: "auto",
                                                transition: {
                                                    staggerChildren: 0.1,
                                                },
                                            },
                                        }}
                                    >
                                        <motion.div
                                            className="relative"
                                            variants={slideUp}
                                        >
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar"
                                                className="w-full px-4 pl-10 py-3 border customtext-neutral-dark border-neutral-ligth rounded-xl focus:ring-0 focus:outline-0 transition-all duration-300"
                                                value={searchCategory}
                                                onChange={(e) =>
                                                    setSearchCategory(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </motion.div>

                                        {filteredCategories.map((category) => {
                                            const isChecked =
                                                selectedFilters.category_id?.includes(
                                                    category.id
                                                );
                                            return (
                                                <motion.div
                                                    key={category.id}
                                                    className={`group py-2 rounded-md ${
                                                        isChecked
                                                            ? "bg-primary brightness-125"
                                                            : "bg-transparent"
                                                    }`}
                                                    variants={slideUp}
                                                >
                                                    <label className="flex items-center justify-between space-x-3 px-4 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            onChange={() =>
                                                                handleFilterChange(
                                                                    "category_id",
                                                                    category.id
                                                                )
                                                            }
                                                            checked={isChecked}
                                                        />
                                                        <img
                                                            src={`/storage/images/category/${category.image}`}
                                                            onError={(e) =>
                                                                (e.target.src =
                                                                    "assets/img/noimage/no_imagen_circular.png")
                                                            }
                                                            alt={category.name}
                                                            className="w-8 h-8 rounded-full object-cover order-1"
                                                            loading="lazy"
                                                        />
                                                        <span
                                                            className={`${
                                                                isChecked
                                                                    ? "text-white"
                                                                    : "text-gray-700"
                                                            }`}
                                                        >
                                                            {category.name}
                                                        </span>
                                                    </label>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Sección de Subcategorías (solo visible si hay categoría seleccionada) */}

                        <motion.div className="mb-6" variants={slideUp}>
                            <motion.button
                                onClick={() => toggleSection("subcategoria")}
                                className="flex items-center justify-between w-full mb-4"
                                whileHover={{ x: 3 }}
                            >
                                <span className="font-medium">
                                    Sub Categorías
                                </span>
                                <ChevronDown
                                    className={`h-5 w-5 transform transition-transform ${
                                        sections.subcategoria
                                            ? ""
                                            : "-rotate-180"
                                    }`}
                                />
                            </motion.button>

                            <AnimatePresence>
                                {sections.subcategoria && (
                                    <motion.div
                                        className="space-y-1"
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        variants={{
                                            hidden: {
                                                opacity: 0,
                                                height: 0,
                                            },
                                            visible: {
                                                opacity: 1,
                                                height: "auto",
                                                transition: {
                                                    staggerChildren: 0.1,
                                                },
                                            },
                                        }}
                                    >
                                        <motion.div
                                            className="relative"
                                            variants={slideUp}
                                        >
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar"
                                                className="w-full px-4 pl-10 py-3 border customtext-neutral-dark border-neutral-ligth rounded-xl focus:ring-0 focus:outline-0 transition-all duration-300"
                                                value={searchSubcategory}
                                                onChange={(e) =>
                                                    setSearchSubcategory(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </motion.div>

                                        {filteredSubcategories.map(
                                            (subcategory) => {
                                                const isChecked =
                                                    selectedFilters.subcategory_id?.includes(
                                                        subcategory.id
                                                    );
                                                return (
                                                    <motion.div
                                                        key={subcategory.id}
                                                        className={`group py-2 rounded-md ${
                                                            isChecked
                                                                ? "bg-primary brightness-125"
                                                                : "bg-transparent"
                                                        }`}
                                                        variants={slideUp}
                                                    >
                                                        <label className="flex items-center justify-between space-x-3 px-4 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "subcategory_id",
                                                                        subcategory.id
                                                                    )
                                                                }
                                                                checked={
                                                                    isChecked
                                                                }
                                                            />
                                                            <img
                                                                src={`/storage/images/category/${subcategory.image}`}
                                                                onError={(e) =>
                                                                    (e.target.src =
                                                                        "assets/img/noimage/no_imagen_circular.png")
                                                                }
                                                                alt={
                                                                    subcategory.name
                                                                }
                                                                className="w-8 h-8 rounded-full object-cover order-1"
                                                                loading="lazy"
                                                            />
                                                            <span
                                                                className={`${
                                                                    isChecked
                                                                        ? "text-white"
                                                                        : "text-gray-700"
                                                                }`}
                                                            >
                                                                {
                                                                    subcategory.name
                                                                }
                                                            </span>
                                                        </label>
                                                    </motion.div>
                                                );
                                            }
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Sección de Precios */}
                        <motion.div className="mb-6" variants={slideUp}>
                            <motion.button
                                onClick={() => toggleSection("precio")}
                                className="flex items-center justify-between w-full mb-4"
                                whileHover={{ x: 3 }}
                            >
                                <span className="font-medium">Precio</span>
                                <ChevronDown
                                    className={`h-5 w-5 transform transition-transform ${
                                        sections.precio ? "" : "-rotate-180"
                                    }`}
                                />
                            </motion.button>

                            <AnimatePresence>
                                {sections.precio && (
                                    <motion.div
                                        className="space-y-3"
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        variants={{
                                            hidden: { opacity: 0, height: 0 },
                                            visible: {
                                                opacity: 1,
                                                height: "auto",
                                                transition: {
                                                    staggerChildren: 0.1,
                                                },
                                            },
                                        }}
                                    >
                                        {priceRanges.map((range) => {
                                            const isChecked =
                                                selectedFilters.price &&
                                                selectedFilters.price.min ===
                                                    range.min &&
                                                selectedFilters.price.max ===
                                                    range.max;

                                            return (
                                                <motion.label
                                                    key={`${range.min}-${range.max}`}
                                                    className="flex items-center space-x-3 cursor-pointer "
                                                    variants={slideUp}
                                                    whileHover={{ x: 3 }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="precio"
                                                        className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary checked:accent-primary `}
                                                        onChange={() =>
                                                            handleFilterChange(
                                                                "price",
                                                                range
                                                            )
                                                        }
                                                        checked={isChecked}
                                                    />
                                                    <span
                                                        className={`${
                                                            isChecked
                                                                ? "font-medium "
                                                                : "text-gray-600"
                                                        }`}
                                                    >
                                                        {`S/ ${range.min} - S/ ${range.max}`}
                                                    </span>
                                                </motion.label>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                        {/* Sección de Marcas */}
                        {sections.marca && (
                            <motion.div className="mb-6" variants={slideUp}>
                                <motion.button
                                    onClick={() => toggleSection("marca")}
                                    className="flex items-center justify-between w-full mb-4"
                                    whileHover={{ x: 3 }}
                                >
                                    <span className="font-medium">Marcas</span>
                                    <ChevronDown
                                        className={`h-5 w-5 transform transition-transform ${
                                            sections.marca ? "" : "-rotate-180"
                                        }`}
                                    />
                                </motion.button>

                                <AnimatePresence>
                                    {sections.marca && (
                                        <motion.div
                                            className="space-y-1"
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            variants={{
                                                hidden: {
                                                    opacity: 0,
                                                    height: 0,
                                                },
                                                visible: {
                                                    opacity: 1,
                                                    height: "auto",
                                                    transition: {
                                                        staggerChildren: 0.1,
                                                    },
                                                },
                                            }}
                                        >
                                            <motion.div
                                                className="relative"
                                                variants={slideUp}
                                            >
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar"
                                                    className="w-full px-4 pl-10 py-3 border customtext-neutral-dark border-neutral-ligth rounded-xl focus:ring-0 focus:outline-0 transition-all duration-300"
                                                    value={searchBrand}
                                                    onChange={(e) =>
                                                        setSearchBrand(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </motion.div>

                                            {filteredBrands.map((brand) => {
                                                const isChecked =
                                                    selectedFilters.brand_id?.includes(
                                                        brand.id
                                                    );
                                                return (
                                                    <motion.div
                                                        key={brand.id}
                                                        className={`group py-2 rounded-md ${
                                                            isChecked
                                                                ? "bg-primary/10"
                                                                : "bg-transparent"
                                                        }`}
                                                        variants={slideUp}
                                                    >
                                                        <label className="flex items-center space-x-3 px-4 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "brand_id",
                                                                        brand.id
                                                                    )
                                                                }
                                                                checked={
                                                                    isChecked
                                                                }
                                                            />
                                                            <span
                                                                className={`${
                                                                    isChecked
                                                                        ? "font-medium text-primary"
                                                                        : "text-gray-600"
                                                                }`}
                                                            >
                                                                {brand.name}
                                                            </span>
                                                        </label>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Contenido principal */}
                    <motion.div
                        className="w-full sm:w-4/5 py-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {/* Controles superiores */}
                        <motion.div
                            className="flex flex-col lg:flex-row lg:justify-between items-center mb-4 w-full"
                            variants={slideUp}
                        >
                            <div className="flex gap-4 items-center mb-4 lg:mb-0">
                                <label className="font-semibold text-sm w-[150px]">
                                    Ordenar por
                                </label>
                                <SelectForm
                                    defaultOption={sortDefault}
                                    options={sortOptions}
                                    placeholder="Recomendados"
                                    onChange={(value) => {
                                        const [selector, order] =
                                            value.split(":");
                                        const sort = [
                                            {
                                                selector: selector,
                                                desc: order === "desc",
                                            },
                                        ];
                                        setSelectedFilters((prev) => ({
                                            ...prev,
                                            sort,
                                        }));
                                    }}
                                    labelKey="label"
                                    valueKey="value"
                                    className="border-primary rounded-full customtext-primary "
                                />
                            </div>

                            <div className="customtext-primary font-semibold">
                                <div className="flex justify-between items-center w-full">
                                    <div className="customtext-primary font-semibold">
                                        <nav className="flex items-center gap-x-2 min-w-max">
                                            <motion.button
                                                className={`p-4 inline-flex items-center ${
                                                    pagination.currentPage === 1
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    handlePageChange(
                                                        pagination.currentPage -
                                                            1
                                                    )
                                                }
                                                disabled={
                                                    pagination.currentPage === 1
                                                }
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <ChevronLeft />
                                            </motion.button>

                                            {getPageNumbers().map(
                                                (page, index) => (
                                                    <React.Fragment key={index}>
                                                        {page === "..." ? (
                                                            <span className="w-10 h-10 bg-transparent p-2 inline-flex items-center justify-center rounded-full">
                                                                ...
                                                            </span>
                                                        ) : (
                                                            <motion.button
                                                                className={`w-10 h-10 p-2 inline-flex items-center justify-center rounded-full transition-all duration-300 
                                                                ${
                                                                    page ===
                                                                    pagination.currentPage
                                                                        ? "bg-primary text-white"
                                                                        : "bg-transparent hover:text-white hover:bg-primary"
                                                                }`}
                                                                onClick={() =>
                                                                    handlePageChange(
                                                                        page
                                                                    )
                                                                }
                                                                whileHover={{
                                                                    scale: 1.05,
                                                                }}
                                                                whileTap={{
                                                                    scale: 0.95,
                                                                }}
                                                            >
                                                                {page}
                                                            </motion.button>
                                                        )}
                                                    </React.Fragment>
                                                )
                                            )}

                                            <motion.button
                                                className={`p-4 inline-flex items-center ${
                                                    pagination.currentPage ===
                                                    pagination.totalPages
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    handlePageChange(
                                                        pagination.currentPage +
                                                            1
                                                    )
                                                }
                                                disabled={
                                                    pagination.currentPage ===
                                                    pagination.totalPages
                                                }
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <ChevronRight />
                                            </motion.button>
                                        </nav>
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            {pagination.from} - {pagination.to}{" "}
                                            de {pagination.totalItems}{" "}
                                            Resultados
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Lista de productos */}
                        {loading ? (
                            <div className="flex items-center flex-wrap gap-y-8 transition-all duration-300 ease-in-out">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                                    (index) => (
                                        <SkeletonCard key={index} />
                                    )
                                )}
                            </div>
                        ) : (
                            <motion.div
                                className="flex items-center flex-wrap gap-y-2 lg:gap-y-3 transition-all duration-300 ease-in-out"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {Array.isArray(products) &&
                                products.length > 0 ? (
                                    products.map((product, index) => (
                                        <motion.div
                                            key={product.id}
                                            custom={index}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                visible: {
                                                    opacity: 1,
                                                    y: 0,
                                                    transition: {
                                                        type: "spring",
                                                        stiffness: 100,
                                                        delay: index * 0.03,
                                                    },
                                                },
                                            }}
                                            whileHover={{ y: -5 }}
                                            className="w-full md:w-1/2 lg:w-1/3 px-2"
                                        >
                                            <CardProductBananaLab
                                                product={product}
                                                cart={cart}
                                                setCart={setCart}
                                                favorites={favorites}
                                                setFavorites={setFavorites}
                                            />
                                        </motion.div>
                                    ))
                                ) : (
                                    <NoResults />
                                )}
                            </motion.div>
                        )}

                        {/* Paginación inferior */}
                        <motion.div
                            className="flex justify-between items-center mb-4 w-full mt-8"
                            variants={slideUp}
                        >
                            <div className="customtext-primary font-semibold">
                                <nav className="flex items-center gap-x-2 min-w-max">
                                    <motion.button
                                        className={`p-4 inline-flex items-center ${
                                            pagination.currentPage === 1
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            handlePageChange(
                                                pagination.currentPage - 1
                                            )
                                        }
                                        disabled={pagination.currentPage === 1}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <ChevronLeft />
                                    </motion.button>

                                    {getPageNumbers().map((page, index) => (
                                        <React.Fragment key={index}>
                                            {page === "..." ? (
                                                <span className="w-10 h-10 bg-transparent p-2 inline-flex items-center justify-center rounded-full">
                                                    ...
                                                </span>
                                            ) : (
                                                <motion.button
                                                    className={`w-10 h-10 p-2 inline-flex items-center justify-center rounded-full transition-all duration-300 
                                                        ${
                                                            page ===
                                                            pagination.currentPage
                                                                ? "bg-primary text-white"
                                                                : "bg-transparent hover:text-white hover:bg-primary"
                                                        }`}
                                                    onClick={() =>
                                                        handlePageChange(page)
                                                    }
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {page}
                                                </motion.button>
                                            )}
                                        </React.Fragment>
                                    ))}

                                    <motion.button
                                        className={`p-4 inline-flex items-center ${
                                            pagination.currentPage ===
                                            pagination.totalPages
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            handlePageChange(
                                                pagination.currentPage + 1
                                            )
                                        }
                                        disabled={
                                            pagination.currentPage ===
                                            pagination.totalPages
                                        }
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <ChevronRight />
                                    </motion.button>
                                </nav>
                            </div>
                            <div>
                                <p className="font-semibold">
                                    {pagination.from} - {pagination.to} de{" "}
                                    {pagination.totalItems} Resultados
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
};

export default FilterBananaLab;
