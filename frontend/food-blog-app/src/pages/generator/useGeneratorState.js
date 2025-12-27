import { useCallback, useEffect, useMemo, useState } from "react";

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
import {
    addDaysISO,
    capitalizeFirst,
    formatDayLabelForCard,
    fromISOToLocalDate,
    isSameISODate,
    toLocalISODate,
} from "./dates";
import { pickRecipesWithRetries } from "./services";
import { clampInt, clampNumber, parseSlotKey, slotKey } from "./slots";
import { safeGetLS, safeJsonParse, safeSetLS } from "./storage";
import { normalizeRecipeSelectedServings } from "./servings";

/**
 * Le hook encapsule toute la logique métier du générateur.
 * Le composant `Generator.jsx` ne fait plus que du rendu.
 */
export default function useGeneratorState() {
    const todayISO = useMemo(() => toLocalISODate(new Date()), []);

    /** ---------- State: date + jours + catégories ---------- */
    const [startDate, setStartDate] = useState(() => {
        const saved = safeGetLS(LS.START_DATE);
        if (saved && ISO_DATE_RE.test(saved)) return saved;
        return toLocalISODate(new Date());
    });

    const [days, setDaysRaw] = useState(() => {
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

    /** ---------- State: menus + verrous ---------- */
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

    /** ---------- Persist to localStorage ---------- */
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

    /** ---------- Cleanup hidden categories once ---------- */
    useEffect(() => {
        setCategories((prev) => {
            const next = (prev || []).filter((c) => !HIDDEN_ON_GENERATOR.has(c));
            return next.length > 0 ? next : [DEFAULT_CATEGORY];
        });
    }, []);

    /** ---------- Derived values ---------- */
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

    /** ---------- Locks ---------- */
    const isDayLocked = useCallback((dayIndex) => !!lockedDays?.[dayIndex], [lockedDays]);

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

    /** ---------- Per-day meal enable (midi/soir) ---------- */
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

    /** ---------- Build day skeleton ---------- */
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

    /**
     * ✅ Rétro-compat + normalisation selectedServings + update dates quand startDate change
     */
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

    /** ---------- Current ids (avoid duplicates) ---------- */
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

    /**
     * Génération “intelligente” :
     * - garde ce qui est verrouillé (slot ou journée)
     * - remplit uniquement ce qui est déverrouillé
     * - respecte enabledMeals (midi/soir)
     */
    const generateMenus = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const base = Array.from({ length: d }, (_, dayIndex) => {
                const existing = menus?.[dayIndex];
                const rebuilt = buildEmptyMenuDay(dayIndex, existing);

                if (!existing) return rebuilt;

                // brunch
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

                // lunch/dinner (si activés)
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

            // ids déjà pris (verrouillés conservés)
            let exclude = [];
            for (const day of base) {
                if (day?.brunch?._id) exclude.push(day.brunch._id);
                for (const cat of safeDailyCats) {
                    if (day?.lunch?.[cat]?._id) exclude.push(day.lunch[cat]._id);
                    if (day?.dinner?.[cat]?._id) exclude.push(day.dinner[cat]._id);
                }
            }

            // brunch : on remplit uniquement les jours où brunch est null
            if (hasBrunch) {
                const targets = [];
                for (let i = 0; i < d; i++) {
                    if (base[i].brunch == null) targets.push(i);
                }

                if (targets.length > 0) {
                    const picked = await pickRecipesWithRetries({
                        count: targets.length,
                        excludeIds: exclude,
                        category: "brunch",
                    });

                    targets.forEach((dayIndex, idx) => {
                        base[dayIndex].brunch = picked[idx] ?? null;
                    });

                    exclude = [
                        ...exclude,
                        ...picked.map((r) => r?._id).filter(Boolean),
                    ];
                }
            }

            // lunch/dinner par catégorie (respecte enabledMeals)
            for (const cat of safeDailyCats) {
                const targets = []; // {dayIndex, meal}
                for (let i = 0; i < d; i++) {
                    if (base[i].lunch && base[i].lunch?.[cat] == null)
                        targets.push({ dayIndex: i, meal: "lunch" });
                    if (base[i].dinner && base[i].dinner?.[cat] == null)
                        targets.push({ dayIndex: i, meal: "dinner" });
                }

                if (targets.length === 0) continue;

                const picked = await pickRecipesWithRetries({
                    count: targets.length,
                    excludeIds: exclude,
                    category: cat,
                });

                targets.forEach((t, idx) => {
                    const r = picked[idx] ?? null;
                    if (!base[t.dayIndex][t.meal]) return;
                    base[t.dayIndex][t.meal][cat] = r;
                });

                exclude = [
                    ...exclude,
                    ...picked.map((r) => r?._id).filter(Boolean),
                ];
            }

            setMenus(base);
        } catch (e) {
            console.error(e);
            setError("Impossible de générer des menus pour le moment.");
        } finally {
            setLoading(false);
        }
    }, [buildEmptyMenuDay, d, hasBrunch, isSlotLocked, menus, safeDailyCats]);

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

                const [replacement] = await pickRecipesWithRetries({
                    count: 1,
                    excludeIds: exclude,
                    category: meal === "brunch" ? "brunch" : categoryKey,
                });

                setMenus((prev) =>
                    prev.map((m) => {
                        if (m.dayIndex !== dayIndex) return m;

                        if (meal === "brunch") {
                            return {
                                ...m,
                                brunch: normalizeRecipeSelectedServings(replacement ?? null),
                            };
                        }

                        // si le repas est désactivé, on ne touche pas
                        if (!m?.[meal]) return m;

                        return {
                            ...m,
                            [meal]: {
                                ...(m[meal] || {}),
                                [categoryKey]: normalizeRecipeSelectedServings(replacement ?? null),
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
        [currentRecipeIds, isSlotLocked, menus]
    );

    /**
     * ✅ Auto-génération uniquement si AUCUN menu n’existe déjà.
     */
    useEffect(() => {
        if (!loading && (!Array.isArray(menus) || menus.length === 0)) {
            generateMenus();
        }
    }, [menus, loading, generateMenus]);

    // si d diminue, on tronque menus + verrous jours/slots hors range
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

    /** ---------- Servings controls (±) : écrit dans selectedServings ---------- */
    const setSelectedServingsForSlot = useCallback(
        ({ dayIndex, meal, categoryKey, nextServings }) => {
            setMenus((prev) => {
                if (!Array.isArray(prev)) return prev;
                const next = [...prev];
                const day = next[dayIndex];
                if (!day) return prev;

                const clampWithBase = (recipe, n) => {
                    const base =
                        Number.isFinite(Number(recipe?.servings)) && Number(recipe.servings) > 0
                            ? Number(recipe.servings)
                            : 1;
                    return clampNumber(n, 1, 99, base);
                };

                if (meal === "brunch") {
                    if (!day.brunch) return prev;
                    const baseRecipe = normalizeRecipeSelectedServings(day.brunch);
                    const updated = {
                        ...baseRecipe,
                        selectedServings: clampWithBase(baseRecipe, nextServings),
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
                    selectedServings: clampWithBase(baseRecipe, nextServings),
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

    /** ---------- Days setter (clamp) ---------- */
    const setDays = useCallback((value) => {
        setDaysRaw(clampInt(value, MIN_DAYS, MAX_DAYS, DEFAULT_DAYS));
    }, []);

    return {
        // state
        menus,
        loading,
        error,
        days,
        d,
        categories,
        startDate,
        startDateHelperLabel,
        hasBrunch,
        orderedDailyCats,
        todayISO,

        // actions
        setStartDate,
        setDays,
        toggleCategory,
        unlockAll,
        generateMenus,
        regenerateOne,
        setMealEnabled,
        setSelectedServingsForSlot,

        // locks
        isDayLocked,
        isSlotLocked,
        toggleDayLock,
        toggleSlotLock,

        // dates helpers (utiles ailleurs si besoin)
        addDaysISO,
        formatDayLabelForCard,
    };
}
