import React, { useEffect, useState } from "react";

import CardHoverBtn from "../Products/Components/CardHoverBtn";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Filter,
    Search,
    Tag,
} from "lucide-react";
import ItemsRest from "../../../Actions/ItemsRest";
import ArrayJoin from "../../../Utils/ArrayJoin";
import { Loading } from "../Components/Resources/Loading";
import { NoResults } from "../Components/Resources/NoResult";
import SelectForm from "./Components/SelectForm";
import ProductCard from "../Components/ProductCard";
import ProductCardSimple from "../Products/Components/ProductCardSimple";
import CardProductBananaLab from "../Products/Components/CardProductBananaLab";
const itemsRest = new ItemsRest();

const FilterCategoryImage = ({ items, data, filteredData, cart, setCart }) => {
    const { collections, /*categories,*/ /*brands,*/ priceRanges } =
        filteredData || {
            collections: [],
            categories: [],
            brands: [],
            priceRanges: [],
        };

    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);

    const [sections, setSections] = useState({
        collection: true,
        marca: true,
        precio: true,
        categoria: true,
        colores: false,
    });

    const [selectedFilters, setSelectedFilters] = useState({
        collection_id: [],
        category_id: [],
        brand_id: [],
        subcategory_id: [],
        price: null,
        name: null,
        sort: [{ selector: "created_at", desc: true }],
    });

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 21,
        from: 0,
        to: 0,
    });

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
            transformedFilters.push(["and", ...subcategoryConditions]);
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
                "and",
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

    // Fetch products with filters from backend
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

            if (response && response.data) {
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
                setBrands(response?.summary?.brands ?? []);
                setCategories(response?.summary?.categories ?? []);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load and when filters change
    useEffect(() => {
        fetchProducts(pagination.currentPage);
    }, [selectedFilters]);

    // Handle URL parameters on initial load
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        // Handle category from URL
        const categoryParam = params.get("category");
        if (categoryParam) {
            const category = categories.find(
                (item) => item.slug === categoryParam
            );
            if (category) {
                setSelectedFilters((prev) => ({
                    ...prev,
                    category_id: [category.id],
                }));
            }
        }

        // Handle collection from URL
        const collectionParam = params.get("collection");
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

        // Handle search from URL
        const searchParam = params.get("search");
        if (searchParam) {
            setSelectedFilters((prev) => ({
                ...prev,
                name: searchParam,
            }));
        }
    }, [categories, collections]);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.totalPages) {
            fetchProducts(page);
        }
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const total = pagination.totalPages;
        const current = pagination.currentPage;
        const delta = 2; // Number of pages to show around current page

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

        // Remove consecutive ellipses
        return pages.filter((page, index, array) => {
            return page !== "..." || array[index - 1] !== "...";
        });
    };

    // Handle filter changes
    const handleFilterChange = (type, value) => {
        setSelectedFilters((prev) => {
            if (type === "price") {
                // Toggle price filter
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

            // Handle multiple selection filters (categories, brands, collections)
            const currentValues = Array.isArray(prev[type]) ? prev[type] : [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter((item) => item !== value) // Remove if already selected
                : [...currentValues, value]; // Add if not selected

            return { ...prev, [type]: newValues };
        });
    };

    // Toggle filter sections
    const toggleSection = (section) => {
        setSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Sort options
    const sortOptions = [
        { value: "created_at:desc", label: "Más reciente" },
        { value: "created_at:asc", label: "Mas antiguo" },
        { value: "final_price:asc", label: "Precio: Menor a Mayor" },
        { value: "final_price:desc", label: "Precio: Mayor a Menor" },
        { value: "name:asc", label: "Nombre: A-Z" },
        { value: "name:desc", label: "Nombre: Z-A" },
    ];

    // Search filters
    const [searchCategory, setSearchCategory] = useState("");
    const [searchCollection, setSearchCollection] = useState("");
    const [searchBrand, setSearchBrand] = useState("");

    // Filter collections by search
    const filteredCollections = collections?.filter((collection) =>
        collection.name.toLowerCase().includes(searchCollection.toLowerCase())
    );

    // Filter categories by search
    const filteredCategories = categories?.filter((category) =>
        category.name.toLowerCase().includes(searchCategory.toLowerCase())
    );

    // Filter brands by search
    const filteredBrands = brands?.filter((brand) =>
        brand.name.toLowerCase().includes(searchBrand.toLowerCase())
    );

    // Handle sort change
    const handleSortChange = (value) => {
        const [selector, order] = value.split(":");
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
    };
    // Añadi este nuevo estado para controlar la visibilidad del filtro en móvil
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Componente del modal de filtros
    const FiltersModal = () => (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Fondo oscuro */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={() => setShowMobileFilters(false)}
            />

            {/* Contenedor del modal */}
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Panel del modal */}
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 w-full sm:align-middle sm:max-w-lg sm:w-full h-[80vh]">
                    {/* Encabezado del modal */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b sticky top-0 z-10">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold leading-6 text-gray-900">
                                Filtros
                            </h3>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                onClick={() => setShowMobileFilters(false)}
                            >
                                <span className="sr-only">Cerrar</span>✕
                            </button>
                        </div>
                    </div>

                    {/* Contenido del modal - tus filtros actuales */}
                    <div className="bg-white px-4 pt-2 pb-4 sm:p-6 sm:pb-4 overflow-y-auto h-[calc(100%-60px)]">
                        <div className="mb-6">
                            <button
                                onClick={() => toggleSection("categoria")}
                                className="flex items-center justify-between w-full mb-4"
                            >
                                <span className="font-bold">Categorias</span>
                                <ChevronDown
                                    className={`h-5 w-5 transform transition-transform ${
                                        sections.categoria ? "" : "-rotate-180"
                                    }`}
                                />
                            </button>
                            {sections.categoria && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        {filteredCategories?.map((category) => {
                                            const isChecked =
                                                selectedFilters.category_id?.includes(
                                                    category.id
                                                );
                                            return (
                                                <div
                                                    key={category.id}
                                                    className={`group py-2 rounded-md ${
                                                        isChecked
                                                            ? "bg-secondary"
                                                            : "bg-transparent"
                                                    }`}
                                                >
                                                    <label className="flex items-center justify-between cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 hidden w-4 rounded border-gray-300"
                                                            onChange={() =>
                                                                handleFilterChange(
                                                                    "category_id",
                                                                    category.id
                                                                )
                                                            }
                                                            checked={isChecked}
                                                        />
                                                        <span>
                                                            {category.name}
                                                        </span>
                                                        <img
                                                            src={`/storage/images/category/${category.image}`}
                                                            onError={(e) =>
                                                                (e.target.src =
                                                                    "assets/img/noimage/no_imagen_circular.png")
                                                            }
                                                            alt={category.name}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sección de precios */}
                        <div className="mb-6">
                            <button
                                onClick={() => toggleSection("precio")}
                                className="flex items-center justify-between w-full mb-4"
                            >
                                <span className="font-medium">Precio</span>
                                <ChevronDown
                                    className={`h-5 w-5 transform transition-transform ${
                                        sections.precio ? "" : "-rotate-180"
                                    }`}
                                />
                            </button>
                            {sections.precio && (
                                <div className="space-y-3">
                                    {priceRanges?.map((range) => (
                                        <label
                                            key={`${range.min}-${range.max}`}
                                            className="flex items-center space-x-3"
                                        >
                                            <input
                                                type="checkbox"
                                                name="precio"
                                                className="h-4 w-4 rounded border-gray-300"
                                                onChange={() =>
                                                    handleFilterChange(
                                                        "price",
                                                        range
                                                    )
                                                }
                                                checked={
                                                    selectedFilters.price &&
                                                    selectedFilters.price
                                                        .min === range.min &&
                                                    selectedFilters.price
                                                        .max === range.max
                                                }
                                            />
                                            <span>{`S/ ${range.min} - S/ ${range.max}`}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botón para aplicar filtros */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sticky bottom-0 border-t">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 bg-primary text-white text-base font-medium hover:bg-primary-dark focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={() => setShowMobileFilters(false)}
                        >
                            Aplicar filtros
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    return (
        <section className="p-[5%] mx-auto w-full">
            {/* Modal de filtros (solo se muestra en móvil) */}
            {showMobileFilters && <FiltersModal />}

            <div className="relative flex flex-col sm:flex-row gap-4">
                {/* Filters sidebar (visible solo en desktop) */}
                <div className="hidden lg:block w-full sm:w-1/5 bg-white p-4 rounded-lg h-max">
                    {/* Botón para cerrar en móvil */}
                    <div className="sm:hidden flex justify-between items-center mb-4">
                        <button
                            onClick={() => setShowMobileFilters(false)}
                            className="customtext-primary hover:customtext-accent"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-xl font-bold pb-4 mb-4 border-b">
                        {data?.title || "Filtros"}
                    </p>
                    <div className="mb-6">
                        <button
                            onClick={() => toggleSection("categoria")}
                            className="flex items-center justify-between w-full mb-4"
                        >
                            <span className="font-bold">Categorias</span>
                            <ChevronDown
                                className={`h-5 w-5 transform transition-transform ${
                                    sections.categoria ? "" : "-rotate-180"
                                }`}
                            />
                        </button>
                        {sections.categoria && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    {filteredCategories?.map((category) => {
                                        const isChecked =
                                            selectedFilters.category_id?.includes(
                                                category.id
                                            );
                                        return (
                                            <div
                                                key={category.id}
                                                className={`group py-2 rounded-md ${
                                                    isChecked
                                                        ? "bg-secondary"
                                                        : "bg-transparent"
                                                }`}
                                            >
                                                <label className="flex items-center justify-between cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 hidden w-4 rounded border-gray-300"
                                                        onChange={() =>
                                                            handleFilterChange(
                                                                "category_id",
                                                                category.id
                                                            )
                                                        }
                                                        checked={isChecked}
                                                    />
                                                    <span>{category.name}</span>
                                                    <img
                                                        src={`/storage/images/category/${category.image}`}
                                                        onError={(e) =>
                                                            (e.target.src =
                                                                "assets/img/noimage/no_imagen_circular.png")
                                                        }
                                                        alt={category.name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price range section */}
                    <div className="mb-6">
                        <button
                            onClick={() => toggleSection("precio")}
                            className="flex items-center justify-between w-full mb-4"
                        >
                            <span className="font-medium">Precio</span>
                            <ChevronDown
                                className={`h-5 w-5 transform transition-transform ${
                                    sections.precio ? "" : "-rotate-180"
                                }`}
                            />
                        </button>
                        {sections.precio && (
                            <div className="space-y-3">
                                {priceRanges?.map((range) => (
                                    <label
                                        key={`${range.min}-${range.max}`}
                                        className="flex items-center space-x-3"
                                    >
                                        <input
                                            type="checkbox"
                                            name="precio"
                                            className="h-4 w-4 rounded border-gray-300"
                                            onChange={() =>
                                                handleFilterChange(
                                                    "price",
                                                    range
                                                )
                                            }
                                            checked={
                                                selectedFilters.price &&
                                                selectedFilters.price.min ===
                                                    range.min &&
                                                selectedFilters.price.max ===
                                                    range.max
                                            }
                                        />
                                        <span>{`S/ ${range.min} - S/ ${range.max}`}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Products section */}
                <div className="w-full sm:w-4/5 py-4">
                    {/* Sort and pagination controls */}
                    <div className="flex justify-between items-end mb-4 w-full">
                        <div className="flex gap-4  items-start lg:items-center flex-col w-8/12 lg:w-auto lg:flex-row">
                            <label className="font-semibold text-sm w-[150px]">
                                Ordenar por
                            </label>
                            <SelectForm
                                options={sortOptions}
                                placeholder="Recomendados"
                                onChange={handleSortChange}
                                labelKey="label"
                                valueKey="value"
                                className="border-primary rounded-full customtext-primary"
                            />
                        </div>
                        <div className="lg:hidden flex items-end h-full mb-4">
                            <button
                                onClick={() =>
                                    setShowMobileFilters(!showMobileFilters)
                                }
                                className=" h-12 w-12 gap-2 bg-primary text-white flex items-center justify-center  rounded-full lg:hidden"
                            >
                                <Filter size={20} />
                            </button>
                        </div>
                        <div className="customtext-primary font-semibold hidden lg:block">
                            <div className="flex justify-between items-center mb-4 w-full mt-8">
                                {/* Top pagination */}
                                <div className="customtext-primary font-semibold">
                                    <nav className="flex items-center gap-x-2 min-w-max">
                                        <button
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
                                            disabled={
                                                pagination.currentPage === 1
                                            }
                                        >
                                            <ChevronLeft />
                                        </button>

                                        {getPageNumbers().map((page, index) => (
                                            <React.Fragment key={index}>
                                                {page === "..." ? (
                                                    <span className="w-10 h-10 bg-transparent p-2 inline-flex items-center justify-center rounded-full">
                                                        ...
                                                    </span>
                                                ) : (
                                                    <button
                                                        className={`w-10 h-10 p-2 inline-flex items-center justify-center rounded-full transition-all duration-300 
                              ${
                                  page === pagination.currentPage
                                      ? "bg-primary text-white"
                                      : "bg-transparent hover:text-white hover:bg-primary"
                              }`}
                                                        onClick={() =>
                                                            handlePageChange(
                                                                page
                                                            )
                                                        }
                                                    >
                                                        {page}
                                                    </button>
                                                )}
                                            </React.Fragment>
                                        ))}

                                        <button
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
                                        >
                                            <ChevronRight />
                                        </button>
                                    </nav>
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        {pagination.from} - {pagination.to} de{" "}
                                        {pagination.totalItems} Resultados
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products grid */}
                    {loading ? (
                        <Loading />
                    ) : (
                        <div className="flex items-center flex-wrap gap-y-2 lg:gap-y-3 transition-all duration-300 ease-in-out">
                            {Array.isArray(products) && products.length > 0 ? (
                                products.map((product) => {
                                    if (data?.card === "CardProductBananaLab") {
                                        return (
                                            <CardProductBananaLab
                                                key={product.id}
                                                product={product}
                                                widthClass="lg:w-1/3"
                                                cart={cart}
                                                setCart={setCart}
                                            />
                                        );
                                    } else {
                                        return (
                                            <ProductCardSimple
                                                key={product.id}
                                                product={product}
                                                widthClass="lg:w-1/3"
                                                cart={cart}
                                                setCart={setCart}
                                            />
                                        );
                                    }
                                })
                            ) : (
                                <NoResults />
                            )}
                        </div>
                    )}

                    {/* Bottom pagination */}
                    <div className="flex justify-between items-center mb-4 w-full mt-8">
                        <div className="customtext-primary font-semibold">
                            <nav className="flex items-center gap-x-2 min-w-max">
                                <button
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
                                >
                                    <ChevronLeft />
                                </button>

                                {getPageNumbers().map((page, index) => (
                                    <React.Fragment key={index}>
                                        {page === "..." ? (
                                            <span className="w-10 h-10 bg-transparent p-2 inline-flex items-center justify-center rounded-full">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                className={`w-10 h-10 p-2 inline-flex items-center justify-center rounded-full transition-all duration-300 
                          ${
                              page === pagination.currentPage
                                  ? "bg-primary text-white"
                                  : "bg-transparent hover:text-white hover:bg-primary"
                          }`}
                                                onClick={() =>
                                                    handlePageChange(page)
                                                }
                                            >
                                                {page}
                                            </button>
                                        )}
                                    </React.Fragment>
                                ))}

                                <button
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
                                >
                                    <ChevronRight />
                                </button>
                            </nav>
                        </div>
                        <div>
                            <p className="font-semibold">
                                {pagination.from} - {pagination.to} de{" "}
                                {pagination.totalItems} Resultados
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FilterCategoryImage;
