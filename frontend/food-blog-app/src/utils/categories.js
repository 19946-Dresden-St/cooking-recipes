export const CATEGORY_MAP = {
    apero: "Apéro",
    entree: "Entrée",
    plat: "Plat",
    dessert: "Dessert",
    boisson: "Boisson",
    brunch: "Brunch",
};

export const CATEGORY_ORDER = ["apero", "entree", "plat", "dessert", "boisson", "brunch"];

export const getCategoryLabel = (category) => {
    return CATEGORY_MAP[category] ?? "Plat";
};

export const getBadgeClass = (category) => {
    const safe = (category || "entree").toLowerCase().trim();
    return `badge-${safe}`;
};
