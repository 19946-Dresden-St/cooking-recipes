import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../apiBase";
import {
    CATEGORY_ORDER,
    getBadgeClass,
    getCategoryLabel,
} from "../utils/categories";
import GeneratorRecipeCard from "../components/GeneratorRecipeCard";
import usePageTitle from "../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";

const clampInt = (value, min, max, fallback) => {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
};

const buildExcludeParam = (ids) => ids.filter(Boolean).join(",");

const HIDDEN_ON_GENERATOR = new Set(["boisson", "sauce"]);
const DAILY_CATEGORIES = new Set(["apero", "entree", "plat", "dessert"]);
const DAILY_ORDER = ["apero", "entree", "plat", "dessert"];

// --- Persistance (reste en mémoire entre pages) ---
const STORAGE_KEY = "generator:menus:v1";

const safeJsonParse = (value) => {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

function SectionTitle({ icon, children }) {
    return (
        <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-primary text-sm">
          {icon}
        </span>
                <h4 className="text-base font-bold tracking-tight text-zinc-900">
                    {children}
                </h4>
            </div>
            <div className="h-px flex-1 ml-3 bg-zinc-200/80" />
        </div>
    );
}

export default function Generator() {
    usePageTitle("Générateur");

    const [days, setDays] = useState(7);
    const [categories, setCategories] = useState(["plat"]);

    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    // Retire les catégories non dispo sur le générateur
    useEffect(() => {
        setCategories((prev) => prev.filter((c) => !HIDDEN_ON_GENERATOR.has(c)));
    }, []);

    const d = useMemo(() => clampInt(days, 1, 14, 7), [days]);

    const hasBrunch = useMemo(() => categories.includes("brunch"), [categories]);

    const selectedDailyCats = useMemo(() => {
        return categories.filter((c) => c !== "brunch" && DAILY_CATEGORIES.has(c));
    }, [categories]);

    const safeDailyCats = useMemo(() => {
        if (hasBrunch) return selectedDailyCats;
        return selectedDailyCats.length > 0 ? selectedDailyCats : ["plat"];
    }, [hasBrunch, selectedDailyCats]);

    const orderedDailyCats = useMemo(() => {
        const set = new Set(safeDailyCats);
        const ordered = DAILY_ORDER.filter((c) => set.has(c));
        const remaining = safeDailyCats.filter((c) => !DAILY_ORDER.includes(c));
        return [...ordered, ...remaining];
    }, [safeDailyCats]);

    const currentRecipeIds = useMemo(() => {
        const ids = [];

        for (const m of menus) {
            if (m?.brunch?._id) ids.push(m.brunch._id);

            const lunchObj = m?.lunch || {};
            const dinnerObj = m?.dinner || {};

            for (const key of Object.keys(lunchObj)) {
                if (lunchObj[key]?._id) ids.push(lunchObj[key]._id);
            }
            for (const key of Object.keys(dinnerObj)) {
                if (dinnerObj[key]?._id) ids.push(dinnerObj[key]._id);
            }
        }

        return ids;
    }, [menus]);

    const toggleCategory = useCallback((c) => {
        setCategories((prev) => {
            const has = prev.includes(c);
            const next = has ? prev.filter((x) => x !== c) : [...prev, c];
            return next.length === 0 ? ["plat"] : next;
        });
    }, []);

    const fetchRandomRecipes = useCallback(async ({ count, excludeIds = [], category }) => {
        const params = new URLSearchParams();
        params.set("count", String(count));
        params.set("category", String(category || "plat"));
        if (excludeIds.length > 0) params.set("exclude", buildExcludeParam(excludeIds));

        const url = `${API_BASE_URL}/recipe/random?${params.toString()}`;
        const res = await axios.get(url);
        return Array.isArray(res.data) ? res.data : [];
    }, []);

    const buildEmptyMenuDay = useCallback(
        (dayIndex) => {
            const lunch = {};
            const dinner = {};

            for (const c of safeDailyCats) {
                lunch[c] = null;
                dinner[c] = null;
            }

            return {
                dayIndex,
                brunch: hasBrunch ? null : undefined,
                lunch,
                dinner,
            };
        },
        [hasBrunch, safeDailyCats]
    );

    const persistState = useCallback(
        (nextMenus, nextDays = days, nextCategories = categories) => {
            const payload = {
                version: 1,
                savedAt: Date.now(),
                days: nextDays,
                categories: nextCategories,
                menus: nextMenus,
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        },
        [days, categories]
    );

    const generateMenus = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const base = Array.from({ length: d }, (_, dayIndex) => buildEmptyMenuDay(dayIndex));

            let exclude = [...currentRecipeIds];

            if (hasBrunch) {
                const brunchBatch = await fetchRandomRecipes({
                    count: d,
                    excludeIds: exclude,
                    category: "brunch",
                });

                for (let i = 0; i < d; i++) {
                    base[i].brunch = brunchBatch[i] ?? null;
                }

                exclude = [...exclude, ...brunchBatch.map((r) => r?._id).filter(Boolean)];
            }

            for (const cat of safeDailyCats) {
                const needed = d * 2;

                let picked = [];
                let localExclude = [...exclude];

                for (let round = 0; round < 5 && picked.length < needed; round++) {
                    const batch = await fetchRandomRecipes({
                        count: needed - picked.length,
                        excludeIds: localExclude,
                        category: cat,
                    });
                    if (batch.length === 0) break;
                    picked = [...picked, ...batch];
                    localExclude = [...localExclude, ...batch.map((r) => r?._id).filter(Boolean)];
                }

                while (picked.length < needed) {
                    const batch = await fetchRandomRecipes({
                        count: needed - picked.length,
                        excludeIds: [],
                        category: cat,
                    });
                    if (batch.length === 0) break;
                    picked = [...picked, ...batch];
                }

                for (let i = 0; i < d; i++) {
                    base[i].lunch[cat] = picked[i * 2] ?? null;
                    base[i].dinner[cat] = picked[i * 2 + 1] ?? null;
                }

                exclude = [...exclude, ...picked.map((r) => r?._id).filter(Boolean)];
            }

            setMenus(base);
            persistState(base, d, categories);
        } catch (e) {
            console.error(e);
            setError("Impossible de générer des menus pour le moment.");
        } finally {
            setLoading(false);
        }
    }, [
        buildEmptyMenuDay,
        categories,
        currentRecipeIds,
        d,
        fetchRandomRecipes,
        hasBrunch,
        persistState,
        safeDailyCats,
    ]);

    const regenerateOne = useCallback(
        async ({ dayIndex, meal, categoryKey }) => {
            setLoading(true);
            setError("");

            try {
                const current =
                    meal === "brunch"
                        ? menus?.[dayIndex]?.brunch
                        : menus?.[dayIndex]?.[meal]?.[categoryKey];

                const currentId = current?._id;
                const exclude = currentRecipeIds.filter((id) => id && id !== currentId);

                const firstTry = await fetchRandomRecipes({
                    count: 1,
                    excludeIds: exclude,
                    category: meal === "brunch" ? "brunch" : categoryKey,
                });

                const replacement =
                    firstTry?.[0] ??
                    (await fetchRandomRecipes({
                        count: 1,
                        excludeIds: [],
                        category: meal === "brunch" ? "brunch" : categoryKey,
                    }))?.[0] ??
                    null;

                setMenus((prev) => {
                    const next = prev.map((m) => {
                        if (m.dayIndex !== dayIndex) return m;

                        if (meal === "brunch") {
                            return { ...m, brunch: replacement };
                        }

                        return {
                            ...m,
                            [meal]: {
                                ...(m[meal] || {}),
                                [categoryKey]: replacement,
                            },
                        };
                    });

                    // persiste immédiatement la nouvelle version
                    persistState(next, d, categories);
                    return next;
                });
            } catch (e) {
                console.error(e);
                setError("Impossible de regénérer cette recette.");
            } finally {
                setLoading(false);
            }
        },
        [categories, currentRecipeIds, d, fetchRandomRecipes, menus, persistState]
    );

    // Au montage: restore si possible, sinon génération auto
    useEffect(() => {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const parsed = raw ? safeJsonParse(raw) : null;

        if (parsed?.version === 1 && Array.isArray(parsed.menus) && parsed.menus.length > 0) {
            if (Number.isFinite(parsed.days)) setDays(clampInt(parsed.days, 1, 14, 7));
            if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
                setCategories(parsed.categories.filter((c) => !HIDDEN_ON_GENERATOR.has(c)));
            }
            setMenus(parsed.menus);
            return;
        }

        generateMenus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persiste aussi si days/categories changent (au moins pour garder les prefs)
    useEffect(() => {
        if (menus?.length > 0) {
            persistState(menus, d, categories);
        }
    }, [categories, d, menus, persistState]);

    const badgeCategories = useMemo(
        () => CATEGORY_ORDER.filter((c) => !HIDDEN_ON_GENERATOR.has(c)),
        []
    );

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
                                    onChange={(e) => setDays(clampInt(e.target.value, 1, 14, 7))}
                                />
                                <div className="text-xs text-zinc-500">{d * 2} repas (midi+soir)</div>
                            </label>

                            <div className="space-y-2 sm:col-span-1 lg:col-span-2">
                                <div className="text-sm font-semibold text-zinc-700">Catégories</div>

                                <div className="flex flex-wrap gap-2">
                                    {badgeCategories.map((c) => {
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
                            </div>
                        </div>

                        <button
                            className="btn-primary-sm whitespace-nowrap w-full md:w-auto"
                            onClick={generateMenus}
                            disabled={loading}
                        >
                            {loading ? "Génération..." : "Générer"}
                        </button>

                        <button
                            className="btn-secondary-sm whitespace-nowrap w-full md:w-auto"
                            onClick={() => navigate("/shopping-list", { state: { menus } })}
                            disabled={loading || !menus?.length}
                        >
                            Liste de course
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
                                <h3 className="text-primary font-extrabold">Jour {menu.dayIndex + 1}</h3>
                            </div>

                            {hasBrunch && (
                                <div className="mb-4">
                                    <SectionTitle icon="☕">Brunch</SectionTitle>
                                    <div className="rounded-xl ring-1 ring-zinc-200 overflow-hidden divide-y divide-zinc-200">
                                        <GeneratorRecipeCard
                                            embedded
                                            recipe={menu.brunch}
                                            onRegenerate={() =>
                                                regenerateOne({ dayIndex: menu.dayIndex, meal: "brunch" })
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mb-4">
                                <SectionTitle icon="🍽️">Midi</SectionTitle>
                                <div className="rounded-xl ring-1 ring-zinc-200 overflow-hidden divide-y divide-zinc-200">
                                    {orderedDailyCats.map((cat) => (
                                        <GeneratorRecipeCard
                                            key={`lunch-${cat}`}
                                            embedded
                                            label={getCategoryLabel(cat)}
                                            recipe={menu.lunch?.[cat] ?? null}
                                            onRegenerate={() =>
                                                regenerateOne({
                                                    dayIndex: menu.dayIndex,
                                                    meal: "lunch",
                                                    categoryKey: cat,
                                                })
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <SectionTitle icon="🌙">Soir</SectionTitle>
                                <div className="rounded-xl ring-1 ring-zinc-200 overflow-hidden divide-y divide-zinc-200">
                                    {orderedDailyCats.map((cat) => (
                                        <GeneratorRecipeCard
                                            key={`dinner-${cat}`}
                                            embedded
                                            label={getCategoryLabel(cat)}
                                            recipe={menu.dinner?.[cat] ?? null}
                                            onRegenerate={() =>
                                                regenerateOne({
                                                    dayIndex: menu.dayIndex,
                                                    meal: "dinner",
                                                    categoryKey: cat,
                                                })
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
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
