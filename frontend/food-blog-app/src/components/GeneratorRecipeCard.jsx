import React from "react";
import { useNavigate } from "react-router-dom";
import { FiRefreshCw, FiLock, FiUnlock } from "react-icons/fi";
import { formatDuration } from "../utils/formatDuration";

export default function GeneratorRecipeCard({
                                                label,
                                                recipe,
                                                onRegenerate,
                                                embedded = false,

                                                // ✅ verrouillage
                                                locked = false,
                                                onToggleLock,
                                            }) {
    const navigate = useNavigate();

    const baseContainer = embedded
        ? [
            "group relative bg-white",
            "cursor-pointer transition",
            "px-4 pb-2 pt-5",
            "hover:bg-secondary/40",
        ].join(" ")
        : [
            "group relative rounded-2xl bg-white ring-1 ring-zinc-200 pb-2 pt-5",
            "cursor-pointer transition duration-300",
            "hover:shadow-sm hover:-translate-y-0.5",
        ].join(" ");

    // 👉 On masque le label uniquement pour Brunch
    const showLabel = label && label.toLowerCase() !== "brunch";

    // empty state
    if (!recipe) {
        return (
            <div
                className={
                    embedded
                        ? "relative bg-white px-4 py-3"
                        : "relative rounded-2xl bg-secondary ring-1 ring-zinc-200 p-4"
                }
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        {showLabel && <div className="text-xs font-semibold text-zinc-500">{label}</div>}
                        <div className="mt-1 text-sm font-bold text-zinc-500">Aucune recette</div>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* lock (désactivé si pas de recette) */}
                        <button
                            type="button"
                            className={
                                embedded
                                    ? "shrink-0 rounded-full p-2 text-zinc-200 cursor-not-allowed"
                                    : "shrink-0 rounded-full p-2 text-zinc-200 cursor-not-allowed"
                            }
                            disabled
                            aria-label="Verrouiller (indisponible)"
                            title="Verrouiller (indisponible)"
                        >
                            <FiLock />
                        </button>

                        <button
                            type="button"
                            className={
                                embedded
                                    ? "shrink-0 rounded-full p-2 text-zinc-400 hover:text-primary hover:bg-white/70 transition"
                                    : "shrink-0 rounded-full p-2 text-zinc-400 hover:text-primary hover:bg-secondary-accent transition"
                            }
                            onClick={onRegenerate}
                            aria-label="Regénérer"
                            title="Regénérer"
                        >
                            <FiRefreshCw />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleOpen = () => {
        navigate(`/recipe/${recipe._id}`);
    };

    return (
        <article className={baseContainer} onClick={handleOpen}>
            {/* actions */}
            <div className="absolute right-3 top-3 flex items-center gap-1">
                {/* lock/unlock */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLock?.();
                    }}
                    className={[
                        "shrink-0 rounded-full p-2",
                        locked ? "text-primary" : "text-zinc-400 hover:text-primary",
                        "opacity-0 group-hover:opacity-100 transition duration-600",
                        embedded ? "hover:bg-white/70" : "ring-1 ring-zinc-200 bg-white hover:bg-secondary/30",
                    ].join(" ")}
                    aria-label={locked ? "Déverrouiller la recette" : "Verrouiller la recette"}
                    title={locked ? "Déverrouiller" : "Verrouiller"}
                >
                    {locked ? <FiLock /> : <FiUnlock />}
                </button>

                {/* regenerate (désactivé si locked) */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!locked) onRegenerate?.();
                    }}
                    className={[
                        "shrink-0 rounded-full p-2",
                        locked
                            ? "text-zinc-200 cursor-not-allowed"
                            : "text-zinc-400 hover:text-primary",
                        "opacity-0 group-hover:opacity-100 transition duration-600",
                        embedded ? "hover:bg-white/70" : "ring-1 ring-zinc-200 bg-white hover:bg-secondary/30",
                    ].join(" ")}
                    aria-label="Regénérer la recette"
                    title={locked ? "Recette verrouillée" : "Regénérer"}
                    disabled={locked}
                >
                    <FiRefreshCw />
                </button>
            </div>

            {/* header : label (sauf brunch) */}
            {showLabel && (
                <div className="flex items-center gap-2 pr-16">
          <span className="text-[11px] uppercase font-semibold tracking-wide text-zinc-500">
            {label}
          </span>
                    {locked && (
                        <span className="text-[11px] font-semibold text-primary/80">Verrouillée</span>
                    )}
                </div>
            )}

            {/* titre */}
            <h4 className="mt-2 text-primary font-extrabold leading-snug line-clamp-2 pr-16">
                {recipe.title}
            </h4>

            {/* infos */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-1 ring-1 ring-zinc-100">
          <span>⏱️</span>
          <span className="font-semibold text-primary">{formatDuration(recipe.time)}</span>
        </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-1 ring-1 ring-zinc-100">
          <span>🥕</span>
          <span className="font-semibold">
            {Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0}
          </span>
          <span>Ingr.</span>
        </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-1 ring-1 ring-zinc-100">
          <span>👤️</span>
          <span className="font-semibold">{recipe.servings}</span>
          <span>Pers.</span>
        </span>
            </div>

            {/* hint */}
            <div className="mt-2 text-[11px] text-zinc-400 opacity-0 group-hover:opacity-100 transition">
                Cliquer pour ouvrir la recette
            </div>
        </article>
    );
}
