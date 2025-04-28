/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.js",
        "./resources/**/*.jsx",
        "./resources/**/*.vue",
    ],
    theme: {
        extend: {
            fontFamily: {
                "font-general": ["Lato", "serif"], //"Lato" "serif" usado para Sala Fabulosa
                "font-primary": ["Rajdhani", "sans-serif"], // usado para Stech Peru
                "font-secondary": ["Open Sans", "serif"],
            },
            margin: {
                primary: "5%",
            },
            padding: {
                primary: "5%",
            },
            objectPosition: {
                "right-25": "75% center", // Esto desplaza la imagen 75% a la derecha y la centra verticalmente
                "right-10": "90% center", // Esto desplaza la imagen 90% a la derecha y la centra verticalmente
            },
            width: {
                "12x12": "1152px", // 12 pulgadas * 96 DPI
                "8-5x11": "816px", // 8.5 pulgadas * 96 DPI
                "6x8": "576px", // 6 pulgadas * 96 DPI
                "4x6": "384px", // 4 pulgadas * 96 DPI
                "5x7": "480px", // 5 pulgadas * 96 DPI
                "a5-width": "595px", // Ancho aproximado de A5 en 96 DPI
            },
            height: {
                "12x12": "1152px", // 12 pulgadas * 96 DPI
                "8-5x11": "1056px", // 11 pulgadas * 96 DPI
                "6x8": "768px", // 8 pulgadas * 96 DPI
                "4x6": "576px", // 6 pulgadas * 96 DPI
                "5x7": "672px", // 7 pulgadas * 96 DPI
                "a5-height": "842px", // Alto aproximado de A5 en 96 DPI
            },
        },
    },
    plugins: [
        require("@tailwindcss/typography"),
        require("tailwindcss-animated"),
        // Otros plugins si los tienes
    ],
};
