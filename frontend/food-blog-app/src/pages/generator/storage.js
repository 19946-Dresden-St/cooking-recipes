export const safeGetLS = (key) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

export const safeSetLS = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch {
        // ignore
    }
};

export const safeJsonParse = (raw) => {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};
