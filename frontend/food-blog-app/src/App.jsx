import React from "react";
import { API_BASE_URL } from "./apiBase";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home.jsx";
import MainNavigation from "./components/MainNavigation.jsx";
import axios from "axios";
import AddFoodRecipe from "./pages/AddFoodRecipe.jsx";
import EditRecipe from "./pages/EditRecipe.jsx";
import RecipeDetails from "./pages/RecipeDetails.jsx";
import MyRecipes from "./pages/MyRecipes.jsx";
import FavRecipes from "./pages/FavRecipes.jsx";
import Generator from "./pages/generator";
import ShoppingList from "./pages/ShoppingList.jsx";
import ErrorPage from "./components/ErrorPage.jsx";

const getAllRecipes = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/recipe/`);
        return res.data;
    } catch (err) {
        // si l'API est down, on ne fait pas crasher toute l'app
        return [];
    }
};

const getMyRecipes = async () => {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?._id) return [];
        const allRecipes = await getAllRecipes();
        return allRecipes.filter((item) => item.createdBy === user._id);
    } catch (err) {
        return [];
    }
};

const getFavRecipes = async () => {
    return JSON.parse(localStorage.getItem("fav")) ?? [];
};

const getRecipe = async ({ params }) => {
    // Ici je préfère laisser throw si ça échoue :
    // -> ce sera géré par RouteError (pas page blanche)
    const recipeRes = await axios.get(`${API_BASE_URL}/recipe/${params.id}`);
    let recipe = recipeRes.data;

    const userRes = await axios.get(`${API_BASE_URL}/user/${recipe.createdBy}`);
    recipe = { ...recipe, username: userRes.data.username };

    return recipe;
};

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainNavigation />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/", element: <Home />, loader: getAllRecipes },
            { path: "/generator", element: <Generator /> },
            { path: "/myRecipe", element: <MyRecipes />, loader: getMyRecipes },
            { path: "/favRecipe", element: <FavRecipes />, loader: getFavRecipes },
            { path: "/addRecipe", element: <AddFoodRecipe /> },
            { path: "/editRecipe/:id", element: <EditRecipe /> },
            { path: "/recipe/:id", element: <RecipeDetails />, loader: getRecipe },
            { path: "/shopping-list", element: <ShoppingList /> },
        ],
    },
]);

export default function App() {
    return <RouterProvider router={router} />;
}
