import React from "react";

const ProductCarousel = React.lazy(() => import("./Products/ProductCarousel"));
const ProductList = React.lazy(() => import("./Products/ProductList"));
const ProductSlider = React.lazy(() => import("./Products/ProductSlider"));
const ProductInfinite = React.lazy(() => import("./Products/ProductInfinite"));
const ProductNavigation = React.lazy(() =>
    import("./Products/ProductNavigation")
);
const ProductBananaLab = React.lazy(() =>
    import("./Products/ProductBananaLab")
);
const ScrapingSimple = React.lazy(() => import("./Scraping/ScrapingSimple"));

const Product = ({
    which,
    data,
    items,
    cart,
    setCart,
    favorites,
    setFavorites,
    pages,
    filteredData,
}) => {
    const getProduct = () => {
        switch (which) {
            case "Carousel":
                return (
                    <ProductCarousel
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                    />
                );
            case "List":
                return (
                    <ProductList
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                    />
                );
            case "ProductSlider":
                return (
                    <ProductSlider
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                    />
                );
            case "ProductInfinite":
                return (
                    <ProductInfinite
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                    />
                );
            case "ProductNavigation":
                return (
                    <ProductNavigation
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                    />
                );
            case "ProductBananaLab":
                return (
                    <ProductBananaLab
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                        favorites={favorites}
                        setFavorites={setFavorites}
                    />
                );
            case "Scraping":
                return (
                    <ScrapingSimple
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                        pages={pages}
                        filteredData={filteredData}
                    />
                );

            default:
                return (
                    <div className="w-full px-[5%] replace-max-w-here p-4 mx-auto">
                        - No Hay componente <b>{which}</b> -
                    </div>
                );
        }
    };
    return getProduct();
};

export default Product;
