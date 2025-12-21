import React, { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import InputForm from "./InputForm.jsx";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    let token = localStorage.getItem("token");
    const [isLogin, setIsLogin] = useState(token ? true : false);
    let user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        setIsLogin(token ? false : true);
    }, [token]);

    const checkLogin = () => {
        if (token) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setIsLogin(true);
            setIsMenuOpen(false);
            navigate("/", { replace: true });
        } else {
            setIsOpen(true);
            setIsMenuOpen(false);
        }
    };

    const openLoginIfNeeded = (e) => {
        if (isLogin) {
            e.preventDefault();
            setIsOpen(true);
            setIsMenuOpen(false);
        } else {
            setIsMenuOpen(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-20 bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <NavLink
                        to="/"
                        className="text-lg font-extrabold text-primary hover:opacity-80 transition"
                    >
                        Repas de Merde
                    </NavLink>

                    <ul className="hidden md:flex items-center gap-4">
                        <li>
                            <NavLink
                                to="/"
                                end
                                className={({ isActive }) =>
                                    isActive ? "nav-item-active" : "nav-item"
                                }
                            >
                                Accueil
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/myRecipe"
                                onClick={openLoginIfNeeded}
                                className={({ isActive }) =>
                                    isActive ? "nav-item-active" : "nav-item"
                                }
                            >
                                Mes recettes
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/favRecipe"
                                onClick={openLoginIfNeeded}
                                className={({ isActive }) =>
                                    isActive ? "nav-item-active" : "nav-item"
                                }
                            >
                                Mes Favoris
                            </NavLink>
                        </li>
                        <li>
                            <button
                                onClick={checkLogin}
                                className="text-primary font-semibold hover:text-accent hover:cursor-pointer transition duration-300"
                            >
                                {isLogin ? "Connexion" : "Se déconnecter"}
                                {user?.email ? ` (${user.email})` : ""}
                            </button>
                        </li>
                    </ul>

                    <button
                        className="md:hidden inline-flex items-center justify-center rounded-md px-3 py-2 text-primary hover:bg-secondary transition"
                        onClick={() => setIsMenuOpen((v) => !v)}
                        aria-label="Ouvrir le menu"
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? (
                            <span className="text-2xl leading-none">✕</span>
                        ) : (
                            <span className="text-2xl leading-none">☰</span>
                        )}
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden border-t border-zinc-200 px-4 py-3 bg-white">
                        <div className="flex flex-col gap-2">
                            <NavLink
                                to="/"
                                end
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    isActive ? "nav-item-active" : "nav-item"
                                }
                            >
                                Accueil
                            </NavLink>

                            <NavLink
                                to="/myRecipe"
                                onClick={openLoginIfNeeded}
                                className={({ isActive }) =>
                                    isActive ? "nav-item-active" : "nav-item"
                                }
                            >
                                Mes recettes
                            </NavLink>

                            <NavLink
                                to="/favRecipe"
                                onClick={openLoginIfNeeded}
                                className={({ isActive }) =>
                                    isActive ? "nav-item-active" : "nav-item"
                                }
                            >
                                Mes Favoris
                            </NavLink>

                            <button
                                onClick={checkLogin}
                                className="text-left text-primary font-semibold hover:text-accent transition duration-300 px-4 py-1.5"
                            >
                                {isLogin ? "Connexion" : "Se déconnecter"}
                                {user?.email ? ` (${user.email})` : ""}
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {isOpen && (
                <Modal onClose={() => setIsOpen(false)}>
                    <InputForm setIsOpen={() => setIsOpen(false)} />
                </Modal>
            )}
        </>
    );
}
