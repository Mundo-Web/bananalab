// Definimos los layouts con estilos avanzados y tendencias modernas para álbumes de fotos
export const layouts = [
    // LAYOUTS HERO/DESTACADOS
    {
        id: "hero-fullpage",
        name: "Hero - Página Completa",
        description: "Una imagen protagonista que ocupa toda la página",
        category: "hero",
        template: "grid-cols-1 grid-rows-1",
        cells: 1,
        style: {
            gap: "0px",
            padding: "0px"
        },
        cellStyles: {
            0: "rounded-lg overflow-hidden shadow-2xl"
        },
        maskCategories: [
            {
                name: "Editorial",
                masks: ["none", "soft-vignette", "magazine-crop", "editorial-frame"]
            },
            {
                name: "Artístico",
                masks: ["film-grain", "vintage-border", "polaroid-large"]
            }
        ]
    },
    {
        id: "hero-split",
        name: "Hero - División Dramática",
        description: "Dos imágenes grandes con división vertical elegante",
        category: "hero",
        template: "grid-cols-2 grid-rows-1 gap-1",
        cells: 2,
        style: {
            gap: "4px"
        },
        cellStyles: {
            0: "rounded-l-lg overflow-hidden shadow-xl",
            1: "rounded-r-lg overflow-hidden shadow-xl"
        },
        maskCategories: [
            {
                name: "Minimalista",
                masks: ["none", "soft-rounded", "subtle-shadow"]
            }
        ]
    },

    // LAYOUTS MAGAZINE/EDITORIAL
    {
        id: "magazine-asymmetric",
        name: "Magazine - Asimétrico",
        description: "Layout editorial con jerarquía visual moderna",
        category: "editorial",
        template: "grid-cols-5 grid-rows-3 gap-2",
        cells: 4,
        style: {
            gap: "6px"
        },
        cellStyles: {
            0: "col-span-3 row-span-2 rounded-lg overflow-hidden shadow-lg", // Principal
            1: "col-span-2 row-span-1 rounded-md overflow-hidden shadow-md", // Secundaria
            2: "col-span-2 row-span-1 rounded-md overflow-hidden shadow-md", // Terciaria
            3: "col-span-5 row-span-1 rounded-md overflow-hidden shadow-sm"  // Inferior
        },
        maskCategories: [
            {
                name: "Editorial",
                masks: ["none", "magazine-crop", "editorial-frame", "soft-vignette"]
            },
            {
                name: "Moderno",
                masks: ["geometric-crop", "minimal-frame", "clean-border"]
            }
        ]
    },
    {
        id: "magazine-grid",
        name: "Magazine - Grid Moderno",
        description: "Grid uniforme con espaciado editorial elegante",
        category: "editorial",
        template: "grid-cols-3 grid-rows-2 gap-3",
        cells: 6,
        style: {
            gap: "8px",
            padding: "4px"
        },
        cellStyles: {
            0: "rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow",
            1: "rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow",
            2: "rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow",
            3: "rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow",
            4: "rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow",
            5: "rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
        },
        maskCategories: [
            {
                name: "Uniformes",
                masks: ["none", "rounded", "soft-rounded", "minimal-frame"]
            }
        ]
    },


    // LAYOUTS MINIMALISTA
    {
        id: "minimal-duo",
        name: "Minimal - Dúo Elegante",
        description: "Dos imágenes con mucho espacio blanco",
        category: "minimal",
        template: "grid-cols-1 grid-rows-2 gap-8",
        cells: 2,
        style: {
            gap: "32px",
            padding: "24px"
        },
        cellStyles: {
            0: "rounded-xl overflow-hidden shadow-2xl",
            1: "rounded-xl overflow-hidden shadow-2xl"
        },
        maskCategories: [
            {
                name: "Limpio",
                masks: ["none", "clean-border", "minimal-frame", "soft-shadow"]
            }
        ]
    },
  

   

    // LAYOUTS CLÁSICOS MEJORADOS
    {
        id: "classic-quad",
        name: "Clásico - Cuadrícula Premium",
        description: "Cuatro imágenes con estilo editorial premium",
        category: "classic",
        template: "grid-cols-2 grid-rows-2 gap-4",
        cells: 4,
        style: {
            gap: "12px",
            padding: "8px"
        },
        cellStyles: {
            0: "rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300",
            1: "rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300",
            2: "rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300",
            3: "rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
        },
        maskCategories: [
            {
                name: "Premium",
                masks: [
                    "none", "rounded", "soft-rounded", "premium-frame",
                    "elegant-border", "classic-shadow", "editorial-crop"
                ]
            },
            {
                name: "Artístico",
                masks: [
                    "vintage", "film-grain", "classic-vignette", "sepia-tone",
                    "black-white-frame", "retro-border"
                ]
            }
        ]
    },
    {
        id: "classic-portrait",
        name: "Clásico - Retrato Elegante",
        description: "Layout perfecto para retratos y fotos verticales",
        category: "classic",
        template: "grid-cols-3 grid-rows-2 gap-3",
        cells: 3,
        style: {
            gap: "10px"
        },
        cellStyles: {
            0: "col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-2xl", // Principal
            1: "col-span-1 row-span-1 rounded-lg overflow-hidden shadow-lg",   // Secundaria 1
            2: "col-span-1 row-span-1 rounded-lg overflow-hidden shadow-lg"    // Secundaria 2
        },
        maskCategories: [
            {
                name: "Retrato",
                masks: ["none", "portrait-frame", "elegant-oval", "classic-border"]
            }
        ]
    }
];
