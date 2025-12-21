import React from "react";
import {
    CATEGORY_ORDER,
    getBadgeClass,
    getCategoryLabel,
} from "../utils/categories.js";

const TIME_FILTERS = [
    { key: "all", label: "Tous" },
    { key: "fast", label: "🥪 Rapides" },
    { key: "medium", label: "🍛 Du quotidien" },
    { key: "long", label: "🍲 Prendre son temps" },
];

export default function CategoryFilterBar({
                                              selectedCategory,
                                              onSelectCategory,
                                              selectedTime,
                                              onSelectTime,
                                          }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Gauche : catégories */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => onSelectCategory("all")}
                    className={[
                        "inline-flex items-center rounded-full px-3 py-1 text-xs text-white font-semibold hover:cursor-pointer transition duration-600",
                        selectedCategory === "all"
                            ? "bg-primary"
                            : "bg-primary hover:bg-accent",
                    ].join(" ")}
                    aria-pressed={selectedCategory === "all"}
                >
                    Toutes
                </button>

                {CATEGORY_ORDER.map((cat) => {
                    const active = selectedCategory === cat;

                    return (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => onSelectCategory(cat)}
                            className={[
                                getBadgeClass(cat),
                                active
                                    ? "ring-2 ring-primary ring-offset-2"
                                    : "opacity-80 hover:opacity-100 hover:cursor-pointer transition duration-600",
                            ].join(" ")}
                            title={`Filtrer : ${getCategoryLabel(cat)}`}
                            aria-pressed={active}
                        >
                            {getCategoryLabel(cat)}
                        </button>
                    );
                })}
            </div>

            {/* Espace qui pousse le bloc de droite */}
            <div className="flex-1" />

            {/* Droite : temps */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
                {TIME_FILTERS.map((t) => {
                    const active = (selectedTime ?? "all") === t.key;

                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => onSelectTime?.(t.key)}
                            className={[
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition duration-600",
                                active
                                    ? "bg-primary text-white ring-2 ring-primary ring-offset-2"
                                    : "bg-white text-primary hover:bg-primary hover:text-white hover:cursor-pointer border border-primary",
                            ].join(" ")}
                            aria-pressed={active}
                            title="Filtrer par durée"
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
