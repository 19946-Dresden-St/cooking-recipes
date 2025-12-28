import React, { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../apiBase.js";
import CategoryFilterBar from "../components/CategoryFilterBar";
import RecipeCard from "../components/RecipeCard";
import ConfirmDeleteRecipeModal from "../components/ConfirmDeleteRecipeModal";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

export default function RecipeItems() {
    const recipes = useLoaderData();
    const [allRecipes, setAllRecipes] = useState([]);
    const path = window.location.pathname === "/myRecipe";
    let favItems = JSON.parse(localStorage.getItem("fav")) ?? [];
    const [isFavRecipe, setIsFavRecipe] = useState(false);
    const navigate = useNavigate();

    // 🔑 clés uniques par page
    const SEARCH_KEY = `recipe-search-${window.location.pathname}`;
    const CATEGORY_KEY = `recipe-category-${window.location.pathname}`;
    const TIME_KEY = `recipe-time-${window.location.pathname}`;

    // 🏷 Catégorie (persistée)
    const [selectedCategory, setSelectedCategory] = useState(
        () => localStorage.getItem(CATEGORY_KEY) ?? "all"
    );

    // ⏱ Temps (persisté)
    const [selectedTime, setSelectedTime] = useState(
        () => localStorage.getItem(TIME_KEY) ?? "all"
    );

    // 🔍 Recherche (persistée + debounce)
    const [searchTerm, setSearchTerm] = useState(
        () => localStorage.getItem(SEARCH_KEY) ?? ""
    );
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    // 🗑 Suppression
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 🔹 Init recettes
    useEffect(() => {
        setAllRecipes(recipes ?? []);
    }, [recipes]);

    // 🔹 Debounce + persistence recherche
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            localStorage.setItem(SEARCH_KEY, searchTerm);
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchTerm, SEARCH_KEY]);

    // 🔹 Persistence catégorie
    useEffect(() => {
        localStorage.setItem(CATEGORY_KEY, selectedCategory);
    }, [selectedCategory, CATEGORY_KEY]);

    // 🔹 Persistence temps
    useEffect(() => {
        localStorage.setItem(TIME_KEY, selectedTime);
    }, [selectedTime, TIME_KEY]);

    // ❌ Reset recherche
    const clearSearch = () => {
        setSearchTerm("");
        setDebouncedSearch("");
        localStorage.removeItem(SEARCH_KEY);
    };

    const onDelete = async (id) => {
        await axios.delete(`${API_BASE_URL}/recipe/${id}`, {
            headers: {
                authorization: "bearer " + localStorage.getItem("token"),
            },
        });
        try {
            await axios.delete(`${API_BASE_URL}/recipe/${id}`, {
                headers: {
                    authorization: "bearer " + localStorage.getItem("token"),
                },
            });
        } catch (err) {
            toast.error(getApiErrorMessage(err));
            throw err; // important: pour que confirmDelete sache que ça a échoué
        }

        setAllRecipes((recipes) => recipes.filter((recipe) => recipe._id !== id));

        const filteredItems = favItems.filter((recipe) => recipe._id !== id);
        localStorage.setItem("fav", JSON.stringify(filteredItems));
    };

    const confirmDelete = async () => {
        if (!deleteTarget?._id) return;

        setIsDeleting(true);
        try {
            await onDelete(deleteTarget._id);
            setDeleteTarget(null);
        } catch {
            // erreur déjà gérée dans onDelete
        } finally {
            setIsDeleting(false);
        }
    };

    const favRecipe = (item) => {
        // 🔒 Favoris uniquement si connecté
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Connecte-toi pour ajouter des favoris.");
            // Ouvre la modale de connexion depuis n'importe quelle page
            window.dispatchEvent(new Event("openAuthModal"));
            return;
        }

        const filteredItems = favItems.filter((recipe) => recipe._id !== item._id);

        favItems =
            favItems.filter((recipe) => recipe._id === item._id).length === 0
                ? [...favItems, item]
                : filteredItems;

        localStorage.setItem("fav", JSON.stringify(favItems));
        setIsFavRecipe((prev) => !prev);
    };

    // ⏱ filtre temps
    const matchesTime = (recipe) => {
        const t = Number(recipe?.time ?? 0);

        if (selectedTime === "all") return true;
        if (selectedTime === "fast") return t > 0 && t < 20;
        if (selectedTime === "medium") return t >= 20 && t <= 35;
        if (selectedTime === "long") return t > 35;

        return true;
    };

    // 🔍 FILTRAGE FINAL
    const filteredRecipes = allRecipes
        .filter((r) =>
            selectedCategory === "all" ? true : (r?.category ?? "plat") === selectedCategory
        )
        .filter(matchesTime)
        .filter((r) =>
            (r?.title ?? "").toLowerCase().includes(debouncedSearch.toLowerCase())
        );

    return (
        <div className="space-y-6">
            {/* 🔍 BARRE DE RECHERCHE */}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>

                <input
                    type="text"
                    placeholder="Rechercher une recette..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                />

                {searchTerm && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-lg"
                        aria-label="Effacer la recherche"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* 🏷 CATÉGORIES + ⏱ TEMPS */}
            <CategoryFilterBar
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
            />

            {/* 🔢 COMPTEUR */}
            <p className="text-sm text-gray-500">
                {filteredRecipes.length} recette
                {filteredRecipes.length > 1 ? "s" : ""} trouvée
                {filteredRecipes.length > 1 ? "s" : ""}
            </p>

            {/* 📋 RECETTES */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRecipes.map((item) => {
                    const isFav = favItems.some((res) => res._id === item._id);

                    return (
                        <RecipeCard
                            key={item._id}
                            item={item}
                            path={path}
                            isFav={isFav}
                            onToggleFav={favRecipe}
                            onRequestDelete={(recipe) => setDeleteTarget(recipe)}
                            onOpen={(id) => navigate(`/recipe/${id}`)}
                        />
                    );
                })}
            </div>

            {/* 🗑 MODALE SUPPRESSION */}
            {deleteTarget && (
                <ConfirmDeleteRecipeModal
                    recipeTitle={deleteTarget?.title ?? "Sans nom"}
                    isLoading={isDeleting}
                    onCancel={() => (isDeleting ? null : setDeleteTarget(null))}
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    );
}
