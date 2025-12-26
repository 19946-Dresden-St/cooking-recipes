import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../apiBase";
import {
    CATEGORY_ORDER,
    getBadgeClass,
    getCategoryLabel,
} from "../../utils/categories";
import usePageTitle from "../../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { FiUnlock } from "react-icons/fi";
import DayCard from "./components/DayCard";

import {
    DAILY_CATEGORIES,
    DAILY_ORDER,
    DEFAULT_CATEGORY,
    DEFAULT_DAYS,
    HIDDEN_ON_GENERATOR,
    ISO_DATE_RE,
    LS,
    MAX_DAYS,
    MIN_DAYS,
} from "./constants";
import { safeGetLS, safeJsonParse, safeSetLS } from "./storage";
import {
    addDaysISO,
    capitalizeFirst,
    formatDayLabelForCard,
    fromISOToLocalDate,
    isSameISODate,
    toLocalISODate,
} from "./dates";
import {
    buildExcludeParam,
    clampInt,
    parseSlotKey,
    slotKey,
} from "./slots";
import {
    clampSelectedServingsWithBase,
    normalizeRecipeSelectedServings,
} from "./servings";

function SectionTitle({ icon, children, right }) {
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
            <div className="flex items-center gap-2">
                {right}
                <div className="h-px w-10 bg-transparent" />
            </div>
            <div className="h-px flex-1 ml-3 bg-zinc-200/80" />
        </div>
    );
}

