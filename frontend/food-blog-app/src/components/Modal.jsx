import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Modal({ children, onClose }) {
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

                <motion.div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                />

                <motion.div
                    className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                    role="dialog"
                    aria-modal="true"
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                >
                    <button
                        onClick={onClose}
                        className="absolute right-3 top-3 rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition"
                        aria-label="Fermer"
                    >
                        ✕
                    </button>

                    {children}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
