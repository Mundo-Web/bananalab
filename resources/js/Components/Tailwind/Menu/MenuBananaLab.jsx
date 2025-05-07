import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MenuBananaLab = ({ pages = [], items, campaigns }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [opencollection, setOpencollection] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
                setOpencollection(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const togglecollection = (collectionId) => {
        setOpencollection(
            opencollection === collectionId ? null : collectionId
        );
    };

    // Función para determinar el número de columnas basado en la cantidad de categorías
    const getGridColsClass = (categoriesCount) => {
        if (categoriesCount <= 3) return `grid-cols-${categoriesCount}`;
        if (categoriesCount <= 5) return "grid-cols-3";
        return "grid-cols-4";
    };

    return (
        <nav className="hidden md:block font-paragraph font-normal text-sm py-4">
            <div className="px-primary 2xl:px-0 2xl:max-w-7xl mx-auto flex justify-between">
                <ul
                    className="flex items-center gap-6 text-sm relative"
                    ref={menuRef}
                >
                    {items.map((collection) => (
                        <li key={collection.id} className="py-3 group">
                            <div
                                className={`flex items-center gap-1 hover:customtext-primary font-semibold ${
                                    opencollection === collection.id
                                        ? "customtext-primary "
                                        : ""
                                }`}
                            >
                                <a
                                    href={`/catalogo?collection=${collection.slug}`}
                                    className="cursor-pointer transition-all duration-300 pr-2 relative"
                                >
                                    {collection.name}
                                </a>
                                {collection?.categories?.length > 0 && (
                                    <button
                                        onClick={() =>
                                            togglecollection(collection.id)
                                        }
                                        className={`customtext-netrual-dark  hover:text-primary `}
                                    >
                                        {opencollection === collection.id ? (
                                            <ChevronUp size={16} />
                                        ) : (
                                            <ChevronDown size={16} />
                                        )}
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}

                    {/* Modal alineado fijo */}
                    {opencollection && (
                        <div
                            className="absolute z-40 top-full left-0 mt-4 bg-white rounded-2xl py-4 px-6 shadow-2xl 
                       w-max max-w-screen-lg max-h-[calc(100vh-150px)] overflow-y-auto"
                        >
                            <ul
                                className={`grid ${getGridColsClass(
                                    items.find((c) => c.id === opencollection)
                                        ?.categories.length || 1
                                )} gap-8`}
                            >
                                {items
                                    .find((c) => c.id === opencollection)
                                    ?.categories.map((category) => (
                                        <li
                                            key={category.id}
                                            className="space-y-2"
                                        >
                                            <a
                                                href={`/catalogo?category=${category.slug}`}
                                                className="customtext-neutral-dark font-semibold text-base hover:customtext-primary transition-colors duration-300 cursor-pointer block py-2 border-b border-neutral-dark"
                                            >
                                                {category.name}
                                            </a>
                                            {category?.subcategories?.length >
                                                0 && (
                                                <ul className="space-y-1">
                                                    {category.subcategories.map(
                                                        (subcategory) => (
                                                            <li
                                                                key={
                                                                    subcategory.id
                                                                }
                                                            >
                                                                <a
                                                                    href={`/catalogo?category=${subcategory.slug}`}
                                                                    className="customtext-neutral-dark text-sm font-semibold hover:customtext-primary transition-colors duration-300 cursor-pointer block py-1"
                                                                >
                                                                    {
                                                                        subcategory.name
                                                                    }
                                                                </a>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    )}
                </ul>

                <div className="flex gap-4">
                    <a
                        href={`/catalogo?sort=novedades`}
                        className="bg-primary text-white rounded-full px-6 py-3 font-medium"
                    >
                        Lo nuevo
                    </a>
                    {campaigns &&
                        campaigns.length > 0 &&
                        campaigns.map((campaign) => (
                            <a
                                href={`/catalogo?campaign=${campaign.slug}`}
                                className="bg-primary text-white rounded-full px-6 py-3 font-medium"
                            >
                                {campaign.name}
                            </a>
                        ))}
                </div>
            </div>
        </nav>
    );
};

export default MenuBananaLab;
