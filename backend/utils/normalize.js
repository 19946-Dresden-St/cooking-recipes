/**
 * Normalise un input en tableau de strings (trim + filtre les vides)
 * - undefined/null -> []
 * - string -> [string]
 * - array -> array
 */
const normalizeStringArray = (value) => {
    if (value === undefined || value === null) return [];
    const arr = Array.isArray(value) ? value : [value];
    return arr.map((v) => (v ?? "").toString().trim()).filter(Boolean);
};

module.exports = {
    normalizeStringArray,
};
