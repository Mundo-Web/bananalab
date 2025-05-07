import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { adjustTextColor } from "../../../Functions/adjustTextColor";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";

const SliderBananaLab = ({ items, data }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
    const buttonsRef = useRef([]);

    // Animation variants
    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.5,
            },
        },
        exit: (direction) => ({
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.5,
            },
        }),
    };

    const buttonVariants = {
        hover: {
            scale: 1.1,
            boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
            transition: { duration: 0.3 },
        },
        tap: {
            scale: 0.95,
        },
    };

    const paginationDotVariants = {
        inactive: {
            scale: 0.8,
            opacity: 0.6,
        },
        active: {
            scale: 1.2,
            opacity: 1,
        },
    };

    useEffect(() => {
        buttonsRef.current.forEach((button) => {
            if (button) adjustTextColor(button);
        });
    }, [items]);

    const handleSlideChange = (swiper) => {
        setDirection(swiper.realIndex > activeIndex ? 1 : -1);
        setActiveIndex(swiper.realIndex);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="px-primary mx-auto my-6 font-paragraph relative 2xl:px-0 2xl:max-w-7xl"
        >
            <Swiper
                navigation={{
                    prevEl: ".custom-prev",
                    nextEl: ".custom-next",
                }}
                slidesPerView={3}
                spaceBetween={30}
                loop={true}
                breakpoints={{
                    0: { slidesPerView: 1, spaceBetween: 10 },
                    640: { slidesPerView: 1, spaceBetween: 10 },
                    1024: { slidesPerView: 1, spaceBetween: 0 },
                }}
                modules={[Navigation, Pagination]}
                onSlideChange={handleSlideChange}
            >
                {items.map((item, index) => (
                    <SwiperSlide key={index}>
                        <motion.div
                            key={`slide-${index}`}
                            custom={direction}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            variants={slideVariants}
                            className="h-[760px] lg:h-[500px] rounded-3xl bg-sections-color relative flex flex-col overflow-hidden"
                        >
                            <motion.img
                                src={`/assets/img/backgrounds/sliders/slider.png`}
                                alt={item.name}
                                loading="lazy"
                                className="absolute bottom-0 -rotate-180 left-0 object-cover object-right-bottom h-full lg:top-0 lg:right-0 lg:rotate-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                            />

                            <motion.div
                                className="p-5 py-8 lg:max-w-2xl lg:px-16 lg:flex lg:items-center lg:h-full z-10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="flex flex-col gap-5 lg:gap-5 items-start">
                                    <motion.h2
                                        className="w-[95%] text-[32px] font-semibold leading-9 lg:text-4xl"
                                        style={{
                                            textShadow:
                                                "0 0 20px rgba(0, 0, 0, .25)",
                                        }}
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay: 0.6,
                                            duration: 0.5,
                                        }}
                                    >
                                        {item.name}
                                    </motion.h2>

                                    <motion.p
                                        className="my-2 w-10/12 customtext-neutral-light text-sm leading-tight"
                                        style={{
                                            textShadow:
                                                "0 0 20px rgba(0, 0, 0, .25)",
                                        }}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay: 0.7,
                                            duration: 0.5,
                                        }}
                                    >
                                        {item.description}
                                    </motion.p>

                                    <motion.a
                                        href={item.button_link}
                                        ref={(el) =>
                                            (buttonsRef.current[index] = el)
                                        }
                                        className="bg-primary z-50 my-1 w-7/12 h-11 flex items-center justify-center rounded-full text-white text-sm font-semibold lg:w-max lg:px-10"
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                            delay: 0.8,
                                            duration: 0.3,
                                        }}
                                    >
                                        {item.button_text}
                                    </motion.a>
                                </div>
                            </motion.div>

                            <motion.img
                                src={`/storage/images/slider/${
                                    item.bg_image || "undefined"
                                }`}
                                alt={item.name}
                                loading="lazy"
                                className="absolute -bottom-40 w-auto h-[600px] object-cover lg:right-0 lg:h-[700px]"
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9, duration: 0.8 }}
                            />
                        </motion.div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Paginacion personalizada */}
            <motion.div
                className="absolute bottom-4 z-50 left-1/2 -translate-x-1/2 flex justify-center gap-2 mt-10 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                {items.map((_, index) => (
                    <motion.button
                        key={index}
                        className={`rounded-full ${
                            index === activeIndex ? "bg-primary" : "bg-white"
                        } w-[16px] h-[16px]`}
                        variants={paginationDotVariants}
                        animate={
                            index === activeIndex
                                ? "active bg-primary"
                                : "inactive"
                        }
                        whileHover={{ scale: 1.3 }}
                        transition={{ type: "spring", stiffness: 500 }}
                    />
                ))}
            </motion.div>

            {/* Botones de navegación personalizados */}
            <motion.div
                className="hidden  absolute lg:flex bottom-10  right-24 2xl:right-10 z-50 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
            >
                <motion.div
                    className="custom-prev cursor-pointer h-14 w-14 flex items-center justify-center bg-primary brightness-125 text-white hover:brightness-100 hover:bg-primary rounded-full"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                >
                    <ChevronLeft />
                </motion.div>

                <motion.div
                    className="custom-next cursor-pointer h-14 w-14 flex items-center justify-center bg-primary brightness-125 text-white hover:brightness-100 hover:bg-primary rounded-full"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                >
                    <ChevronRight />
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default SliderBananaLab;
