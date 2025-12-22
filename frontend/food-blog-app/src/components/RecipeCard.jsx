import React from "react";
import { Link } from "react-router-dom";
import { BsFillStopwatchFill } from "react-icons/bs";
import { FaHeart } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { FaAppleAlt } from "react-icons/fa";
import { BiRestaurant } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../apiBase";
import placeholderImg from "../assets/heroSection.jpg";
import { getBadgeClass, getCategoryLabel } from "../utils/categories";

export default function RecipeCard({item, path, isFav, onToggleFav, onRequestDelete, onOpen}) {
    const categoryValue = item?.category ?? "entree";
    const categoryLabel = getCategoryLabel(categoryValue);
    const badgeClass = getBadgeClass(categoryValue);

    const ingredientsCount = Array.isArray(item.ingredients) ? item.ingredients.length : 0;
    const ingredientsLabel = ingredientsCount === 1 ? "Ingrédient" : "Ingrédients";

    const servings = Number.isFinite(Number(item?.servings)) ? Number(item.servings) : 4;
    const servingsLabel = servings === 1 ? "Personne" : "Personnes";

    return (
        <article
            onClick={() => onOpen(item._id)}
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
                            onToggleFav(item);
                        }}
                        className="absolute top-3 right-3 rounded-full bg-white/90 p-2 shadow-md transition"
                        aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                        title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                        <FaHeart className={`text-lg ${isFav ? "text-primary" : "text-zinc-400"}`} />
                    </motion.button>
                )}
            </div>

            <div className="p-4 space-y-3">
                <h3 className="text-primary text-lg font-extrabold truncate">{item.title}</h3>

                <div className="h-px w-full bg-zinc-100" />

                <div className="flex items-center justify-between">
                    <span className={badgeClass}>{categoryLabel}</span>

                    <div className="flex items-start gap-8 text-sm text-zinc-500">
                        <div className="flex flex-col items-start leading-tight gap-1">
                            <div className="flex items-center gap-1">
                                <span>⏱️</span>
                                <span className="font-semibold text-primary">{item.time}</span>
                            </div>
                            <span className="text-xs text-zinc-400">Minutes</span>
                        </div>

                        <div className="flex flex-col items-start leading-tight gap-1">
                            <div className="flex items-center gap-1">
                                <span>🫙️</span>
                                <span className="font-semibold text-primary">{ingredientsCount}</span>
                            </div>
                            <span className="text-xs text-zinc-400">{ingredientsLabel}</span>
                        </div>

                        <div className="flex flex-col items-start leading-tight gap-1">
                            <div className="flex items-center gap-1">
                                <span>🍽</span>
                                <span className="font-semibold text-primary">{servings}</span>
                            </div>
                            <span className="text-xs text-zinc-400">{servingsLabel}</span>
                        </div>
                    </div>
                </div>

                {path && (
                    <div className="flex justify-end gap-2 pt-2">
                        <Link
                            to={`/editRecipe/${item._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-full p-2 text-orange-500 hover:text-orange-600 hover:bg-secondary transition duration-600"
                            aria-label="Éditer"
                            title="Éditer"
                        >
                            <FaEdit />
                        </Link>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRequestDelete(item);
                            }}
                            className="hover:cursor-pointer rounded-full p-2 text-red-700 hover:text-red-800 hover:bg-secondary transition duration-600"
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
}
