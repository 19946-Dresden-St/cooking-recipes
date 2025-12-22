import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../apiBase.js";
import usePageTitle from "../hooks/usePageTitle.js";
import toast from "react-hot-toast";

export default function AddFoodRecipe() {
    usePageTitle("Qu'est-ce qu'on mange ? | Ajouter une recette");

    const navigate = useNavigate();

    // ✅ Données recette (API)
    const [recipeData, setRecipeData] = React.useState({
        title: "",
        category: "plat",
        time: "",
        servings: 4,
        instructions: "",
        ingredients: [], // Array<string>
        file: null,
    });

    // ✅ Ingrédients (UI)
    const [ingredientsStepReady, setIngredientsStepReady] = React.useState(false);
    const [ingredientsCount, setIngredientsCount] = React.useState(3);
    const [ingredientInputs, setIngredientInputs] = React.useState([]); // Array<string>

    const generateIngredientInputs = (count) => {
        const safeCount = Math.max(1, Number(count) || 1);
        setIngredientInputs(Array.from({ length: safeCount }, () => ""));
        setIngredientsStepReady(true);
    };

    const syncIngredientsToRecipeData = React.useCallback((inputs) => {
        const cleaned = inputs.map((s) => (s ?? "").trim()).filter(Boolean);
        setRecipeData((prev) => ({ ...prev, ingredients: cleaned }));
    }, []);

    const onHandleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "file") {
            setRecipeData((prev) => ({ ...prev, file: files?.[0] ?? null }));
            return;
        }

        setRecipeData((prev) => ({ ...prev, [name]: value }));
    };

    const onIngredientChange = (idx, value) => {
        setIngredientInputs((prev) => {
            const next = [...prev];
            next[idx] = value;
            syncIngredientsToRecipeData(next);
            return next;
        });
    };

    const addIngredientInput = () => {
        setIngredientInputs((prev) => {
            const next = [...prev, ""];
            // Pas besoin de sync ici ("" ignoré)
            return next;
        });
    };

    const removeIngredientInput = (idx) => {
        setIngredientInputs((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            syncIngredientsToRecipeData(next);
            return next.length ? next : [""];
        });
    };

    const onHandleSubmit = async (e) => {
        e.preventDefault();

        const toastId = toast.loading("Ajout de la recette…");

        try {
            // ✅ Validation ingrédients : au moins 1 non vide
            const cleanedIngredients = ingredientInputs
                .map((s) => (s ?? "").trim())
                .filter(Boolean);

            if (cleanedIngredients.length === 0) {
                toast.error("Ajoute au moins un ingrédient.", { id: toastId });
                return;
            }

            const formData = new FormData();
            formData.append("title", recipeData.title);
            formData.append("category", recipeData.category);
            formData.append("time", recipeData.time);
            formData.append("servings", recipeData.servings);
            formData.append("instructions", recipeData.instructions);

            cleanedIngredients.forEach((ing) => formData.append("ingredients", ing));

            if (recipeData.file) {
                formData.append("file", recipeData.file);
            }

            await axios.post(`${API_BASE_URL}/recipe`, formData, {
                headers: {
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
                        {/* INFOS */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 space-y-5">
                            <h2 className="text-primary text-xl font-extrabold">Infos</h2>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-800">Nom</label>
                                <input
                                    type="text"
                                    name="title"
                                    onChange={onHandleChange}
                                    value={recipeData.title}
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
                                    value={recipeData.category}
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
                                    value={recipeData.time}
                                    placeholder="Ex : 20"
                                    className="input"
                                    min={1}
                                    step={1}
                                    required
                                />
                            </div>

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
                                <label className="text-sm font-semibold text-zinc-800">Illustration</label>
                                <input
                                    type="file"
                                    name="file"
                                    onChange={onHandleChange}
                                    accept="image/*"
                                    className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-semibold file:text-primary hover:file:opacity-90 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* INGRÉDIENTS */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 space-y-4">
                            <h2 className="text-primary text-xl font-extrabold">Ingrédients</h2>

                            {!ingredientsStepReady ? (
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-zinc-800">
                                        Combien d’ingrédients ?
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            className="input"
                                            min={1}
                                            step={1}
                                            value={ingredientsCount}
                                            onChange={(e) => setIngredientsCount(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => generateIngredientInputs(ingredientsCount)}
                                            className="btn-primary-sm whitespace-nowrap"
                                        >
                                            Générer
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        Ensuite, tu peux en ajouter d’autres si besoin.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs text-zinc-500">Un ingrédient par ligne.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIngredientsStepReady(false);
                                                setIngredientInputs([]);
                                                setRecipeData((p) => ({ ...p, ingredients: [] }));
                                            }}
                                            className="text-xs font-semibold text-primary hover:opacity-80 hover:cursor-pointer"
                                        >
                                            Reconfigurer
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {ingredientInputs.map((val, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder={idx === 0 ? "Ex : 1 œuf" : "Ex : 100g de farine"}
                                                    value={val}
                                                    onChange={(e) => onIngredientChange(idx, e.target.value)}
                                                    required={idx === 0}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeIngredientInput(idx)}
                                                    className="rounded-full px-3 py-2 text-zinc-500 hover:bg-secondary"
                                                    aria-label="Supprimer l’ingrédient"
                                                    title="Supprimer"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addIngredientInput}
                                        className="btn-secondary-sm w-full"
                                    >
                                        + Ajouter un ingrédient
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* INSTRUCTIONS */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 space-y-4">
                            <h2 className="text-primary text-xl font-extrabold">Instructions</h2>

                            <textarea
                                name="instructions"
                                rows="12"
                                onChange={onHandleChange}
                                value={recipeData.instructions}
                                placeholder="Explique les étapes clairement"
                                className="textarea"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full btn-primary"
                        disabled={!ingredientsStepReady}
                        title={!ingredientsStepReady ? "Commence par générer les champs ingrédients" : undefined}
                    >
                        Ajouter la recette
                    </button>
                </form>
            </div>
        </section>
    );
}
