export const clampInt = (value, min, max, fallback) => {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
};

export const clampNumber = (value, min, max, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
};

export const buildExcludeParam = (ids) => ids.filter(Boolean).join(",");

/** slot key: dayIndex|meal|categoryKey */
export const slotKey = ({ dayIndex, meal, categoryKey }) =>
    `${dayIndex}|${meal}|${categoryKey ?? ""}`;

export const parseSlotKey = (key) => {
    const [d, meal, categoryKey] = String(key).split("|");
    return {
        dayIndex: Number.parseInt(d, 10),
        meal,
        categoryKey: categoryKey || undefined,
    };
};
