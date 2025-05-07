import React, { useEffect, useState } from "react";

const BlogSimple = React.lazy(() => import("./Blogs/BlogSimple"));
const BlogCarousel = React.lazy(() => import("./Blogs/BlogCarousel"));
const BlogCarruselBananaLab = React.lazy(() =>
    import("./Blogs/BlogCarruselBananaLab")
);
const Blog = ({
    data,
    items,
    which,
    headerPosts,
    filteredData,
    postsLatest,
    ads,
}) => {
    const getBlog = () => {
        switch (which) {
            case "BlogSimple":
                return (
                    <BlogSimple
                        data={data}
                        headerPosts={headerPosts}
                        postsLatest={postsLatest}
                        filteredData={filteredData}
                    />
                );

            case "BlogCarousel":
                return <BlogCarousel data={data} items={items} />;
            case "BlogCarruselBananaLab":
                return (
                    <BlogCarruselBananaLab
                        data={data}
                        items={items}
                        ads={ads}
                    />
                );

            default:
                return <div>No hay componente {which}</div>;
        }
    };

    return getBlog();
};

export default Blog;
