import React from "react";
import { useNavigate } from "react-router-dom";
import { FiRefreshCw } from "react-icons/fi";
import { getBadgeClass, getCategoryLabel } from "../utils/categories";

export default function GeneratorRecipeCard({ label, recipe, onRegenerate }) {
    const navigate = useNavigate();

    if (!recipe) {
        return (
            <div className="rounded-xl bg-secondary ring-1 ring-zinc-200 p-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-600">{label}</div>
                        <div className="text-sm font-bold text-zinc-500">Aucune recette</div>
                    </div>
                    <button
                        className="rounded-full p-2 hover:bg-secondary-accent transition"
                        onClick={onRegenerate}
                        aria-label="Regénérer"
                        title="Regénérer"
                    >
                        <FiRefreshCw className="text-primary" />
                    </button>
                </div>
            </div>
        );
    }

    const categoryValue = (recipe?.category ?? "plat").toString();
    const badgeClass = getBadgeClass(categoryValue);
    const categoryLabel = getCategoryLabel(categoryValue);

    return (
        <article
            onClick={() => navigate(`/recipe/${recipe._id}`)}
            className="group rounded-xl bg-white ring-1 ring-zinc-200 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer transition duration-300 p-3"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500">{label}</span>
                        <span className={badgeClass}>{categoryLabel}</span>
                    </div>

                    <h4 className="mt-1 text-primary font-extrabold truncate">
                        {recipe.title}
                    </h4>

                    <div className="mt-1 text-xs text-zinc-500 flex items-center gap-2">
                        <span>⏱️</span>
                        <span className="font-semibold text-primary">{recipe.time}</span>
                        <span>min</span>
                        <span className="text-zinc-300">•</span>
                        <span className="truncate">
                            {Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0} ingr.
                        </span>
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRegenerate();
                    }}
                    className="shrink-0 rounded-full bg-secondary p-2 ring-1 ring-zinc-200 hover:bg-secondary-accent transition"
                    aria-label="Regénérer la recette"
                    title="Regénérer"
                >
                    <FiRefreshCw className="text-primary" />
                </button>
            </div>
        </article>
    );
}
