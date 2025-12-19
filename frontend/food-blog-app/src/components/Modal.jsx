import React, { useEffect } from "react";

export default function Modal({ children, onClose }) {
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition"
                    aria-label="Fermer"
                >
                    ✕
                </button>

                {children}
            </div>
        </div>
    );
}
