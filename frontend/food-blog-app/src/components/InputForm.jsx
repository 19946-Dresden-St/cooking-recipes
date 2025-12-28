import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../apiBase.js";
import usePageTitle from "../hooks/usePageTitle.js";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

export default function InputForm({ setIsOpen }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState("");

    usePageTitle("Qu'est-ce qu'on mange ? | Connexion / Inscription");

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const endpoint = isSignUp ? "signUp" : "login";

        try {
            const res = await axios.post(`${API_BASE_URL}/${endpoint}`, { username, password });

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            // 🔔 resync dans le même onglet (Home/Navbar/…)
            window.dispatchEvent(new Event("authChanged"));

            setIsOpen();
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    };

    return (
        <form onSubmit={handleOnSubmit} className="space-y-4">
            <div className="text-center">
                <h3 className="text-2xl font-extrabold text-primary">
                    {isSignUp ? "Créer un compte" : "Connexion"}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                    {isSignUp
                        ? "Crée ton compte pour enregistrer tes recettes."
                        : "Connecte-toi pour accéder à tes recettes et favoris."}
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800">Pseudo</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="input"
                    placeholder="ton_pseudo"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800">Mot de passe</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input"
                    placeholder="••••••••"
                />
            </div>

            {error !== "" && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            <button type="submit" className="w-full btn-primary">
                {isSignUp ? "S'inscrire" : "Se connecter"}
            </button>

            <button
                type="button"
                onClick={() => setIsSignUp((pre) => !pre)}
                className="w-full btn-secondary"
            >
                {isSignUp ? "J'ai déjà un compte" : "Créer un compte"}
            </button>
        </form>
    );
}
