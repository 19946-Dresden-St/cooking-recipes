import React from "react";
import profileImg from "../assets/profile.png";
import { useLoaderData } from "react-router-dom";
import { API_BASE_URL } from "../apiBase.js";
import usePageTitle from "../hooks/usePageTitle.js";

export default function RecipeDetails() {
    const recipe = useLoaderData();
    usePageTitle(`Qu'est-ce qu'on mange ? | ${recipe?.title ?? "Recipe"}`);

    return (
        <section className="bg-secondary py-10 md:py-14">
            <div className="mx-auto max-w-4xl px-4">
                {/* Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm text-zinc-600">
                            Postée par{" "}
                            <span className="font-semibold text-primary">
                                {recipe?.email ?? "Anonyme"}
                            </span>
                        </p>

                        <h1 className="mt-2 text-primary">
                            {recipe?.title ?? "Recette"}
                        </h1>
                    </div>

                    {/* Temps de préparation */}
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-200">
                        <span aria-hidden>⏱</span>
                        <span>{recipe?.time ?? "—"}</span>
                    </div>
                </div>


                {/* Image */}
                <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
                    <img
                        src={`${API_BASE_URL}/images/${recipe?.coverImage}`}
                        alt={recipe?.title ?? "Recipe"}
                        className="h-64 w-full object-cover md:h-80"
                        loading="lazy"
                    />
                </div>

                {/* Content grid */}
                <div className="mt-8 grid gap-6 items-start md:grid-cols-[1fr_2fr]">
                    {/* Ingredients */}
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

                    {/* Instructions */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                        <h2 className="text-primary text-xl font-extrabold">
                            Instructions
                        </h2>

                        <p className="mt-4 whitespace-pre-line leading-relaxed text-zinc-800">
                            {recipe?.instructions ?? "Aucune instruction."}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