export default function Generator() {
    usePageTitle("Générateur");

    const navigate = useNavigate();

    const todayISO = useMemo(() => toLocalISODate(new Date()), []);

    const [startDate, setStartDate] = useState(() => {
        const saved = safeGetLS(LS.START_DATE);
        if (saved && ISO_DATE_RE.test(saved)) return saved;
        return toLocalISODate(new Date());
    });

    const [days, setDays] = useState(() => {
        const saved = safeGetLS(LS.DAYS);
        return saved ? clampInt(saved, MIN_DAYS, MAX_DAYS, DEFAULT_DAYS) : DEFAULT_DAYS;
    });

    const [categories, setCategories] = useState(() => {
        const saved = safeGetLS(LS.CATEGORIES);
        if (!saved) return [DEFAULT_CATEGORY];

        const parsed = safeJsonParse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
            const cleaned = parsed.filter((c) => !HIDDEN_ON_GENERATOR.has(c));
            return cleaned.length > 0 ? cleaned : [DEFAULT_CATEGORY];
        }
        return [DEFAULT_CATEGORY];
    });

    const [menus, setMenus] = useState(() => {
        const saved = safeGetLS(LS.MENUS);
        if (!saved) return [];

        const parsed = safeJsonParse(saved);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") return [parsed];
        return [];
    });

    const [lockedSlots, setLockedSlots] = useState(() => {
        const saved = safeGetLS(LS.LOCKED_SLOTS);
        if (!saved) return {};
        const parsed = safeJsonParse(saved);
        return parsed && typeof parsed === "object" ? parsed : {};
    });

    const [lockedDays, setLockedDays] = useState(() => {
        const saved = safeGetLS(LS.LOCKED_DAYS);
        if (!saved) return {};
        const parsed = safeJsonParse(saved);
        return parsed && typeof parsed === "object" ? parsed : {};
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        safeSetLS(LS.START_DATE, String(startDate));
    }, [startDate]);

    useEffect(() => {
        safeSetLS(LS.DAYS, String(days));
    }, [days]);

    useEffect(() => {
        safeSetLS(LS.CATEGORIES, JSON.stringify(categories));
    }, [categories]);

    useEffect(() => {
        const normalized = Array.isArray(menus)
            ? menus
            : menus && typeof menus === "object"
                ? [menus]
                : [];
        safeSetLS(LS.MENUS, JSON.stringify(normalized));
    }, [menus]);

    useEffect(() => {
        safeSetLS(LS.LOCKED_SLOTS, JSON.stringify(lockedSlots));
    }, [lockedSlots]);

    useEffect(() => {
        safeSetLS(LS.LOCKED_DAYS, JSON.stringify(lockedDays));
    }, [lockedDays]);

    useEffect(() => {
        setCategories((prev) => {
            const next = (prev || []).filter((c) => !HIDDEN_ON_GENERATOR.has(c));
            return next.length > 0 ? next : [DEFAULT_CATEGORY];
        });
    }, []);

    const d = useMemo(() => clampInt(days, MIN_DAYS, MAX_DAYS, DEFAULT_DAYS), [days]);

    const hasBrunch = useMemo(() => categories.includes("brunch"), [categories]);

    const selectedDailyCats = useMemo(() => {
        return categories.filter((c) => c !== "brunch" && DAILY_CATEGORIES.has(c));
    }, [categories]);

    const safeDailyCats = useMemo(() => {
        if (hasBrunch) return selectedDailyCats;
        return selectedDailyCats.length > 0 ? selectedDailyCats : [DEFAULT_CATEGORY];
    }, [hasBrunch, selectedDailyCats]);

    const orderedDailyCats = useMemo(() => {
        const set = new Set(safeDailyCats);
        const ordered = DAILY_ORDER.filter((c) => set.has(c));
        const remaining = safeDailyCats.filter((c) => !DAILY_ORDER.includes(c));
        return [...ordered, ...remaining];
    }, [safeDailyCats]);

    const isDayLocked = useCallback(
        (dayIndex) => !!lockedDays?.[dayIndex],
        [lockedDays]
    );

    const isSlotLocked = useCallback(
        ({ dayIndex, meal, categoryKey }) => {
            if (isDayLocked(dayIndex)) return true;
            return !!lockedSlots?.[slotKey({ dayIndex, meal, categoryKey })];
        },
        [lockedSlots, isDayLocked]
    );

    const toggleSlotLock = useCallback(({ dayIndex, meal, categoryKey }) => {
        const key = slotKey({ dayIndex, meal, categoryKey });
        setLockedSlots((prev) => {
            const next = { ...(prev || {}) };
            if (next[key]) delete next[key];
            else next[key] = true;
            return next;
        });
    }, []);

    const toggleDayLock = useCallback((dayIndex) => {
        setLockedDays((prev) => {
            const next = { ...(prev || {}) };
            if (next[dayIndex]) delete next[dayIndex];
            else next[dayIndex] = true;
            return next;
        });
    }, []);

    const unlockAll = useCallback(() => {
        setLockedSlots({});
        setLockedDays({});
    }, []);

    const setMealEnabled = useCallback(
        ({ dayIndex, mealKey, enabled }) => {
            setMenus((prev) => {
                if (!Array.isArray(prev)) return prev;
                const next = [...prev];
                const day = next[dayIndex];
                if (!day) return prev;

                const enabledMeals = {
                    lunch: true,
                    dinner: true,
                    ...(day.enabledMeals || {}),
                    [mealKey]: !!enabled,
                };

                const updated = { ...day, enabledMeals };

                if (!enabled) {
                    updated[mealKey] = undefined;
                } else {
                    if (!updated[mealKey] || typeof updated[mealKey] !== "object") {
                        updated[mealKey] = {};
                        for (const c of safeDailyCats) updated[mealKey][c] = null;
                    }
                }

                next[dayIndex] = updated;
                return next;
            });

            if (!enabled) {
                setLockedSlots((prev) => {
                    const next = { ...(prev || {}) };
                    for (const k of Object.keys(next)) {
                        const parsed = parseSlotKey(k);
                        if (parsed.dayIndex === dayIndex && parsed.meal === mealKey) {
                            delete next[k];
                        }
                    }
                    return next;
                });
            }
        },
        [safeDailyCats]
    );

    const fetchRandomRecipes = useCallback(async ({ count, excludeIds = [], category }) => {
        const params = new URLSearchParams();
        params.set("count", String(count));
        params.set("category", String(category || DEFAULT_CATEGORY));
        if (excludeIds.length > 0) params.set("exclude", buildExcludeParam(excludeIds));

        const url = `${API_BASE_URL}/recipe/random?${params.toString()}`;
        const res = await axios.get(url);
        const arr = Array.isArray(res.data) ? res.data : [];
        return arr.map((r) => normalizeRecipeSelectedServings(r));
    }, []);

    const buildEmptyMenuDay = useCallback(
        (dayIndex, existingDay) => {
            const enabledMeals = {
                lunch: true,
                dinner: true,
                ...(existingDay?.enabledMeals || {}),
            };

            const makeMealObj = () => {
                const obj = {};
                for (const c of safeDailyCats) obj[c] = null;
                return obj;
            };

            return {
                dayIndex,
                date: addDaysISO(startDate, dayIndex),
                enabledMeals,
                brunch: hasBrunch ? null : undefined,
                lunch: enabledMeals.lunch ? makeMealObj() : undefined,
                dinner: enabledMeals.dinner ? makeMealObj() : undefined,
            };
        },
        [hasBrunch, safeDailyCats, startDate]
    );

    useEffect(() => {
        setMenus((prev) => {
            if (!Array.isArray(prev) || prev.length === 0) return prev;

            return prev.map((m, idx) => {
                const enabledMeals = {
                    lunch: true,
                    dinner: true,
                    ...(m?.enabledMeals || {}),
                };

                const normMeal = (mealObj) => {
                    if (!mealObj || typeof mealObj !== "object") return mealObj;
                    const out = { ...mealObj };
                    for (const k of Object.keys(out)) {
                        out[k] = normalizeRecipeSelectedServings(out[k]);
                    }
                    return out;
                };

                return {
                    ...m,
                    dayIndex: m?.dayIndex ?? idx,
                    date: addDaysISO(startDate, idx),
                    enabledMeals,
                    brunch: normalizeRecipeSelectedServings(m?.brunch),
                    lunch: enabledMeals.lunch ? normMeal(m?.lunch || {}) : undefined,
                    dinner: enabledMeals.dinner ? normMeal(m?.dinner || {}) : undefined,
                };
            });
        });
    }, [startDate]);

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
        if (HIDDEN_ON_GENERATOR.has(c)) return;

        setCategories((prev) => {
            const has = prev.includes(c);
            const next = has ? prev.filter((x) => x !== c) : [...prev, c];
            return next.length === 0 ? [DEFAULT_CATEGORY] : next;
        });
    }, []);

    const generateMenus = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const base = Array.from({ length: d }, (_, dayIndex) => {
                const existing = menus?.[dayIndex];
                const rebuilt = buildEmptyMenuDay(dayIndex, existing);

                if (!existing) return rebuilt;

                if (hasBrunch) {
                    const brunchLocked = isSlotLocked({
                        dayIndex,
                        meal: "brunch",
                        categoryKey: "brunch",
                    });

                    rebuilt.brunch = brunchLocked
                        ? normalizeRecipeSelectedServings(existing?.brunch ?? null)
                        : null;
                }

                for (const cat of safeDailyCats) {
                    if (rebuilt.lunch) {
                        const lunchLocked = isSlotLocked({
                            dayIndex,
                            meal: "lunch",
                            categoryKey: cat,
                        });
                        rebuilt.lunch[cat] = lunchLocked
                            ? normalizeRecipeSelectedServings(existing?.lunch?.[cat] ?? null)
                            : null;
                    }

                    if (rebuilt.dinner) {
                        const dinnerLocked = isSlotLocked({
                            dayIndex,
                            meal: "dinner",
                            categoryKey: cat,
                        });
                        rebuilt.dinner[cat] = dinnerLocked
                            ? normalizeRecipeSelectedServings(existing?.dinner?.[cat] ?? null)
                            : null;
                    }
                }

                return rebuilt;
            });

            let exclude = [];
            for (const day of base) {
                if (day?.brunch?._id) exclude.push(day.brunch._id);
                for (const cat of safeDailyCats) {
                    if (day?.lunch?.[cat]?._id) exclude.push(day.lunch[cat]._id);
                    if (day?.dinner?.[cat]?._id) exclude.push(day.dinner[cat]._id);
                }
            }

            if (hasBrunch) {
                const targets = [];
                for (let i = 0; i < d; i++) {
                    if (base[i].brunch == null) targets.push(i);
                }

                if (targets.length > 0) {
                    let picked = [];
                    let localExclude = [...exclude];

                    for (let round = 0; round < 5 && picked.length < targets.length; round++) {
                        const batch = await fetchRandomRecipes({
                            count: targets.length - picked.length,
                            excludeIds: localExclude,
                            category: "brunch",
                        });
                        if (batch.length === 0) break;
                        picked = [...picked, ...batch];
                        localExclude = [
                            ...localExclude,
                            ...batch.map((r) => r?._id).filter(Boolean),
                        ];
                    }

                    while (picked.length < targets.length) {
                        const batch = await fetchRandomRecipes({
                            count: targets.length - picked.length,
                            excludeIds: [],
                            category: "brunch",
                        });
                        if (batch.length === 0) break;
                        picked = [...picked, ...batch];
                    }

                    targets.forEach((dayIndex, idx) => {
                        base[dayIndex].brunch = picked[idx] ?? null;
                    });

                    exclude = [...exclude, ...picked.map((r) => r?._id).filter(Boolean)];
                }
            }

            for (const cat of safeDailyCats) {
                const targets = [];
                for (let i = 0; i < d; i++) {
                    if (base[i].lunch && base[i].lunch?.[cat] == null)
                        targets.push({ dayIndex: i, meal: "lunch" });
                    if (base[i].dinner && base[i].dinner?.[cat] == null)
                        targets.push({ dayIndex: i, meal: "dinner" });
                }

                if (targets.length === 0) continue;

                let picked = [];
                let localExclude = [...exclude];

                for (let round = 0; round < 5 && picked.length < targets.length; round++) {
                    const batch = await fetchRandomRecipes({
                        count: targets.length - picked.length,
                        excludeIds: localExclude,
                        category: cat,
                    });
                    if (batch.length === 0) break;
                    picked = [...picked, ...batch];
                    localExclude = [
                        ...localExclude,
                        ...batch.map((r) => r?._id).filter(Boolean),
                    ];
                }

                while (picked.length < targets.length) {
                    const batch = await fetchRandomRecipes({
                        count: targets.length - picked.length,
                        excludeIds: [],
                        category: cat,
                    });
                    if (batch.length === 0) break;
                    picked = [...picked, ...batch];
                }

                targets.forEach((t, idx) => {
                    const r = picked[idx] ?? null;
                    if (!base[t.dayIndex][t.meal]) return;
                    base[t.dayIndex][t.meal][cat] = r;
                });

                exclude = [...exclude, ...picked.map((r) => r?._id).filter(Boolean)];
            }

            setMenus(base);
        } catch (e) {
            console.error(e);
            setError("Impossible de générer des menus pour le moment.");
        } finally {
            setLoading(false);
        }
    }, [
        buildEmptyMenuDay,
        d,
        fetchRandomRecipes,
        hasBrunch,
        isSlotLocked,
        menus,
        safeDailyCats,
    ]);

    const regenerateOne = useCallback(
        async ({ dayIndex, meal, categoryKey }) => {
            if (isSlotLocked({ dayIndex, meal, categoryKey: categoryKey ?? meal })) return;

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
                    (
                        await fetchRandomRecipes({
                            count: 1,
                            excludeIds: [],
                            category: meal === "brunch" ? "brunch" : categoryKey,
                        })
                    )?.[0] ??
                    null;

                setMenus((prev) =>
                    prev.map((m) => {
                        if (m.dayIndex !== dayIndex) return m;

                        if (meal === "brunch") {
                            return { ...m, brunch: normalizeRecipeSelectedServings(replacement) };
                        }

                        if (!m?.[meal]) return m;

                        return {
                            ...m,
                            [meal]: {
                                ...(m[meal] || {}),
                                [categoryKey]: normalizeRecipeSelectedServings(replacement),
                            },
                        };
                    })
                );
            } catch (e) {
                console.error(e);
                setError("Impossible de regénérer cette recette.");
            } finally {
                setLoading(false);
            }
        },
        [currentRecipeIds, fetchRandomRecipes, isSlotLocked, menus]
    );

    useEffect(() => {
        if (!loading && (!Array.isArray(menus) || menus.length === 0)) {
            generateMenus();
        }
    }, [menus, loading, generateMenus]);

    useEffect(() => {
        setMenus((prev) => {
            if (!Array.isArray(prev) || prev.length <= d) return prev;
            return prev.slice(0, d);
        });

        setLockedDays((prev) => {
            const next = { ...(prev || {}) };
            for (const k of Object.keys(next)) {
                const dayIndex = Number.parseInt(k, 10);
                if (!Number.isFinite(dayIndex) || dayIndex >= d) delete next[k];
            }
            return next;
        });

        setLockedSlots((prev) => {
            const next = { ...(prev || {}) };
            for (const k of Object.keys(next)) {
                const parsed = parseSlotKey(k);
                if (!Number.isFinite(parsed.dayIndex) || parsed.dayIndex >= d) delete next[k];
            }
            return next;
        });
    }, [d]);

    const badgeCategories = useMemo(
        () => CATEGORY_ORDER.filter((c) => !HIDDEN_ON_GENERATOR.has(c)),
        []
    );

    const startDateHelperLabel = useMemo(() => {
        if (isSameISODate(startDate, todayISO)) return "Aujourd’hui";
        const tomorrowISO = addDaysISO(todayISO, 1);
        if (isSameISODate(startDate, tomorrowISO)) return "Demain";

        const fmt = new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "short",
        });
        return capitalizeFirst(fmt.format(fromISOToLocalDate(startDate)));
    }, [startDate, todayISO]);

    const setSelectedServingsForSlot = useCallback(
        ({ dayIndex, meal, categoryKey, nextServings }) => {
            setMenus((prev) => {
                if (!Array.isArray(prev)) return prev;
                const next = [...prev];
                const day = next[dayIndex];
                if (!day) return prev;

                if (meal === "brunch") {
                    if (!day.brunch) return prev;
                    const baseRecipe = normalizeRecipeSelectedServings(day.brunch);
                    const updated = {
                        ...baseRecipe,
                        selectedServings: clampSelectedServingsWithBase(baseRecipe, nextServings),
                    };
                    next[dayIndex] = { ...day, brunch: updated };
                    return next;
                }

                if (!day?.[meal] || !categoryKey) return prev;
                const current = day[meal][categoryKey];
                if (!current) return prev;

                const baseRecipe = normalizeRecipeSelectedServings(current);
                const updated = {
                    ...baseRecipe,
                    selectedServings: clampSelectedServingsWithBase(baseRecipe, nextServings),
                };

                next[dayIndex] = {
                    ...day,
                    [meal]: {
                        ...(day[meal] || {}),
                        [categoryKey]: updated,
                    },
                };
                return next;
            });
        },
        []
    );

    return (
        <section className="container py-10 md:py-14">
            <div className="flex flex-col gap-6">
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-6">
                    <h2 className="mb-8">
                        <span className="relative inline-block">
                            Mon menu
                            <span className="absolute left-0 -bottom-1 h-1 w-40 bg-primary/20 rounded-full" />
                        </span>
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                        Génère ton menu de la semaine et ta liste de courses en un clic !
                    </p>
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-3 sm:p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                        {/* CONTROLS */}
                        <div className="flex-1 space-y-6">
                            {/* Ligne 1 : Date + jours */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="flex items-center gap-3 rounded-xl ring-1 ring-zinc-200 bg-zinc-50/60 px-3 py-2">
                                    <div className="min-w-[110px] leading-tight">
                                        <div className="text-xs font-semibold text-zinc-700">Date</div>
                                        <div className="text-[11px] text-zinc-500">{startDateHelperLabel}</div>
                                    </div>

                                    <input
                                        className="input h-9 w-full bg-white"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v && isISODate(v)) setStartDate(v);
                                        }}
                                    />
                                </label>

                                <label className="flex items-center gap-3 rounded-xl ring-1 ring-zinc-200 bg-zinc-50/60 px-3 py-2">
                                    <div className="min-w-[110px] leading-tight">
                                        <div className="text-xs font-semibold text-zinc-700">Jours</div>
                                        <div className="text-[11px] text-zinc-500">{d * 2} repas</div>
                                    </div>

                                    <input
                                        className="input h-9 w-full bg-white"
                                        type="number"
                                        min={MIN_DAYS}
                                        max={MAX_DAYS}
                                        value={days}
                                        onChange={(e) =>
                                            setDays(clampInt(e.target.value, MIN_DAYS, MAX_DAYS, DEFAULT_DAYS))
                                        }
                                    />
                                </label>
                            </div>

                            {/* Ligne 2 : Catégories (compact, horizontal) */}
                            <div className="rounded-xl ring-1 ring-zinc-200 bg-zinc-50/60 px-3 py-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-semibold text-zinc-700">Catégories</div>
                                    <div className="text-[11px] text-zinc-500 hidden sm:block">
                                        Par défaut : Plat — clique pour sélectionner
                                    </div>
                                </div>

                                <div className="mt-2 -mx-1 px-1">
                                    <div className="flex gap-4">
                                        {badgeCategories.map((c) => {
                                            const selected = categories.includes(c);
                                            return (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => toggleCategory(c)}
                                                    className={[
                                                        getBadgeClass(c),
                                                        "shrink-0",
                                                        "transition",
                                                        "ring-offset-2 ring-offset-white",
                                                        selected
                                                            ? "ring-2 ring-primary/40 opacity-100"
                                                            : "opacity-55 hover:opacity-90",
                                                    ].join(" ")}
                                                    aria-pressed={selected}
                                                    title={getCategoryLabel(c)}
                                                >
                                                    {getCategoryLabel(c)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-1 text-[11px] text-zinc-500 sm:hidden">
                                    Par défaut : Plat — clique pour sélectionner
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS (colonne compacte) */}
                        <div className="lg:w-[220px] w-full">
                            <div className="rounded-xl ring-1 ring-zinc-200 bg-zinc-50/60 p-2">
                                <div className="text-xs font-semibold text-zinc-700 px-1 pb-2">Actions</div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                                    <button
                                        className="btn-primary-sm whitespace-nowrap w-full"
                                        onClick={generateMenus}
                                        disabled={loading}
                                    >
                                        {loading ? "Génération..." : "Générer"}
                                    </button>

                                    <button
                                        className="btn-secondary-sm whitespace-nowrap w-full"
                                        onClick={() => navigate("/shopping-list", { state: { menus } })}
                                        disabled={loading || !menus?.length}
                                    >
                                        Liste de courses
                                    </button>

                                    <button
                                        className="btn-secondary-sm whitespace-nowrap w-full inline-flex items-center justify-center gap-2"
                                        onClick={unlockAll}
                                        disabled={loading}
                                        title="Enlève tous les verrous (recettes + journées)"
                                    >
                                        <FiUnlock />
                                        Déverrouiller
                                    </button>
                                </div>
                            </div>

                            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {menus.map((menu, idx) => (
                        <DayCard
                            key={menu.dayIndex}
                            menu={menu}
                            idx={idx}
                            startDate={startDate}
                            todayISO={todayISO}
                            hasBrunch={hasBrunch}
                            orderedDailyCats={orderedDailyCats}
                            isDayLocked={isDayLocked}
                            isSlotLocked={isSlotLocked}
                            toggleDayLock={toggleDayLock}
                            toggleSlotLock={toggleSlotLock}
                            setMealEnabled={setMealEnabled}
                            regenerateOne={regenerateOne}
                            setSelectedServingsForSlot={setSelectedServingsForSlot}
                        />
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
