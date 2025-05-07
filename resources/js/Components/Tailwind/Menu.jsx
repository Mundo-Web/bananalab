import React from "react";

const MenuSimple = React.lazy(() => import("./Menu/MenuSimple"));
const MenuBananaLab = React.lazy(() => import("./Menu/MenuBananaLab"));
const Menu = ({
    data,
    which,
    items,
    generals = [],
    cart,
    setCart,
    pages,
    campaigns,
}) => {
    const getMenu = () => {
        switch (which) {
            case "MenuSimple":
                return (
                    <MenuSimple
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                        pages={pages}
                    />
                );
            case "MenuBananaLab":
                return (
                    <MenuBananaLab
                        campaigns={campaigns}
                        data={data}
                        items={items}
                        cart={cart}
                        setCart={setCart}
                        pages={pages}
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
    return getMenu();
};

export default Menu;
