import React from "react";

const CarruselBenefitsInifinite = React.lazy(() =>
    import("./Carrusel/CarruselBenefitsInifinite")
);
const CarruselBenefitsSimple = React.lazy(() =>
    import("./Carrusel/CarruselBenefitsSimple")
);
const CarruselBananaLab = React.lazy(() =>
    import("./Carrusel/CarruselBananaLab")
);
const Carrusel = ({ which, data, items, ads }) => {
    const getCarrusel = () => {
        switch (which) {
            case "CarruselBenefitsInifinite":
                return <CarruselBenefitsInifinite data={data} items={items} />;
            case "CarruselBenefitsSimple":
                return <CarruselBenefitsSimple data={data} items={items} />;
            case "CarruselBananaLab":
                return (
                    <CarruselBananaLab data={data} items={items} ads={ads} />
                );

            default:
                return (
                    <div className="w-full px-[5%] replace-max-w-here p-4 mx-auto">
                        - No Hay componente <b>{which}</b> -
                    </div>
                );
        }
    };
    return getCarrusel();
};

export default Carrusel;
