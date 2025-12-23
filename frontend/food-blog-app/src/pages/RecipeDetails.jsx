import React from "react";
import { useLoaderData } from "react-router-dom";
import { API_BASE_URL } from "../apiBase.js";
import usePageTitle from "../hooks/usePageTitle.js";
import { getCategoryLabel } from "../utils/categories.js";

export default function RecipeDetails() {
    const recipe = useLoaderData();
    usePageTitle(`Qu'est-ce qu'on mange ? | ${recipe?.title ?? "Recipe"}`);

    const categoryValue = recipe?.category ?? "plat";
    const categoryLabel = getCategoryLabel(categoryValue);

    const normalizedInstructions = React.useMemo(() => {
        const raw = recipe?.instructions;
        if (Array.isArray(raw)) return raw.filter(Boolean);
        if (typeof raw === "string") {
            return raw
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean);
        }
        return [];
    }, [recipe]);

    return (
        <section className="bg-secondary py-10 md:py-14">
            <div className="mx-auto max-w-4xl px-4">
                {/* Header */}
                <div className="flex flex-col gap-3">
                    <div>
                        <p className="text-sm text-zinc-600">
                            Postée par{" "}
                            <span className="font-semibold text-primary">
                                {recipe?.username ?? "Anonyme"}
                            </span>
                        </p>

                        <h1 className="mt-2 text-primary">
                            {recipe?.title ?? "Recette"}
                        </h1>

                        {/* ✅ Badges sous le titre */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-200">
                                <span>{categoryLabel}</span>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-200">
                                <span aria-hidden>⏱</span>
                                <span>{recipe?.time ?? "—"} Mins</span>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-200">
                                <span aria-hidden>👤</span>
                                <span>
                                    {recipe?.servings ? `${recipe.servings} Pers.` : "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
                    <img
                        src={recipe?.coverImage?.startsWith("http") ? recipe.coverImage : `${API_BASE_URL}/images/${recipe?.coverImage}`}
                        alt={recipe?.title ?? "Recipe"}
                        className="h-64 w-full object-cover md:h-80"
                        loading="lazy"
                    />
                </div>

                <div className="mt-8 grid gap-6 items-start md:grid-cols-[1fr_2fr]">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                        <h2 className="text-primary text-xl font-extrabold">
                            Ingrédients
                        </h2>

                        <ul className="mt-4 space-y-2 text-zinc-800">
                            {(recipe?.ingredients ?? []).map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                        <h2 className="text-primary text-xl font-extrabold">
                            Instructions
                        </h2>

                        {normalizedInstructions.length === 0 ? (
                            <p className="mt-4 leading-relaxed text-zinc-800">
                                Aucune instruction.
                            </p>
                        ) : (
                            <ol className="mt-4 space-y-3 text-zinc-800">
                                {normalizedInstructions.map((step, idx) => (
                                    <li key={idx} className="flex gap-3">
                                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary ring-1 ring-zinc-200">
                                            {idx + 1}
                                        </span>
                                        <p className="leading-relaxed whitespace-pre-line">{step}</p>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
