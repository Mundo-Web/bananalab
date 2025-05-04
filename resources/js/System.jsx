import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import CreateReactScript from "./Utils/CreateReactScript";

import TopBar from "./Components/Tailwind/TopBar";
import Header from "./Components/Tailwind/Header";
import Footer from "./Components/Tailwind/Footer";
import SortByAfterField from "./Utils/SortByAfterField";
import Slider from "./Components/Tailwind/Slider";
import Product from "./Components/Tailwind/Product";
import Banner from "./Components/Tailwind/Banner";
import Category from "./Components/Tailwind/Category";
import Collection from "./Components/Tailwind/Collection";
import Cart from "./Components/Tailwind/Cart";
import Step from "./Components/Tailwind/Step";
import { Local } from "sode-extend-react";
import Global from "./Utils/Global";
import ItemsRest from "./Actions/ItemsRest";
import Filter from "./Components/Tailwind/Filter";
import ProductDetail from "./Components/Tailwind/ProductDetail";
import Contact from "./Components/Tailwind/Contact";
import Frame from "./Components/Tailwind/Frame";
import Checkout from "./Components/Tailwind/Checkout";
import Menu from "./Components/Tailwind/Menu";
import Carrusel from "./Components/Tailwind/Carrusel";
import Faq from "./Components/Tailwind/Faq";
import PostDetail from "./Components/Tailwind/PostDetail";
import Blog from "./Components/Tailwind/Blog";
import AboutUs from "./Components/Tailwind/AboutUs";
import Login from "./Components/Tailwind/Login";
import Signup from "./Components/Tailwind/Signup";
import ForgotPassword from "./Components/Tailwind/ForgotPassword";
import ResetPassword from "./Components/Tailwind/ResetPassword";
import Complaint from "./Components/Tailwind/Complaint";
import Indicator from "./Components/Tailwind/Indicator";
import ThankSimple from "./Components/Tailwind/Thanks/ThankSimple";
import Image from "./Components/Tailwind/Image";
import BananaLab from "./Components/Tailwind/BananaLab";
import { Toaster } from "sonner";

const itemsRest = new ItemsRest();

