import React, { useEffect, useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { BsFillStopwatchFill } from "react-icons/bs";
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
        await axios.delete(`${API_BASE_URL}/recipe/${id}`).then((res) => console.log(res));
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

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allRecipes?.map((item) => {
                const isFav = favItems.some((res) => res._id === item._id);

                return (
                    <article
                        key={item._id}
                        onClick={() => navigate(`/recipe/${item._id}`)}
                        className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition duration-300"
                    >
                        {/* Image */}
                        <img
                            src={`${API_BASE_URL}/images/${item.coverImage}`}
                            alt={item.title}
                            onError={(e) => {
                                e.currentTarget.src = placeholderImg;
                            }}
                            className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />

                        <div className="p-4">
                            <h3 className="text-primary text-lg font-extrabold truncate">
                                {item.title}
                            </h3>

                            <div className="mt-4 flex items-center justify-between">

                                <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-zinc-800">
                                    <BsFillStopwatchFill />
                                    <span>{item.time}</span>
                                </div>

                                {!path ? (
                                    <motion.button
                                        whileTap={{ scale: 1.3 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            favRecipe(item);
                                        }}
                                        className={`rounded-full p-2 transition ${
                                            isFav ? "text-primary" : "text-zinc-400 hover:text-primary"
                                        } hover:bg-secondary`}
                                    >
                                        <FaHeart />
                                    </motion.button>
                                ) : (
                                    <div className="flex items-center gap-2">
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
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
