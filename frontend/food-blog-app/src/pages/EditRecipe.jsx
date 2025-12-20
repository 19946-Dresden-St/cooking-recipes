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
        ingredients: "",
        instructions: "",
        file: null,
    });

    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const getData = async () => {
            await axios.get(`${API_BASE_URL}/recipe/${id}`).then((response) => {
                const res = response.data;
                setRecipeData({
                    title: res.title ?? "",
                    ingredients: (res.ingredients ?? []).join(", "),
                    instructions: res.instructions ?? "",
                    time: res.time ?? "",
                    file: null,
                });
            });
        };
        getData();
    }, [id]);

    const onHandleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "file") {
            setRecipeData((pre) => ({ ...pre, file: files?.[0] ?? null }));
            return;
        }

        setRecipeData((pre) => ({ ...pre, [name]: value }));
    };

    const onHandleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...recipeData,
            ingredients: recipeData.ingredients
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
        };

        await axios
            .put(`${API_BASE_URL}/recipe/${id}`, payload, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    authorization: "bearer " + localStorage.getItem("token"),
                },
            })
            toast.success("Recette modifiée avec succès !");
            navigate("/myRecipe");
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

                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 space-y-5">
                            <h2 className="text-primary text-xl font-extrabold">Infos</h2>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-800">
                                    Nom
                                </label>
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
                                <label className="text-sm font-semibold text-zinc-800">
                                    Temps (en minutes)
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    name="time"
                                    onChange={onHandleChange}
                                    value={recipeData.time}
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
                                <p className="text-xs text-zinc-500">
                                    Si tu ne choisis rien, l’image actuelle reste.
                                </p>
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
                                value={recipeData.ingredients}
                                placeholder="Sépare les ingrédients par des virgules"
                                className="textarea"
                                required
                            />

                            <p className="text-xs text-zinc-500">
                                Exemple :{" "}
                                <span className="font-semibold">pâtes, crème, parmesan</span>
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
                    >
                        Enregistrer les modifications
                    </button>
                </form>
            </div>
        </section>
    );
}