const System = ({
    session,
    page,
    isUser,
    pages,
    params,
    filteredData = {},
    systems,
    generals = [],
    systemItems = {},
    contacts,
    faqs,
    headerPosts,
    postsLatest,
}) => {
    // console.log(session);
    const getItems = (itemsId) => {
        return systemItems[itemsId] ?? [];
    };

    const [cart, setCart] = useState(
        Local.get(`${Global.APP_CORRELATIVE}_cart`) ?? []
    );

    useEffect(() => {
        Local.set(`${Global.APP_CORRELATIVE}_cart`, cart);
    }, [cart]);

    const [favorites, setFavorites] = useState(
        Local.get(`${Global.APP_CORRELATIVE}_favorites`) ?? []
    );

    useEffect(() => {
        Local.set(`${Global.APP_CORRELATIVE}_favorites`, favorites);
    }, [favorites]);

    useEffect(() => {
        itemsRest.verifyStock(cart.map((x) => x.id)).then((items) => {
            const newCart = items.map((item) => {
                const found = cart.find((x) => x.id == item.id);
                if (!found) return;
                found.price = item.price;
                found.discount = item.discount;
                found.name = item.name;
                return found;
            });
            setCart(newCart);
        });
    }, [null]);

    const getSystem = ({ component, value, data, itemsId, visible }) => {
        if (visible == 0) return <></>;

        switch (component) {
            case "top_bar":
                return (
                    <TopBar
                        data={data}
                        which={value}
                        items={getItems(itemsId)}
                        cart={cart}
                        setCart={setCart}
                        isUser={isUser}
                    />
                );
            case "header":
                return (
                    <Header
                        data={data}
                        which={value}
                        items={getItems(itemsId)}
                        cart={cart}
                        setCart={setCart}
                        favorites={favorites}
                        setFavorites={setFavorites}
                        pages={pages}
                        isUser={isUser}
                        generals={generals}
                    />
                );
            case "menu":
                return (
                    <Menu
                        data={data}
                        which={value}
                        items={getItems(itemsId)}
                        cart={cart}
                        setCart={setCart}
                        pages={pages}
                    />
                );

            case "content":
                if (!page.id) {
                    return (
                        <div className="h-80 w-full bg-gray-300 flex items-center justify-center">
                            <div>- Tu contenido aquí -</div>
                        </div>
                    );
                } else if (page.extends_base) {
                    const contentSystems = SortByAfterField(systems).filter(
                        (x) => Boolean(x.page_id)
                    );
                    return contentSystems.map((content) => getSystem(content));
                }
                break;
            case "filter":
                //  return <Filter which={value} data={data} items={getItems(itemsId)} prices={filteredData.PriceRange} category={filteredData.Category} brands={filteredData.Brand} subcategory={filteredData.SubCategory} cart={cart} setCart={setCart} filteredData={filteredData} />
                return (
                    <Filter
                        which={value}
                        data={data}
                        items={getItems(itemsId)}
                        filteredData={filteredData}
                        cart={cart}
                        setCart={setCart}
                    />
                );

            case "product":
                return (
                    <Product
                        which={value}
                        data={data}
                        items={getItems(itemsId)}
                        filteredData={filteredData}
                        cart={cart}
                        setCart={setCart}
                        favorites={favorites}
                        setFavorites={setFavorites}
                        pages={pages}
                    />
                );
            case "category":
                return (
                    <Category
                        which={value}
                        data={data}
                        items={getItems(itemsId)}
                    />
                );
            case "collection":
                return (
                    <Collection
                        which={value}
                        data={data}
                        items={getItems(itemsId)}
                    />
                );
            case "slider":
                return (
                    <Slider
                        which={value}
                        data={data}
                        sliders={getItems(itemsId)}
                    />
                );
            case "carrusel":
                return (
                    <Carrusel
                        which={value}
                        data={data}
                        items={getItems(itemsId)}
                    />
                );

            case "indicator":
                return (
                    <Indicator
                        which={value}
                        data={data}
                        items={getItems(itemsId)}
                    />
                );
            case "banner":
                return <Banner which={value} data={data} />;
            case "image":
                return <Image which={value} data={data} />;
            case "step":
                return <Step which={value} data={data} />;
            case "product-detail":
                return (
                    <ProductDetail
                        which={value}
                        item={filteredData.Item}
                        cart={cart}
                        setCart={setCart}
                    />
                );
            case "cart":
                return (
                    <Cart
                        which={value}
                        data={data}
                        cart={cart}
                        setCart={setCart}
                    />
                );
            case "checkout":
                return (
                    <Checkout
                        which={value}
                        cart={cart}
                        setCart={setCart}
                        isUser={isUser}
                    />
                );
            case "contact":
                return (
                    <Contact which={value} data={data} contacts={contacts} />
                );
            case "faq":
                return <Faq which={value} data={data} faqs={faqs} />;

            case "thank":
                return <ThankSimple which={value} data={data} />;
            case "blog":
                return (
                    <Blog
                        which={value}
                        data={data}
                        items={getItems(itemsId)}
                        headerPosts={headerPosts}
                        postsLatest={postsLatest}
                        filteredData={filteredData}
                    />
                );
            case "post-detail":
                return (
                    <PostDetail
                        which={value}
                        data={data}
                        item={filteredData.Post}
                    />
                );
            case "about":
                return (
                    <AboutUs
                        which={value}
                        data={data}
                        filteredData={filteredData}
                    />
                );
            case "login":
                return <Login which={value} data={data} />;
            case "signup":
                return <Signup which={value} data={data} />;
            case "forgot-password":
                return <ForgotPassword which={value} data={data} />;
            case "reset-password":
                return <ResetPassword which={value} data={data} />;
            case "frame":
                return <Frame which={value} data={data} />;
            case "footer":
                return (
                    <Footer
                        which={value}
                        items={getItems(itemsId)}
                        pages={pages}
                        generals={generals}
                        contacts={contacts}
                    />
                );
            case "complaints":
                return <Complaint which={value} generals={generals} />;
            case "bananalab":
                return <BananaLab which={value} generals={generals} />;
        }
    };

    const systemsSorted = SortByAfterField(systems).filter((x) =>
        page.extends_base ? !x.page_id : true
    );

    return (
        <main className="font-paragraph">
            {systemsSorted.map((system) => getSystem(system))}
            <Toaster />
        </main>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(<System {...properties} />);
});
