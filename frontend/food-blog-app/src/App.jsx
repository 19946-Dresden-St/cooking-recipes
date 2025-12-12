import React from 'react'
import './App.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Home from './pages/Home.jsx'

const router = createBrowserRouter([
    { path: "/", element: <Home /> }
])

export default function App() {
    return (
        <>
            <RouterProvider router={router}></RouterProvider>
        </>
    )
}
