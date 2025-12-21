import React from "react";
import { CATEGORY_ORDER, getBadgeClass, getCategoryLabel } from "../utils/categories.js";

export default function CategoryFilterBar({ selectedCategory, onSelectCategory }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={() => onSelectCategory("all")}
                className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-xs text-white font-semibold hover:cursor-pointer transition duration-600",
                    selectedCategory === "all" ? "bg-primary" : "bg-primary hover:bg-accent",
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
    );
}
