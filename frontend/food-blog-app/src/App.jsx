import React from 'react'
import './App.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Home from './pages/Home.jsx'
import MainNavigation from "./components/MainNavigation.jsx"
import axios from "axios"
import AddFoodRecipe from "./pages/AddFoodRecipe.jsx";

const getAllRecipes = async () => {
    let allRecipes = []
    await axios.get('http://localhost:5001/recipe/').then(res => {
        allRecipes = res.data
    })
    return allRecipes
}

const router = createBrowserRouter([
    { path: "/", element: <MainNavigation />,  children: [
        { path: "/", element: <Home />, loader: getAllRecipes },
        { path: "/myRecipe", element: <Home /> },
        { path: "/favRecipe", element: <Home /> },
        { path: "/addRecipe", element: <AddFoodRecipe /> },
    ]}
])

export default function App() {
    return (
        <>
            <RouterProvider router={router}></RouterProvider>
        </>
    )
}
