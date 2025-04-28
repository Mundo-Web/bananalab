export const layouts = [
    {
        id: "layout-1",
        name: "Cuatro fotos",
        template: "grid-cols-2 grid-rows-2",
        cells: 4,
        maskCategories: [
            {
                name: "Básicas",
                masks: [
                    "none",
                    "circle",
                    "rounded",
                    "square",
                    "rounded-sm",
                    "rounded-lg",
                    "rounded-full",
                    "rounded-rect",
                ],
            },
            {
                name: "Formas",
                masks: [
                    "heart",
                    "star",
                    "hexagon",
                    "triangle",
                    "diamond",
                    "badge",
                    "speech",
                    "burst",
                ],
            },
            {
                name: "Fotográficos",
                masks: [
                    "polaroid",
                    "vintage",
                    "frame",
                    "wave",
                    "diagonal",
                    "bevel",
                    "poster",
                    "inner-frame",
                ],
            },
            {
                name: "Creativas",
                masks: [
                    "leaf",
                    "cloud",
                    "flower",
                    "ornate",
                    "blob1",
                    "blob2",
                    "blob3",
                ],
            },
        ],
    },
    {
        id: "layout-2",
        name: "Dos fotos horizontales",
        template: "grid-cols-1 grid-rows-2",
        cells: 2,
        maskCategories: [
            {
                name: "Básicas",
                masks: ["none", "circle", "rounded", "square"],
            },
            {
                name: "Fotográficos",
                masks: ["polaroid", "vintage", "frame", "wave"],
            },
        ],
    },
    {
        id: "layout-3",
        name: "Tres fotos mixtas",
        template: "grid-cols-3 [grid-template-columns:1fr_2fr]",
        cells: 3,
        maskCategories: [
            {
                name: "Formas",
                masks: ["heart", "star", "hexagon", "triangle"],
            },
            {
                name: "Fotográficos",
                masks: ["polaroid", "vintage", "frame", "wave"],
            },
        ],
    },
    {
        id: "layout-4",
        name: "Collage 2x2",
        template: "grid-cols-2 grid-rows-2",
        cells: 4,
        maskCategories: [
            {
                name: "Básicas",
                masks: ["none", "circle", "rounded"],
            },
            {
                name: "Formas",
                masks: ["heart", "star", "hexagon"],
            },
        ],
    },
    {
        id: "layout-5",
        name: "Mosaico",
        template: "grid-cols-3 grid-rows-2",
        cells: 6,
        maskCategories: [
            {
                name: "Básicas",
                masks: ["none", "circle", "square"],
            },
            {
                name: "Creativas",
                masks: ["leaf", "cloud", "flower"],
            },
        ],
    },
];
