import React from "react";
import { useNavigate } from "react-router-dom";
import RecipeItems from "../components/RecipeItems.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

export default function MyRecipes() {
    usePageTitle("Qu'est-ce qu'on mange ? | Mes recettes");

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const handleAdd = () => {
        if (token) navigate("/addRecipe");
        else navigate("/");
    };

    return (
        <section className="bg-secondary py-10 md:py-14">
            <div className="container space-y-8">

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="mb-8">
                            <span className="relative inline-block">
                                Mes recettes
                                <span className="absolute left-0 -bottom-1 h-1 w-40 bg-primary/20 rounded-full" />
                            </span>
                        </h2>
                        <p className="mt-1 text-sm text-zinc-600">
                            Retrouve ici toutes les recettes que tu as partagées.
                        </p>
                    </div>

                    <button
                        onClick={handleAdd}
                        className="btn-primary"
                        type="button"
                    >
                        Ajouter une recette
                    </button>
                </div>

                <RecipeItems />
            </div>
        </section>
    );
}
