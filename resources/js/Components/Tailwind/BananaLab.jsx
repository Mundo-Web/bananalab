import React from "react";

const Canva1 = React.lazy(() => import("./BananaLab/Canva1"));
const Canva2 = React.lazy(() => import("./BananaLab/Canva2"));
const Canva3 = React.lazy(() => import("./BananaLab/Canva3"));
//const Editor = React.lazy(() => import("./BananaLab/Editor/pages/AlbumEditorPage"));
const Editor = React.lazy(() => import("./BananaLab/Editor"));
const BananaLab = ({ data, which, filteredData }) => {
    const getBananaLab = () => {
        switch (which) {
            case "Canva1":
                return <Canva1 data={data} filteredData={filteredData} />;
            case "Canva2":
                return <Canva2 data={data} filteredData={filteredData} />;
            case "Canva3":
                return <Canva3 data={data} filteredData={filteredData} />;
            case "Editor":
                return <Editor data={data} filteredData={filteredData} />;

            default:
                return (
                    <div className="w-full px-[5%] replace-max-w-here p-4 mx-auto">
                        - No Hay componente <b>{which}</b> -
                    </div>
                );
        }
    };
    return getBananaLab();
};

export default BananaLab;
