import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../apiBase";
import { CATEGORY_ORDER, getBadgeClass, getCategoryLabel } from "../utils/categories";
import GeneratorRecipeCard from "../components/GeneratorRecipeCard";
import usePageTitle from "../hooks/usePageTitle";
const GENERATOR_EXCLUDED_CATEGORIES = ["boisson", "sauce"];

const clampInt = (value, min, max, fallback) => {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
};

const buildExcludeParam = (ids) => ids.filter(Boolean).join(",");

export default function Generator() {
    usePageTitle("Générateur");

    const [days, setDays] = useState(7);

    // ✅ Multi-sélection catégories (plat par défaut)
    const [categories, setCategories] = useState(["plat"]);
    // 🔒 Protection : retire automatiquement les catégories non pertinentes du générateur
    useEffect(() => {
        setCategories((prev) => {
            const cleaned = prev.filter(
                (c) => !GENERATOR_EXCLUDED_CATEGORIES.includes(c)
            );

            // Si tout a été retiré, on revient à "plat"
            return cleaned.length > 0 ? cleaned : ["plat"];
        });
    }, []);


    const [menus, setMenus] = useState([]); // [{ dayIndex, brunch?, lunch, dinner }]
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const d = useMemo(() => clampInt(days, 1, 14, 3), [days]);

    const brunchEnabled = useMemo(() => categories.includes("brunch"), [categories]);

    // Catégories autorisées pour Midi/Soir (on enlève brunch)
    const mealCategories = useMemo(() => {
        const filtered = (Array.isArray(categories) ? categories : []).filter((c) => c !== "brunch");
        // UX: si l’utilisateur n’a sélectionné que brunch (ou a tout décoché), on retombe sur plat pour Midi/Soir
        return filtered.length > 0 ? filtered : ["plat"];
    }, [categories]);

    // Compte total de recettes à générer
    const mealsCount = useMemo(() => d * 2 + (brunchEnabled ? d : 0), [d, brunchEnabled]);

    const currentRecipeIds = useMemo(() => {
        const ids = [];
        for (const m of menus) {
            if (m?.brunch?._id) ids.push(m.brunch._id);
            if (m?.lunch?._id) ids.push(m.lunch._id);
            if (m?.dinner?._id) ids.push(m.dinner._id);
        }
        return ids;
    }, [menus]);

    const toggleCategory = useCallback((c) => {
        setCategories((prev) => {
            const has = prev.includes(c);
            const next = has ? prev.filter((x) => x !== c) : [...prev, c];

            // Option UX: si tout est décoché, on revient à "plat"
            return next.length === 0 ? ["plat"] : next;
        });
    }, []);

    // ✅ fetch avec catégories overridables (selon slot)
    const fetchRandomRecipes = useCallback(
        async ({ count, excludeIds = [], categoriesOverride = null }) => {
            const params = new URLSearchParams();
            params.set("count", String(count));

            const wantedCategories =
                Array.isArray(categoriesOverride) && categoriesOverride.length > 0
                    ? categoriesOverride
                    : mealCategories;

            params.set("category", wantedCategories.join(","));

            if (excludeIds.length > 0) params.set("exclude", buildExcludeParam(excludeIds));

            const url = `${API_BASE_URL}/recipe/random?${params.toString()}`;
            const res = await axios.get(url);
            return Array.isArray(res.data) ? res.data : [];
        },
        [mealCategories]
    );

    const generateMenus = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            let exclude = [];
            let brunchPicked = [];
            let mealsPicked = [];

            // 1) Si brunch activé : on récupère d recettes brunch (une par jour)
            if (brunchEnabled) {
                for (let round = 0; round < 5 && brunchPicked.length < d; round++) {
                    const need = d - brunchPicked.length;
                    const batch = await fetchRandomRecipes({
                        count: need,
                        excludeIds: exclude,
                        categoriesOverride: ["brunch"],
                    });
                    if (batch.length === 0) break;

                    brunchPicked = [...brunchPicked, ...batch];
                    exclude = [...exclude, ...batch.map((r) => r?._id).filter(Boolean)];
                }

                // fallback si pas assez (sans exclude)
                while (brunchPicked.length < d) {
                    const batch = await fetchRandomRecipes({
                        count: d - brunchPicked.length,
                        excludeIds: [],
                        categoriesOverride: ["brunch"],
                    });
                    if (batch.length === 0) break;

                    brunchPicked = [...brunchPicked, ...batch];
                    exclude = [...exclude, ...batch.map((r) => r?._id).filter(Boolean)];
                }
            }

            // 2) Puis Midi/Soir : d*2 recettes parmi mealCategories (sans brunch)
            const wantedMeals = d * 2;

            for (let round = 0; round < 5 && mealsPicked.length < wantedMeals; round++) {
                const need = wantedMeals - mealsPicked.length;
                const batch = await fetchRandomRecipes({
                    count: need,
                    excludeIds: exclude,
                    categoriesOverride: mealCategories,
                });
                if (batch.length === 0) break;

                mealsPicked = [...mealsPicked, ...batch];
                exclude = [...exclude, ...batch.map((r) => r?._id).filter(Boolean)];
            }

            while (mealsPicked.length < wantedMeals) {
                const batch = await fetchRandomRecipes({
                    count: wantedMeals - mealsPicked.length,
                    excludeIds: [],
                    categoriesOverride: mealCategories,
                });
                if (batch.length === 0) break;

                mealsPicked = [...mealsPicked, ...batch];
                exclude = [...exclude, ...batch.map((r) => r?._id).filter(Boolean)];
            }

            // 3) Construire les menus
            const newMenus = [];
            for (let i = 0; i < d; i++) {
                newMenus.push({
                    dayIndex: i,
                    brunch: brunchEnabled ? brunchPicked[i] ?? null : undefined,
                    lunch: mealsPicked[i * 2] ?? null,
                    dinner: mealsPicked[i * 2 + 1] ?? null,
                });
            }
            setMenus(newMenus);
        } catch (e) {
            console.error(e);
            setError("Impossible de générer des menus pour le moment.");
        } finally {
            setLoading(false);
        }
    }, [d, brunchEnabled, mealCategories, fetchRandomRecipes]);

    const regenerateOne = useCallback(
        async ({ dayIndex, slot }) => {
            setLoading(true);
            setError("");
            try {
                const exclude = currentRecipeIds.filter((id) => {
                    const current = menus?.[dayIndex]?.[slot]?._id;
                    return id && id !== current;
                });

                const slotCategories =
                    slot === "brunch" ? ["brunch"] : mealCategories;

                const firstTry = await fetchRandomRecipes({
                    count: 1,
                    excludeIds: exclude,
                    categoriesOverride: slotCategories,
                });

                const replacement =
                    firstTry?.[0] ??
                    (await fetchRandomRecipes({
                        count: 1,
                        excludeIds: [],
                        categoriesOverride: slotCategories,
                    }))?.[0] ??
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
        [currentRecipeIds, fetchRandomRecipes, menus, mealCategories]
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
                                <div className="text-sm font-semibold text-zinc-700">Nombre de jours</div>
                                <input
                                    className="input h-10"
                                    type="number"
                                    min={1}
                                    max={14}
                                    value={days}
                                    onChange={(e) => setDays(clampInt(e.target.value, 1, 14, 3))}
                                />
                                <div className="text-xs text-zinc-500">{mealsCount} repas à générer</div>
                            </label>

                            {/* ✅ badges multi-sélection */}
                            <div className="space-y-2 sm:col-span-1 lg:col-span-2">
                                <div className="text-sm font-semibold text-zinc-700">Catégories</div>

                                <div className="flex flex-wrap gap-2">
                                    {CATEGORY_ORDER
                                        .filter((c) => !GENERATOR_EXCLUDED_CATEGORIES.includes(c))
                                        .map((c) => {
                                            const selected = categories.includes(c);
                                            return (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => toggleCategory(c)}
                                                    className={[
                                                        getBadgeClass(c),
                                                        "transition",
                                                        "ring-offset-2 ring-offset-white",
                                                        selected
                                                            ? "ring-2 ring-primary/40 opacity-100"
                                                            : "opacity-50 hover:opacity-90",
                                                    ].join(" ")}
                                                    aria-pressed={selected}
                                                    title={getCategoryLabel(c)}
                                                >
                                                    {getCategoryLabel(c)}
                                                </button>
                                            );
                                        })}
                                </div>

                                <div className="text-xs text-zinc-500">
                                    Par défaut : Plat — clique pour sélectionner une ou plusieurs catégories
                                </div>

                                {brunchEnabled && (
                                    <div className="text-xs text-zinc-500">
                                        ✅ Brunch activé : une recette “Brunch” sera ajoutée en plus chaque jour (catégorie brunch uniquement).
                                    </div>
                                )}
                            </div>
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
                        <div key={menu.dayIndex} className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-primary font-extrabold">Jour {menu.dayIndex + 1}</h3>
                            </div>

                            {brunchEnabled && (
                                <>
                                    <GeneratorRecipeCard
                                        embedded
                                        label="Brunch"
                                        recipe={menu.brunch}
                                        onRegenerate={() => regenerateOne({ dayIndex: menu.dayIndex, slot: "brunch" })}
                                    />
                                    <hr className="border-0 h-px bg-zinc-200 my-1" />
                                </>
                            )}

                            <GeneratorRecipeCard
                                embedded
                                label="Midi"
                                recipe={menu.lunch}
                                onRegenerate={() => regenerateOne({ dayIndex: menu.dayIndex, slot: "lunch" })}
                            />
                            <hr className="border-0 h-px bg-zinc-200 my-1" />
                            <GeneratorRecipeCard
                                embedded
                                label="Soir"
                                recipe={menu.dinner}
                                onRegenerate={() => regenerateOne({ dayIndex: menu.dayIndex, slot: "dinner" })}
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
