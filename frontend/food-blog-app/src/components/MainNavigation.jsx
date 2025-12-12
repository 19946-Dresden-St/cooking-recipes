import React from 'react'
import Navbar from "./Navbar.jsx";
import {Outlet} from "react-router-dom";
import Footer from "./Footer.jsx";

export default function MainNavigation() {
    return (
        <>
            <Navbar />
            <Outlet />
            <Footer />
        </>
    )
}
