import React, { useEffect, useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { BsFillStopwatchFill } from "react-icons/bs";
import { FaListAlt } from "react-icons/fa";
import { PiPersonArmsSpreadFill } from "react-icons/pi";
import { FaHeart } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import axios from "axios";
import { API_BASE_URL } from "../apiBase.js";
import placeholderImg from "../assets/heroSection.jpg";
import { motion } from "framer-motion";

export default function RecipeItems() {
    const recipes = useLoaderData();
    const [allRecipes, setAllRecipes] = useState();
    const path = window.location.pathname === "/myRecipe";
    let favItems = JSON.parse(localStorage.getItem("fav")) ?? [];
    const [isFavRecipe, setIsFavRecipe] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setAllRecipes(recipes);
    }, [recipes]);

    const onDelete = async (id) => {
        await axios
            .delete(`${API_BASE_URL}/recipe/${id}`)
            .then((res) => console.log(res));
        setAllRecipes((recipes) => recipes.filter((recipe) => recipe._id !== id));
        let filteredItems = favItems.filter((recipe) => recipe._id !== id);
        localStorage.setItem("fav", JSON.stringify(filteredItems));
    };

    const favRecipe = (item) => {
        let filteredItems = favItems.filter((recipe) => recipe._id !== item._id);
        favItems =
            favItems.filter((recipe) => recipe._id === item._id).length === 0
                ? [...favItems, item]
                : filteredItems;
        localStorage.setItem("fav", JSON.stringify(favItems));
        setIsFavRecipe((pre) => !pre);
    };

    // ✅ Helpers pour badge dynamique
    const getCategoryLabel = (category) => {
        const map = {
            apero: "Apéro",
            entree: "Entrée",
            plat: "Plat",
            dessert: "Dessert",
            boisson: "Boisson",
            brunch: "Brunch",
        };
        return map[category] ?? "Plat";
    };

    const getBadgeClass = (category) => {
        const safe = (category || "entree").toLowerCase().trim();
        return `badge-${safe}`;
    };

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allRecipes?.map((item) => {
                const isFav = favItems.some((res) => res._id === item._id);

                const categoryValue = item?.category ?? "entree";
                const categoryLabel = getCategoryLabel(categoryValue);
                const badgeClass = getBadgeClass(categoryValue);

                return (
                    <article
                        key={item._id}
                        onClick={() => navigate(`/recipe/${item._id}`)}
                        className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition duration-300"
                    >
                        <div className="relative">
                            <img
                                src={`${API_BASE_URL}/images/${item.coverImage}`}
                                alt={item.title}
                                onError={(e) => {
                                    e.currentTarget.src = placeholderImg;
                                }}
                                className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                            />

                            {!path && (
                                <motion.button
                                    whileTap={{ scale: 1.2 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        favRecipe(item);
                                    }}
                                    className="absolute top-3 right-3 rounded-full bg-white/90 p-2 shadow-md transition"
                                >
                                    <FaHeart
                                        className={`text-lg ${
                                            isFav ? "text-primary" : "text-zinc-400"
                                        }`}
                                    />
                                </motion.button>
                            )}
                        </div>

                        <div className="p-4 space-y-3">
                            <h3 className="text-primary text-lg font-extrabold truncate">
                                {item.title}
                            </h3>

                            <div className="h-px w-full bg-zinc-100" />

                            <div className="flex items-center justify-between">

                                <span className={badgeClass}>{categoryLabel}</span>

                                <div className="flex items-start gap-8 text-sm text-zinc-500">
                                    <div className="flex flex-col items-start leading-tight gap-1">
                                        <div className="flex items-center gap-1">
                                            <BsFillStopwatchFill />
                                            <span className="font-semibold text-primary">
                                                {item.time}
                                            </span>
                                        </div>
                                        <span className="text-xs text-zinc-400">Minutes</span>
                                    </div>

                                    <div className="flex flex-col items-start leading-tight gap-1">
                                        <div className="flex items-center gap-1">
                                            <FaListAlt />
                                            <span className="font-semibold text-primary">5</span>
                                        </div>
                                        <span className="text-xs text-zinc-400">Ingrédients</span>
                                    </div>

                                    <div className="flex flex-col items-start leading-tight gap-1">
                                        <div className="flex items-center gap-1">
                                            <PiPersonArmsSpreadFill />
                                            <span className="font-semibold text-primary">4</span>
                                        </div>
                                        <span className="text-xs text-zinc-400">Personnes</span>
                                    </div>
                                </div>
                            </div>

                            {path && (
                                <div className="flex justify-end gap-2 pt-2">
                                    <Link
                                        to={`/editRecipe/${item._id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded-full p-2 text-zinc-500 transition hover:bg-secondary hover:text-zinc-800"
                                        aria-label="Éditer"
                                        title="Éditer"
                                    >
                                        <FaEdit />
                                    </Link>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(item._id);
                                        }}
                                        className="rounded-full p-2 text-zinc-500 transition hover:bg-secondary hover:text-zinc-800"
                                        aria-label="Supprimer"
                                        title="Supprimer"
                                    >
                                        <MdDelete />
                                    </button>
                                </div>
                            )}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
