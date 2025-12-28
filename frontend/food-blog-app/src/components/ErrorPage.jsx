import React from "react";
import { isRouteErrorResponse, useRouteError, Link } from "react-router-dom";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

export default function ErrorPage() {
    const err = useRouteError();

    let message = "Une erreur est survenue.";
    if (isRouteErrorResponse(err)) {
        const m = err.data?.message;
        message = typeof m === "string" && m.trim() ? m : (err.statusText || message);
    } else {
        message = getApiErrorMessage(err);
    }


    return (
        <div className="container py-10">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
                <h2 className="text-xl font-extrabold mb-2">Oups…</h2>
                <p className="mb-4">{message}</p>
                <Link to="/" className="btn-primary inline-block">
                    Retour à l’accueil
                </Link>
            </div>
        </div>
    );
}
