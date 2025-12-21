import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../apiBase.js";
import usePageTitle from "../hooks/usePageTitle.js";
import toast from "react-hot-toast";

export default function AddFoodRecipe() {
    usePageTitle("Qu'est-ce qu'on mange ? | Ajouter une recette");

    const [recipeData, setRecipeData] = React.useState({
        category: "plat",
        servings: 4, // ✅ default
    });

    const navigate = useNavigate();

    const onHandleChange = (e) => {
        const val =
            e.target.name === "ingredients"
                ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                : e.target.name === "file"
                    ? e.target.files[0]
                    : e.target.value;

        setRecipeData((pre) => ({ ...pre, [e.target.name]: val }));
    };

    const onHandleSubmit = async (e) => {
        e.preventDefault();

        const toastId = toast.loading("Ajout de la recette…");

        try {
            await axios.post(`${API_BASE_URL}/recipe`, recipeData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    authorization: "bearer " + localStorage.getItem("token"),
                },
            });

            toast.success("Recette ajoutée avec succès !", { id: toastId });
            navigate("/myRecipe");
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                "Une erreur est survenue lors de l’ajout de la recette.",
                { id: toastId }
            );
        }
    };

    return (
        <section className="bg-secondary py-10 md:py-14">
            <div className="mx-auto container">
                <h2 className="mb-10">
                    <span className="relative inline-block">
                        Ajouter une recette
                        <span className="absolute left-0 -bottom-1 h-1 w-40 bg-primary/20 rounded-full" />
                    </span>
                </h2>

                <form onSubmit={onHandleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 space-y-5">
                            <h2 className="text-primary text-xl font-extrabold">
                                Infos
                            </h2>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-800">
                                    Nom
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    onChange={onHandleChange}
                                    placeholder="Ex : Pâtes carbo express"
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-800">Catégorie</label>
                                <select
                                    name="category"
                                    onChange={onHandleChange}
                                    className="input"
                                    defaultValue="plat"
                                >
                                    <option value="apero">Apéro</option>
                                    <option value="entree">Entrée</option>
                                    <option value="plat">Plat</option>
                                    <option value="dessert">Dessert</option>
                                    <option value="boisson">Boisson</option>
                                    <option value="brunch">Brunch</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-800">
                                    Temps (en minutes)
                                </label>
                                <input
                                    type="number"
                                    name="time"
                                    onChange={onHandleChange}
                                    placeholder="Ex : 20"
                                    className="input"
                                    min={1}
                                    step={1}
                                    required
                                />
                            </div>

                            {/* ✅ NOUVEAU : personnes */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-800">
                                    Nombre de personnes
                                </label>
                                <input
                                    type="number"
                                    name="servings"
                                    onChange={onHandleChange}
                                    className="input"
                                    min={1}
                                    step={1}
                                    value={recipeData.servings}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-800">
                                    Illustration
                                </label>
                                <input
                                    type="file"
                                    name="file"
                                    onChange={onHandleChange}
                                    accept="image/*"
                                    className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-semibold file:text-primary hover:file:opacity-90 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 space-y-4">
                            <h2 className="text-primary text-xl font-extrabold">
                                Ingrédients
                            </h2>

                            <textarea
                                name="ingredients"
                                rows="12"
                                onChange={onHandleChange}
                                placeholder="Sépare les ingrédients par des virgules"
                                className="textarea"
                                required
                            />

                            <p className="text-xs text-zinc-500">
                                Exemple : <span className="font-semibold">pâtes, crème, parmesan</span>
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 space-y-4">
                            <h2 className="text-primary text-xl font-extrabold">
                                Instructions
                            </h2>

                            <textarea
                                name="instructions"
                                rows="12"
                                onChange={onHandleChange}
                                placeholder="Explique les étapes clairement"
                                className="textarea"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary">
                        Ajouter la recette
                    </button>
                </form>
            </div>
        </section>
    );
}
