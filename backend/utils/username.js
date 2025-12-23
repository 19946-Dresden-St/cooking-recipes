/**
 * Username helpers
 * - normalizeUsername: string trim (et conversion safe)
 * - escapeRegex: protège une string pour l'injecter dans un RegExp
 */

const normalizeUsername = (value) =>
    String(value ?? "").trim();

const escapeRegex = (value) =>
    String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = {
    normalizeUsername,
    escapeRegex,
};
