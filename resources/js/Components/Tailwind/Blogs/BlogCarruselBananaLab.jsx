import React, { useState } from "react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";

const BlogCarruselBananaLab = ({ data, items, ads }) => {
    // Animaciones
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut",
            },
        },
    };

    const hoverCard = {
        scale: 1.02,
        boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.3 },
    };

    const hoverImage = {
        scale: 1.05,
        transition: { duration: 0.5 },
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="w-full mx-auto px-[5%] font-paragraph customtext-neutral-dark mb-8 2xl:px-0 2xl:max-w-7xl"
        >
            <motion.div
                variants={itemVariants}
                className="flex justify-between items-center mb-6"
            >
                <h2 className="text-[32px] leading-9 font-semibold mb-2 md:mb-0">
                    {data?.title}
                </h2>
                <motion.a
                    href={data?.link_blog}
                    className="font-bold"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    {data?.button_text}{" "}
                    <i className="mdi mdi-chevron-right"></i>
                </motion.a>
            </motion.div>

            <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-16"
            >
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 bg-sections-color md:col-span-2 lg:col-span-3 rounded-2xl p-4 grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                    {items.map((item, index) => {
                        const content = document.createElement("div");
                        content.innerHTML = item?.description;
                        const text =
                            content.textContent || content.innerText || "";

                        return (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                whileHover={hoverCard}
                                className="bg-white rounded-lg overflow-hidden shadow-sm h-auto cursor-pointer"
                            >
                                <motion.div
                                    className="overflow-hidden"
                                    whileHover={hoverImage}
                                >
                                    <img
                                        src={`/storage/images/post/${item?.image}`}
                                        alt={item?.title}
                                        className="inset-0 h-[180px] w-full object-cover aspect-[4/3]"
                                    />
                                </motion.div>
                                <div className="p-4">
                                    <h3 className="text-2xl font-semibold mt-1 mb-2 leading-tight">
                                        {item?.name}
                                    </h3>
                                    <motion.p
                                        className="text-base line-clamp-2"
                                        whileHover={{ color: "#555" }}
                                    >
                                        {text}
                                    </motion.p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {ads && ads.length > 1 && (
                    <motion.div
                        variants={itemVariants}
                        whileHover={{
                            scale: 1.02,
                            rotate: 0.5,
                            transition: { type: "spring", damping: 10 },
                        }}
                        className="col-span-1 md:col-span-1 lg:col-span-1 rounded-2xl mt-2"
                    >
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm h-full">
                            <a href={ads[1].target_url}>
                                <img
                                    src={`/storage/images/ad/${ads[1]?.image}`}
                                    alt={ads[1]?.alt_text || ads[1]?.name}
                                    className="h-full object-cover"
                                />
                            </a>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default BlogCarruselBananaLab;
