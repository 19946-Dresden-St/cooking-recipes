import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../apiBase";
import { CATEGORY_ORDER, getCategoryLabel } from "../utils/categories";
import GeneratorRecipeCard from "../components/GeneratorRecipeCard";
import usePageTitle from "../hooks/usePageTitle";

const clampInt = (value, min, max, fallback) => {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
};

const buildExcludeParam = (ids) => ids.filter(Boolean).join(",");

export default function Generator() {
    usePageTitle("Générateur");

    const [days, setDays] = useState(3);
    const [category, setCategory] = useState("plat");
    const [menus, setMenus] = useState([]); // [{ dayIndex, lunch, dinner }]
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const mealsCount = useMemo(() => clampInt(days, 1, 14, 3) * 2, [days]);

    const currentRecipeIds = useMemo(() => {
        const ids = [];
        for (const m of menus) {
            if (m?.lunch?._id) ids.push(m.lunch._id);
            if (m?.dinner?._id) ids.push(m.dinner._id);
        }
        return ids;
    }, [menus]);

    const fetchRandomRecipes = useCallback(
        async ({ count, excludeIds = [] }) => {
            const params = new URLSearchParams();
            params.set("count", String(count));
            params.set("category", category || "plat");
            if (excludeIds.length > 0) params.set("exclude", buildExcludeParam(excludeIds));

            const url = `${API_BASE_URL}/recipe/random?${params.toString()}`;
            const res = await axios.get(url);
            return Array.isArray(res.data) ? res.data : [];
        },
        [category]
    );

    const generateMenus = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const wanted = mealsCount;
            let exclude = [];
            let picked = [];

            for (let round = 0; round < 5 && picked.length < wanted; round++) {
                const need = wanted - picked.length;
                const batch = await fetchRandomRecipes({ count: need, excludeIds: exclude });
                if (batch.length === 0) break;
                picked = [...picked, ...batch];
                exclude = [...exclude, ...batch.map((r) => r?._id).filter(Boolean)];
            }

            while (picked.length < wanted) {
                const batch = await fetchRandomRecipes({ count: wanted - picked.length, excludeIds: [] });
                if (batch.length === 0) break;
                picked = [...picked, ...batch];
            }

            const newMenus = [];
            const d = clampInt(days, 1, 14, 3);
            for (let i = 0; i < d; i++) {
                newMenus.push({
                    dayIndex: i,
                    lunch: picked[i * 2] ?? null,
                    dinner: picked[i * 2 + 1] ?? null,
                });
            }
            setMenus(newMenus);
        } catch (e) {
            console.error(e);
            setError("Impossible de générer des menus pour le moment.");
        } finally {
            setLoading(false);
        }
    }, [days, mealsCount, fetchRandomRecipes]);

    const regenerateOne = useCallback(
        async ({ dayIndex, slot }) => {
            setLoading(true);
            setError("");
            try {
                const exclude = currentRecipeIds.filter((id) => {
                    const current = menus?.[dayIndex]?.[slot]?._id;
                    return id && id !== current;
                });

                const firstTry = await fetchRandomRecipes({ count: 1, excludeIds: exclude });
                const replacement =
                    firstTry?.[0] ??
                    (await fetchRandomRecipes({ count: 1, excludeIds: [] }))?.[0] ??
                    null;

                setMenus((prev) =>
                    prev.map((m) => {
                        if (m.dayIndex !== dayIndex) return m;
                        return { ...m, [slot]: replacement };
                    })
                );
            } catch (e) {
                console.error(e);
                setError("Impossible de regénérer cette recette.");
            } finally {
                setLoading(false);
            }
        },
        [currentRecipeIds, fetchRandomRecipes, menus]
    );

    useEffect(() => {
        generateMenus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <section className="container py-8">
            <div className="flex flex-col gap-6">
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4">
                    <h2 className="mb-8">
                        <span className="relative inline-block">
                            Mes recettes
                            <span className="absolute left-0 -bottom-1 h-1 w-40 bg-primary/20 rounded-full" />
                        </span>
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                        Retrouve ici toutes les recettes que tu as partagées.
                    </p>
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <label className="space-y-1">
                                <div className="text-sm font-semibold text-zinc-700">
                                    Nombre de jours
                                </div>
                                <input
                                    className="input h-10"
                                    type="number"
                                    min={1}
                                    max={14}
                                    value={days}
                                    onChange={(e) =>
                                        setDays(clampInt(e.target.value, 1, 14, 3))
                                    }
                                />
                                <div className="text-xs text-zinc-500">
                                    {mealsCount} repas à générer
                                </div>
                            </label>

                            <label className="space-y-1">
                                <div className="text-sm font-semibold text-zinc-700">
                                    Catégorie
                                </div>
                                <select
                                    className="input h-10"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    {CATEGORY_ORDER.map((c) => (
                                        <option key={c} value={c}>
                                            {getCategoryLabel(c)}
                                        </option>
                                    ))}
                                </select>
                                <div className="text-xs text-zinc-500">
                                    Par défaut : Plat
                                </div>
                            </label>
                        </div>

                        <button
                            className="btn-primary-sm whitespace-nowrap w-full md:w-auto"
                            onClick={generateMenus}
                            disabled={loading}
                        >
                            {loading ? "Génération..." : "Générer"}
                        </button>
                    </div>

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {menus.map((menu) => (
                        <div
                            key={menu.dayIndex}
                            className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-primary font-extrabold">
                                    Jour {menu.dayIndex + 1}
                                </h3>
                            </div>

                            <GeneratorRecipeCard
                                embedded
                                label="Midi"
                                recipe={menu.lunch}
                                onRegenerate={() =>
                                    regenerateOne({ dayIndex: menu.dayIndex, slot: "lunch" })
                                }
                            />
                            <hr className="border-0 h-px bg-zinc-200 my-1" />
                            <GeneratorRecipeCard
                                embedded
                                label="Soir"
                                recipe={menu.dinner}
                                onRegenerate={() =>
                                    regenerateOne({ dayIndex: menu.dayIndex, slot: "dinner" })
                                }
                            />

                        </div>
                    ))}
                </div>

                {menus.length === 0 && !loading && (
                    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-6 text-zinc-600">
                        Aucune recette trouvée pour cette catégorie.
                    </div>
                )}
            </div>
        </section>
    );
}
