import axios from "axios";
import { API_BASE_URL } from "../../apiBase";
import { DEFAULT_CATEGORY } from "./constants";
import { buildExcludeParam } from "./slots";
import { normalizeRecipeSelectedServings } from "./servings";

export async function fetchRandomRecipes({ count, excludeIds = [], category }) {
    const params = new URLSearchParams();
    params.set("count", String(count));
    params.set("category", String(category || DEFAULT_CATEGORY));

    if (excludeIds.length > 0) {
        params.set("exclude", buildExcludeParam(excludeIds));
    }

    const url = `${API_BASE_URL}/recipe/random?${params.toString()}`;
    const res = await axios.get(url);

    const arr = Array.isArray(res.data) ? res.data : [];
    return arr.map((r) => normalizeRecipeSelectedServings(r));
}

/**
 * Récupère `count` recettes en essayant d’éviter les doublons via `excludeIds`,
 * puis fallback sans exclude si l’API ne retourne pas assez de résultats.
 */
export async function pickRecipesWithRetries({
                                                 count,
                                                 excludeIds = [],
                                                 category,
                                                 maxRounds = 5,
                                             }) {
    let picked = [];
    let localExclude = [...excludeIds];

    for (let round = 0; round < maxRounds && picked.length < count; round++) {
        const batch = await fetchRandomRecipes({
            count: count - picked.length,
            excludeIds: localExclude,
            category,
        });

        if (batch.length === 0) break;

        picked = [...picked, ...batch];
        localExclude = [
            ...localExclude,
            ...batch.map((r) => r?._id).filter(Boolean),
        ];
    }

    while (picked.length < count) {
        const batch = await fetchRandomRecipes({
            count: count - picked.length,
            excludeIds: [],
            category,
        });

        if (batch.length === 0) break;
        picked = [...picked, ...batch];
    }

    return picked;
}
