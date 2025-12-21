import React, { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../apiBase.js";
import CategoryFilterBar from "../components/CategoryFilterBar";
import RecipeCard from "../components/RecipeCard";

export default function RecipeItems() {
    const recipes = useLoaderData();
    const [allRecipes, setAllRecipes] = useState();
    const path = window.location.pathname === "/myRecipe";
    let favItems = JSON.parse(localStorage.getItem("fav")) ?? [];
    const [isFavRecipe, setIsFavRecipe] = useState(false);
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState("all");

    useEffect(() => {
        setAllRecipes(recipes);
    }, [recipes]);

    const onDelete = async (id) => {
        await axios.delete(`${API_BASE_URL}/recipe/${id}`).then((res) => console.log(res));
        setAllRecipes((recipes) => recipes.filter((recipe) => recipe._id !== id));
        const filteredItems = favItems.filter((recipe) => recipe._id !== id);
        localStorage.setItem("fav", JSON.stringify(filteredItems));
    };

    const favRecipe = (item) => {
        const filteredItems = favItems.filter((recipe) => recipe._id !== item._id);
        favItems =
            favItems.filter((recipe) => recipe._id === item._id).length === 0
                ? [...favItems, item]
                : filteredItems;

        localStorage.setItem("fav", JSON.stringify(favItems));
        setIsFavRecipe((pre) => !pre);
    };

    const filteredRecipes =
        selectedCategory === "all"
            ? allRecipes
            : (allRecipes ?? []).filter((r) => (r?.category ?? "plat") === selectedCategory);

    return (
        <div className="space-y-6">
            <CategoryFilterBar
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRecipes?.map((item) => {
                    const isFav = favItems.some((res) => res._id === item._id);

                    return (
                        <RecipeCard
                            key={item._id}
                            item={item}
                            path={path}
                            isFav={isFav}
                            onToggleFav={favRecipe}
                            onDelete={onDelete}
                            onOpen={(id) => navigate(`/recipe/${id}`)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
