import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../apiBase.js";
import usePageTitle from "../hooks/usePageTitle.js";
import toast from "react-hot-toast";

export default function EditRecipe() {
    usePageTitle("Qu'est-ce qu'on mange ? | Modifier la recette");

    const [recipeData, setRecipeData] = React.useState({
        title: "",
        time: "",
        servings: 4,
        category: "plat",
        instructions: [], // Array<string>
        file: null,
    });

    // ✅ Ingrédients (UI)
    const [ingredientsStepReady, setIngredientsStepReady] = React.useState(false);
    const [ingredientsCount, setIngredientsCount] = React.useState(3);
    const [ingredientInputs, setIngredientInputs] = React.useState([]); // Array<string>

    // ✅ Instructions (UI)
    const [instructionsStepReady, setInstructionsStepReady] = React.useState(false);
    const [instructionsCount, setInstructionsCount] = React.useState(3);
    const [instructionInputs, setInstructionInputs] = React.useState([]); // Array<string>

    const navigate = useNavigate();
    const { id } = useParams();

    const cleanArrayStrings = React.useCallback((inputs) => {
        return inputs.map((s) => (s ?? "").trim()).filter(Boolean);
    }, []);

    const generateIngredientInputs = (count, existing = []) => {
        const safeCount = Math.max(1, Number(count) || 1);
        const next = Array.from({ length: safeCount }, (_, i) => existing[i] ?? "");
        setIngredientInputs(next);
        setIngredientsStepReady(true);
    };

    const generateInstructionInputs = (count, existing = []) => {
        const safeCount = Math.max(1, Number(count) || 1);
        const next = Array.from({ length: safeCount }, (_, i) => existing[i] ?? "");
        setInstructionInputs(next);
        setInstructionsStepReady(true);
    };

    useEffect(() => {
        const getData = async () => {
            const response = await axios.get(`${API_BASE_URL}/recipe/${id}`);
            const res = response.data;

            setRecipeData({
                title: res.title ?? "",
                category: res.category ?? "plat",
                time: res.time ?? "",
                servings: res.servings ?? 4,
                // si API renvoie string, on fallback proprement en array
                instructions: Array.isArray(res.instructions)
                    ? res.instructions
                    : typeof res.instructions === "string" && res.instructions.trim()
                        ? [res.instructions]
                        : [],
                file: null,
            });

            const existingIngredients = Array.isArray(res.ingredients) ? res.ingredients : [];
            setIngredientsCount(existingIngredients.length || 3);
            generateIngredientInputs(existingIngredients.length || 1, existingIngredients);

            const existingInstructions = Array.isArray(res.instructions)
                ? res.instructions
                : typeof res.instructions === "string" && res.instructions.trim()
                    ? [res.instructions]
                    : [];
            setInstructionsCount(existingInstructions.length || 3);
            generateInstructionInputs(existingInstructions.length || 1, existingInstructions);
        };

        getData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const onHandleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "file") {
            setRecipeData((prev) => ({ ...prev, file: files?.[0] ?? null }));
            return;
        }

        setRecipeData((prev) => ({ ...prev, [name]: value }));
    };

    // Ingrédients handlers
    const onIngredientChange = (idx, value) => {
        setIngredientInputs((prev) => {
            const next = [...prev];
            next[idx] = value;
            return next;
        });
    };

    const addIngredientInput = () => setIngredientInputs((prev) => [...prev, ""]);
    const removeIngredientInput = (idx) => {
        setIngredientInputs((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            return next.length ? next : [""];
        });
    };

    // Instructions handlers
    const onInstructionChange = (idx, value) => {
        setInstructionInputs((prev) => {
            const next = [...prev];
            next[idx] = value;
            return next;
        });
    };

    const addInstructionInput = () => setInstructionInputs((prev) => [...prev, ""]);
    const removeInstructionInput = (idx) => {
        setInstructionInputs((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            return next.length ? next : [""];
        });
    };

    const onHandleSubmit = async (e) => {
        e.preventDefault();

        const toastId = toast.loading("Enregistrement des modifications…");

        try {
            const cleanedIngredients = cleanArrayStrings(ingredientInputs);
            if (cleanedIngredients.length === 0) {
                toast.error("Ajoute au moins un ingrédient.", { id: toastId });
                return;
            }

            const cleanedInstructions = cleanArrayStrings(instructionInputs);
            if (cleanedInstructions.length === 0) {
                toast.error("Ajoute au moins une étape d’instruction.", { id: toastId });
                return;
            }

            const formData = new FormData();
            formData.append("title", recipeData.title);
            formData.append("time", recipeData.time);
            formData.append("servings", recipeData.servings);
            formData.append("category", recipeData.category);

            cleanedIngredients.forEach((ing) => formData.append("ingredients", ing));
            cleanedInstructions.forEach((step) => formData.append("instructions", step));

            if (recipeData.file) {
                formData.append("file", recipeData.file);
            }

            await axios.put(`${API_BASE_URL}/recipe/${id}`, formData, {
                headers: {
                    authorization: "bearer " + localStorage.getItem("token"),
                },
            });

            toast.success("Recette modifiée avec succès !", { id: toastId });
            navigate("/myRecipe");
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Une erreur est survenue lors de la modification.",
                { id: toastId }
            );
        }
    };

    return (
        <section className="bg-secondary py-10 md:py-14">
            <div className="container">
                <h2 className="mb-10">
          <span className="relative inline-block">
            Modifier la recette
            <span className="absolute left-0 -bottom-1 h-1 w-44 rounded-full bg-primary/20" />
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
                                    className="input"
                                    name="title"
                                    onChange={onHandleChange}
                                    value={recipeData.title}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-800">Catégorie</label>
                                <select
                                    name="category"
                                    className="input"
                                    onChange={onHandleChange}
                                    value={recipeData.category}
                                >
                                    <option value="apero">Apéro</option>
                                    <option value="entree">Entrée</option>
                                    <option value="plat">Plat</option>
                                    <option value="sauce">Sauce</option>
                                    <option value="dessert">Dessert</option>
                                    <option value="boisson">Boisson</option>
                                    <option value="brunch">Brunch</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-800">Temps (en minutes)</label>
                                <input
                                    type="number"
                                    className="input"
                                    name="time"
                                    onChange={onHandleChange}
                                    value={recipeData.time}
                                    min={1}
                                    step={1}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-800">Nombre de personnes</label>
                                <input
                                    type="number"
                                    className="input"
                                    name="servings"
                                    onChange={onHandleChange}
                                    value={recipeData.servings}
                                    min={1}
                                    step={1}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-800">
                                    Nouvelle illustration (optionnel)
                                </label>
                                <input
                                    type="file"
                                    name="file"
                                    onChange={onHandleChange}
                                    accept="image/*"
                                    className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-semibold file:text-primary hover:file:opacity-90 cursor-pointer"
                                />
                                <p className="text-xs text-zinc-500">Si tu ne choisis rien, l’image actuelle reste.</p>
                            </div>
                        </div>

                        {/* INGRÉDIENTS */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 space-y-4">
                            <h2 className="text-primary text-xl font-extrabold">Ingrédients</h2>

                            {!ingredientsStepReady ? (
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-zinc-800">Combien d’ingrédients ?</label>
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
                                            }}
                                            className="text-xs font-semibold text-primary hover:opacity-80"
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

                                    <button type="button" onClick={addIngredientInput} className="btn-secondary-sm w-full">
                                        + Ajouter un ingrédient
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* INSTRUCTIONS */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 space-y-4">
                            <h2 className="text-primary text-xl font-extrabold">Instructions</h2>

                            {!instructionsStepReady ? (
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-zinc-800">Combien d’étapes ?</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            className="input"
                                            min={1}
                                            step={1}
                                            value={instructionsCount}
                                            onChange={(e) => setInstructionsCount(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => generateInstructionInputs(instructionsCount)}
                                            className="btn-primary-sm whitespace-nowrap"
                                        >
                                            Générer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs text-zinc-500">Une étape par bloc.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setInstructionsStepReady(false);
                                                setInstructionInputs([]);
                                            }}
                                            className="text-xs font-semibold text-primary hover:opacity-80"
                                        >
                                            Reconfigurer
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {instructionInputs.map((val, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-zinc-800">Étape {idx + 1}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeInstructionInput(idx)}
                                                        className="rounded-full px-3 py-2 text-zinc-500 hover:bg-secondary"
                                                        aria-label="Supprimer l’étape"
                                                        title="Supprimer"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>

                                                <textarea
                                                    name={`instruction-${idx}`}
                                                    rows="5"
                                                    onChange={(e) => onInstructionChange(idx, e.target.value)}
                                                    value={val}
                                                    placeholder={
                                                        idx === 0
                                                            ? "Ex : Préchauffe le four à 180°C…"
                                                            : "Ex : Ajoute le beurre fondu puis mélange…"
                                                    }
                                                    className="textarea"
                                                    required={idx === 0}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <button type="button" onClick={addInstructionInput} className="btn-secondary-sm w-full">
                                        + Ajouter une étape
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full btn-primary"
                        disabled={!ingredientsStepReady || !instructionsStepReady}
                        title={
                            !ingredientsStepReady || !instructionsStepReady
                                ? "Commence par générer les champs ingrédients et instructions"
                                : undefined
                        }
                    >
                        Enregistrer les modifications
                    </button>
                </form>
            </div>
        </section>
    );
}
