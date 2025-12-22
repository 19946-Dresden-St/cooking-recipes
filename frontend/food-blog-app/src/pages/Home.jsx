import React, { useEffect, useState } from "react";
import usePageTitle from "../hooks/usePageTitle.js";
import heroImg from "../assets/heroSection.jpg";
import RecipeItems from "../components/RecipeItems.jsx";
import Modal from "../components/Modal.jsx";
import InputForm from "../components/InputForm.jsx";
import { useLocation, useNavigate } from "react-router-dom";

export default function Home() {
    usePageTitle("Qu'est-ce qu'on mange ? | Accueil");

    const location = useLocation();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);

    // user pour afficher "Hello <username>" quand connecté
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
    const [token, setToken] = useState(() => localStorage.getItem("token"));

    const syncAuthFromStorage = () => {
        setToken(localStorage.getItem("token"));
        setUser(JSON.parse(localStorage.getItem("user")));
    };

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "token" || e.key === "user") syncAuthFromStorage();
        };
        const onAuthChanged = () => syncAuthFromStorage();

        window.addEventListener("storage", onStorage);
        window.addEventListener("authChanged", onAuthChanged);

        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("authChanged", onAuthChanged);
        };
    }, []);

    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace("#", "");
            const element = document.getElementById(id);
            if (element) element.scrollIntoView({ behavior: "smooth" });
        }
    }, [location]);

    const addRecipe = () => {
        if (token) {
            navigate("/addRecipe");
        } else {
            setIsOpen(true);
        }
    };

    const showHello = Boolean(token && user?.username);

    return (
        <>
            <section className="relative h-screen w-screen overflow-hidden">
                <img
                    src={heroImg}
                    alt="Hero food"
                    className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-black/35" />

                <div className="relative z-10 flex h-full items-center">
                    <div className="w-full px-6 md:px-12">
                        <div className="max-w-xl">
                            <h1 className="text-white">
                                {showHello ? `Hello ${user.username} ! 👋` : "Repas de Merde !"}
                            </h1>

                            <h2 className="mt-4 text-lg md:text-2xl font-semibold text-white/90">
                                {showHello
                                    ? "Que mange-t-on de bon aujourd'hui ?"
                                    : "Des recettes simples, rapides, et (vraiment) bonnes."}
                            </h2>

                            <a href="#recipesList" className="btn-primary inline-block mt-8">
                                Découvrir les recettes
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {isOpen && (
                <Modal onClose={() => setIsOpen(false)}>
                    <InputForm setIsOpen={() => setIsOpen(false)} />
                </Modal>
            )}

            <section id="recipesList" className="scroll-mt-24 bg-secondary py-16">
                <div className="mx-auto container">
                    {/* Header: titre à gauche + bouton à droite */}
                    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <h2 className="mb-0">
                            <span className="relative inline-block">
                                Toutes les recettes
                                <span className="absolute left-0 -bottom-1 h-1 w-40 bg-primary/20 rounded-full" />
                            </span>
                        </h2>

                        <button onClick={addRecipe} className="btn-primary" type="button">
                            Ajouter une recette
                        </button>
                    </div>

                    <RecipeItems />
                </div>
            </section>
        </>
    );
}
