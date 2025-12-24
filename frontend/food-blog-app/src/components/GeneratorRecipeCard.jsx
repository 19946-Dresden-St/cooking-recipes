import React from "react";
import { useNavigate } from "react-router-dom";
import { FiRefreshCw, FiLock, FiUnlock, FiMinus, FiPlus } from "react-icons/fi";
import { formatDuration } from "../utils/formatDuration";

export default function GeneratorRecipeCard({
                                                label,
                                                recipe,
                                                onRegenerate,
                                                embedded = false,

                                                // ✅ verrouillage
                                                locked = false,
                                                onToggleLock,

                                                // ✅ personnes
                                                onServingsChange,
                                                minServings = 1,
                                                maxServings = 20,
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

    const showLabel = label && label.toLowerCase() !== "brunch";

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
                        {showLabel && (
                            <div className="text-xs font-semibold text-zinc-500">{label}</div>
                        )}
                        <div className="mt-1 text-sm font-bold text-zinc-500">Aucune recette</div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            className="shrink-0 rounded-full p-2 text-zinc-200 cursor-not-allowed"
                            disabled
                            aria-label="Verrouiller (indisponible)"
                            title="Indisponible"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <FiLock />
                        </button>

                        <button
                            type="button"
                            className="shrink-0 rounded-full p-2 text-zinc-200 cursor-not-allowed"
                            disabled
                            aria-label="Regénérer (indisponible)"
                            title="Indisponible"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <FiRefreshCw />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const servingsBase = Number.isFinite(recipe?.servings) ? recipe.servings : 1;
    const servingsSelected = Number.isFinite(recipe?.selectedServings)
        ? recipe.selectedServings
        : servingsBase;

    const canDec = servingsSelected > minServings;
    const canInc = servingsSelected < maxServings;

    const handleDec = (e) => {
        e.stopPropagation();
        if (!onServingsChange) return;
        if (!canDec) return;
        onServingsChange(servingsSelected - 1);
    };

    const handleInc = (e) => {
        e.stopPropagation();
        if (!onServingsChange) return;
        if (!canInc) return;
        onServingsChange(servingsSelected + 1);
    };

    const handleOpen = () => {
        // ✅ route existante dans App.jsx : "/recipe/:id"
        navigate(`/recipe/${recipe._id}`);
    };

    return (
        <article className={baseContainer} onClick={handleOpen}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    {showLabel && (
                        <div className="text-xs font-semibold text-zinc-500">{label}</div>
                    )}
                    <div className="mt-1 text-sm font-extrabold text-zinc-900 truncate">
                        {recipe.title}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        className="shrink-0 rounded-full p-2 text-zinc-400 hover:text-zinc-900 transition"
                        aria-label={locked ? "Déverrouiller" : "Verrouiller"}
                        title={locked ? "Déverrouiller" : "Verrouiller"}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLock?.();
                        }}
                    >
                        {locked ? <FiLock /> : <FiUnlock />}
                    </button>

                    <button
                        type="button"
                        className="shrink-0 rounded-full p-2 text-zinc-400 hover:text-zinc-900 transition"
                        aria-label="Regénérer"
                        title="Regénérer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRegenerate?.();
                        }}
                    >
                        <FiRefreshCw />
                    </button>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-1 ring-1 ring-zinc-100">
                    <span>⏱️</span>
                    <span className="font-semibold">{formatDuration(recipe.time)}</span>
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-2 py-1 ring-1 ring-zinc-100">
                    <span>👤️</span>

                    <button
                        type="button"
                        onClick={handleDec}
                        disabled={!onServingsChange || !canDec}
                        aria-label="Diminuer le nombre de personnes"
                        title="Diminuer"
                        className="inline-flex items-center justify-center"
                    >
                        <FiMinus />
                    </button>

                    <span className="font-semibold">{servingsSelected}</span>
                    <span>Pers.</span>

                    <button
                        type="button"
                        onClick={handleInc}
                        disabled={!onServingsChange || !canInc}
                        aria-label="Augmenter le nombre de personnes"
                        title="Augmenter"
                        className="inline-flex items-center justify-center"
                    >
                        <FiPlus />
                    </button>
                </span>
            </div>

            <div className="mt-2 text-[11px] text-zinc-400 opacity-0 group-hover:opacity-100 transition">
                Cliquer pour ouvrir la recette
            </div>
        </article>
    );
}
