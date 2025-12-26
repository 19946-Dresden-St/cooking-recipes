export const MIN_DAYS = 1;
export const MAX_DAYS = 14;
export const DEFAULT_DAYS = 7;
export const DEFAULT_CATEGORY = "plat";

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const HIDDEN_ON_GENERATOR = new Set(["boisson", "sauce"]);

export const DAILY_CATEGORIES = new Set(["apero", "entree", "plat", "dessert"]);
export const DAILY_ORDER = ["apero", "entree", "plat", "dessert"];

export const LS = {
    MENUS: "generator:menus:v1",
    LOCKED_SLOTS: "generator:lockedSlots:v1",
    LOCKED_DAYS: "generator:lockedDays:v1",
    DAYS: "generator:days:v1",
    CATEGORIES: "generator:categories:v1",
    START_DATE: "generator:startDate:v1",
};
