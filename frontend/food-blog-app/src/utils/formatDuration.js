export const formatDuration = (value) => {
    const total = Number(value);

    if (!Number.isFinite(total) || total < 0) return "—";

    const minutes = Math.round(total);

    if (minutes < 60) return `${minutes} Mins`;

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    if (remaining === 0) return `${hours} h`;

    return `${hours}h${remaining}`;
};
