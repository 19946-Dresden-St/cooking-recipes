import React, { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import InputForm from "./InputForm.jsx";
import { NavLink } from "react-router-dom";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
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
        } else {
            setIsOpen(true);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-20 bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <h2 className="text-lg font-extrabold text-primary">
                        Repas de merde !
                    </h2>
                    <ul className="flex items-center gap-4">
                        <li>
                            <NavLink to="/"
                                     end
                                     className={({ isActive }) => (isActive ? "nav-item-active" : "nav-item")}
                            >
                                Accueil
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/myRecipe"
                                     onClick={(e) => {
                                         if (isLogin) {
                                             e.preventDefault();
                                             setIsOpen(true);
                                         }
                                     }}
                                     className={({ isActive }) => (isActive ? "nav-item-active" : "nav-item")}
                            >
                                Mes recettes
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/favRecipe"
                                     onClick={(e) => {
                                         if (isLogin) {
                                             e.preventDefault();
                                             setIsOpen(true);
                                         }
                                     }}
                                     className={({ isActive }) => (isActive ? "nav-item-active" : "nav-item")}
                            >
                                Mes Favoris
                            </NavLink>
                        </li>
                        <li>
                            <button onClick={checkLogin}
                                    className="text-primary font-semibold hover:text-accent hover:cursor-pointer transition duration-300"
                            >
                                {isLogin ? "Connexion" : "Se déconnecter"}
                                {user?.email ? ` (${user.email})` : ""}
                            </button>
                        </li>
                    </ul>
                </div>
            </header>

            {isOpen && (
                <Modal onClose={() => setIsOpen(false)}>
                    <InputForm setIsOpen={() => setIsOpen(false)} />
                </Modal>
            )}
        </>
    );
}
