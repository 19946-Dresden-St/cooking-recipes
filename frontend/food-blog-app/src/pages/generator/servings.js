import { clampNumber } from "./slots";

/**
 * On conserve `recipe.servings` (valeur “base” venant de l’API),
 * et on stocke le choix utilisateur dans `recipe.selectedServings`.
 * ShoppingList.jsx calcule ensuite: multiplier = selectedServings / servings.
 */
export const normalizeRecipeSelectedServings = (recipe) => {
    if (!recipe || typeof recipe !== "object") return recipe;

    const base =
        Number.isFinite(Number(recipe.servings)) && Number(recipe.servings) > 0
            ? Number(recipe.servings)
            : 1;

    const selected =
        Number.isFinite(Number(recipe.selectedServings)) &&
        Number(recipe.selectedServings) > 0
            ? Number(recipe.selectedServings)
            : base;

    if (recipe.selectedServings === selected) return recipe;

    return {
        ...recipe,
        selectedServings: selected,
    };
};

export const clampSelectedServingsWithBase = (recipe, nextServings) => {
    const base =
        Number.isFinite(Number(recipe?.servings)) && Number(recipe.servings) > 0
            ? Number(recipe.servings)
            : 1;
    return clampNumber(nextServings, 1, 99, base);
};
