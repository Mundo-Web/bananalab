import React from "react";

const FilterSimple = React.lazy(() => import("./Filters/FilterSimple"));
const CatalagoFiltros = React.lazy(() => import("./Filters/CatalagoFiltros"));
const CatalagoFiltrosPidelo = React.lazy(() =>
    import("./Filters/CatalagoFiltrosPidelo")
);
const FilterSalaFabulosa = React.lazy(() =>
    import("./Filters/FilterSalaFabulosa")
);
const FilterBananaLab = React.lazy(() => import("./Filters/FilterBananaLab"));
const FilterCategoryImage = React.lazy(() =>
    import("./Filters/FilterCategoryImage")
); //
//const Filter = ({ which, items, data, category, brands, subcategory, cart, setCart, prices }) => {
const Filter = ({
    which,
    items,
    data,
    cart,
    setCart,
    filteredData,
    setFavorites,
    favorites,
    collections,
    campaigns,
}) => {
    //console.log("Filter props:", { which, items, data, filteredData });
    const getFilter = () => {
        switch (which) {
            case "FilterSimple":
                // return <FilterSimple data={data} category={category} subcategory={subcategory} cart={cart} setCart={setCart} />
                return (
                    <FilterSimple data={data} cart={cart} setCart={setCart} />
                );
            case "CatalagoFiltros":
                // return <CatalagoFiltros data={data} items={items} prices={prices} categories={category} brands={brands} cart={cart} setCart={setCart} />
                return (
                    <CatalagoFiltros
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                        filteredData={filteredData}
                    />
                );
            case "CatalagoFiltrosPidelo":
                // return <CatalagoFiltros data={data} items={items} prices={prices} categories={category} brands={brands} cart={cart} setCart={setCart} />
                return (
                    <CatalagoFiltrosPidelo
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                        filteredData={filteredData}
                    />
                );
            case "FilterSalaFabulosa":
                // return <CatalagoFiltros data={data} items={items} prices={prices} categories={category} brands={brands} cart={cart} setCart={setCart} />
                return (
                    <FilterSalaFabulosa
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                        filteredData={filteredData}
                    />
                );
            case "FilterCategoryImage":
                // return <CatalagoFiltros data={data} items={items} prices={prices} categories={category} brands={brands} cart={cart} setCart={setCart} />
                return (
                    <FilterCategoryImage
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                        filteredData={filteredData}
                    />
                );
            case "FilterBananaLab":
                return (
                    <FilterBananaLab
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                        filteredData={filteredData}
                        setFavorites={setFavorites}
                        favorites={favorites}
                        collections={collections}
                        campaigns={campaigns}
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
    return getFilter();
};

export default Filter;
