import React from "react";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function MainNavigation() {
    const location = useLocation();

    return (
        <>
            <Navbar />

            <AnimatePresence mode="wait">
                <motion.main
                    key={location.pathname}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{
                        duration: 0.25,
                        ease: "easeOut"
                    }}
                >
                    <Outlet />
                </motion.main>
            </AnimatePresence>

            <Footer />
        </>
    );
}
