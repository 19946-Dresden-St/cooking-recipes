import React from 'react'
import { API_BASE_URL } from "./apiBase";
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Home from './pages/Home.jsx'
import MainNavigation from "./components/MainNavigation.jsx"
import axios from "axios"
import AddFoodRecipe from "./pages/AddFoodRecipe.jsx";
import EditRecipe from "./pages/EditRecipe.jsx";
import RecipeDetails from "./pages/RecipeDetails.jsx";
import MyRecipes from "./pages/MyRecipes.jsx";
import FavRecipes from "./pages/FavRecipes.jsx";
import Generator from "./pages/generator"
import ShoppingList from "./pages/ShoppingList.jsx";

const getAllRecipes = async () => {
    let allRecipes = []
    await axios.get(`${API_BASE_URL}/recipe/`).then(res => {
        allRecipes = res.data
    })
    return allRecipes
}

const getMyRecipes = async () => {
    let user = JSON.parse(localStorage.getItem("user"));
    if (!user?._id) return [];
    let allRecipes = await getAllRecipes();
    return allRecipes.filter((item) => item.createdBy === user._id);
};

const getFavRecipes = async () => {
    return JSON.parse(localStorage.getItem("fav")) ?? [];
}

const getRecipe=async({params})=>{
    let recipe;
    await axios.get(`${API_BASE_URL}/recipe/${params.id}`)
        .then(res=>recipe=res.data)

    await axios.get(`${API_BASE_URL}/user/${recipe.createdBy}`)
        .then(res=>{
            recipe = { ...recipe, username: res.data.username }
        })

    return recipe
}

const router = createBrowserRouter([
    { path: "/", element: <MainNavigation />,  children: [
            { path: "/", element: <Home />, loader: getAllRecipes },
            { path: "/generator", element: <Generator /> },
            { path: "/myRecipe", element: <MyRecipes />, loader: getMyRecipes },
            { path: "/favRecipe", element: <FavRecipes />, loader: getFavRecipes },
            { path: "/addRecipe", element: <AddFoodRecipe /> },
            { path: "/editRecipe/:id", element: <EditRecipe /> },
            { path:"/recipe/:id", element:<RecipeDetails/>, loader:getRecipe },
            { path: "/shopping-list", element: <ShoppingList /> },
        ]}
]);

export default function App() {
    return (
        <>
            <RouterProvider router={router}></RouterProvider>
        </>
    )
}
