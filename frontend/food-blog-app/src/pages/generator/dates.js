const pad2 = (n) => String(n).padStart(2, "0");

/**
 * YYYY-MM-DD en "local" (évite les décalages liés à toISOString() en UTC)
 */
export const toLocalISODate = (date) => {
    const d = date instanceof Date ? date : new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/**
 * Construit un Date local à minuit à partir d'un YYYY-MM-DD
 */
export const fromISOToLocalDate = (iso) => new Date(`${iso}T00:00:00`);

export const addDaysISO = (startISO, offsetDays) => {
    const d = fromISOToLocalDate(startISO);
    d.setDate(d.getDate() + offsetDays);
    return toLocalISODate(d);
};

export const isSameISODate = (a, b) => String(a) === String(b);

export const capitalizeFirst = (s) => {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
};

export const formatDayLabelForCard = ({ dateISO, todayISO }) => {
    const date = fromISOToLocalDate(dateISO);

    const diffDays = (() => {
        const t = fromISOToLocalDate(todayISO);
        const ms = date.getTime() - t.getTime();
        return Math.round(ms / (1000 * 60 * 60 * 24));
    })();

    if (diffDays === 0) return "Aujourd’hui";
    if (diffDays === 1) return "Demain";

    const fmt = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "short",
    });

    return capitalizeFirst(fmt.format(date));
};
