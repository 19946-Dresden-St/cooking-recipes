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
import { FiUnlock, FiLock, FiUnlock as FiUnlockIcon } from "react-icons/fi";

const clampInt = (value, min, max, fallback) => {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
};

const buildExcludeParam = (ids) => ids.filter(Boolean).join(",");

const HIDDEN_ON_GENERATOR = new Set(["boisson", "sauce"]);

const DAILY_CATEGORIES = new Set(["apero", "entree", "plat", "dessert"]);
const DAILY_ORDER = ["apero", "entree", "plat", "dessert"];

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

/** ---------- LocalStorage keys ---------- */
const LS_MENUS = "generator:menus:v1";
const LS_LOCKED_SLOTS = "generator:lockedSlots:v1";
const LS_LOCKED_DAYS = "generator:lockedDays:v1";
const LS_DAYS = "generator:days:v1";
const LS_CATEGORIES = "generator:categories:v1";
const LS_START_DATE = "generator:startDate:v1";

/** slot key: dayIndex|meal|categoryKey */
const slotKey = ({ dayIndex, meal, categoryKey }) =>
    `${dayIndex}|${meal}|${categoryKey ?? ""}`;

const parseSlotKey = (key) => {
    const [d, meal, categoryKey] = String(key).split("|");
    return {
        dayIndex: Number.parseInt(d, 10),
        meal,
        categoryKey: categoryKey || undefined,
    };
};

const safeGetLS = (key) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const safeSetLS = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch {
        // ignore
    }
};

const safeJsonParse = (raw) => {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

/** ---------- Dates helpers (no libs) ---------- */
const pad2 = (n) => String(n).padStart(2, "0");

/**
 * YYYY-MM-DD en "local" (évite les décalages liés à toISOString() en UTC)
 */
const toLocalISODate = (date) => {
    const d = date instanceof Date ? date : new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/**
 * Construit un Date local à minuit à partir d'un YYYY-MM-DD
 */
const fromISOToLocalDate = (iso) => {
    // iso = "YYYY-MM-DD"
    return new Date(`${iso}T00:00:00`);
};

const addDaysISO = (startISO, offsetDays) => {
    const d = fromISOToLocalDate(startISO);
    d.setDate(d.getDate() + offsetDays);
    return toLocalISODate(d);
};

const isSameISODate = (a, b) => String(a) === String(b);

const capitalizeFirst = (s) => {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
};

const formatDayLabelForCard = ({ dateISO, todayISO }) => {
    // Affichage demandé : Aujourd’hui / Demain pour les 2 premiers, puis "Vendredi 26 déc."
    const date = fromISOToLocalDate(dateISO);

    const diffDays = (() => {
        const t = fromISOToLocalDate(todayISO);
        const ms = date.getTime() - t.getTime();
        return Math.round(ms / (1000 * 60 * 60 * 24));
    })();

    if (diffDays === 0) return "Aujourd’hui";
    if (diffDays === 1) return "Demain";

    const fmt = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "short",
    });

    // Exemple fr-FR souvent: "vendredi 26 déc."
    return capitalizeFirst(fmt.format(date));
};

export default function Generator() {
    usePageTitle("Générateur");

    const navigate = useNavigate();

    const todayISO = useMemo(() => toLocalISODate(new Date()), []);

    /**
     * ✅ Date de départ (datepicker)
     * - défaut : aujourd'hui
     * - persistée en localStorage
     */
    const [startDate, setStartDate] = useState(() => {
        const saved = safeGetLS(LS_START_DATE);
        // si saved est invalide/absent -> today
        if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) return saved;
        return toLocalISODate(new Date());
    });

    /**
     * ✅ Hydratation synchronisée dès le 1er rendu (évite l’écrasement par l’auto-génération)
     * + tolérance si menus a été enregistré par erreur en "objet" au lieu de "tableau"
     */
    const [days, setDays] = useState(() => {
        const saved = safeGetLS(LS_DAYS);
        return saved ? clampInt(saved, 1, 14, 7) : 7;
    });

    const [categories, setCategories] = useState(() => {
        const saved = safeGetLS(LS_CATEGORIES);
        if (!saved) return ["plat"];

        const parsed = safeJsonParse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
            const cleaned = parsed.filter((c) => !HIDDEN_ON_GENERATOR.has(c));
            return cleaned.length > 0 ? cleaned : ["plat"];
        }
        return ["plat"];
    });

    const [menus, setMenus] = useState(() => {
        const saved = safeGetLS(LS_MENUS);
        if (!saved) return [];

        const parsed = safeJsonParse(saved);

        // cas normal
        if (Array.isArray(parsed)) return parsed;

        // ✅ cas "bug" observé : un objet au lieu d’un tableau
        if (parsed && typeof parsed === "object") return [parsed];

        return [];
    });

    // 🔒 verrous : slots + jours
    const [lockedSlots, setLockedSlots] = useState(() => {
        const saved = safeGetLS(LS_LOCKED_SLOTS);
        if (!saved) return {};
        const parsed = safeJsonParse(saved);
        return parsed && typeof parsed === "object" ? parsed : {};
    });

    const [lockedDays, setLockedDays] = useState(() => {
        const saved = safeGetLS(LS_LOCKED_DAYS);
        if (!saved) return {};
        const parsed = safeJsonParse(saved);
        return parsed && typeof parsed === "object" ? parsed : {};
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /** ---------- Persist to localStorage ---------- */
    useEffect(() => {
        safeSetLS(LS_START_DATE, String(startDate));
    }, [startDate]);

    useEffect(() => {
        safeSetLS(LS_DAYS, String(days));
    }, [days]);

    useEffect(() => {
        safeSetLS(LS_CATEGORIES, JSON.stringify(categories));
    }, [categories]);

    useEffect(() => {
        // Toujours stocker un TABLEAU (même si 1 jour)
        const normalized = Array.isArray(menus)
            ? menus
            : menus && typeof menus === "object"
                ? [menus]
                : [];
        safeSetLS(LS_MENUS, JSON.stringify(normalized));
    }, [menus]);

    useEffect(() => {
        safeSetLS(LS_LOCKED_SLOTS, JSON.stringify(lockedSlots));
    }, [lockedSlots]);

    useEffect(() => {
        safeSetLS(LS_LOCKED_DAYS, JSON.stringify(lockedDays));
    }, [lockedDays]);

    /** ---------- Cleanup hidden categories once ---------- */
    useEffect(() => {
        setCategories((prev) => {
            const next = (prev || []).filter((c) => !HIDDEN_ON_GENERATOR.has(c));
            return next.length > 0 ? next : ["plat"];
        });
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

    /** ---------- Helpers: get/set recipe at slot ---------- */
    const getRecipeAt = useCallback(
        ({ dayIndex, meal, categoryKey }) => {
            const m = menus?.[dayIndex];
            if (!m) return null;
            if (meal === "brunch") return m?.brunch ?? null;
            return m?.[meal]?.[categoryKey] ?? null;
        },
        [menus]
    );

    const setRecipeAt = useCallback(({ dayIndex, meal, categoryKey, recipe }) => {
        setMenus((prev) => {
            const next = Array.isArray(prev) ? [...prev] : [];
            const baseDay = next[dayIndex] ?? null;
            if (!baseDay) return prev;

            const updated = { ...baseDay };

            if (meal === "brunch") {
                updated.brunch = recipe;
            } else {
                updated[meal] = { ...(updated[meal] || {}) };
                updated[meal][categoryKey] = recipe;
            }

            next[dayIndex] = updated;
            return next;
        });
    }, []);

    /** ---------- Locks ---------- */
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

    const unlockDay = useCallback((dayIndex) => {
        setLockedDays((prev) => {
            const next = { ...(prev || {}) };
            if (next[dayIndex]) delete next[dayIndex];
            return next;
        });

        // Optionnel : on enlève aussi les locks de slots sur ce jour
        setLockedSlots((prev) => {
            const next = { ...(prev || {}) };
            for (const k of Object.keys(next)) {
                const parsed = parseSlotKey(k);
                if (parsed.dayIndex === dayIndex) delete next[k];
            }
            return next;
        });
    }, []);

    /** ---------- Current ids (for avoiding duplicates) ---------- */
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
            return next.length === 0 ? ["plat"] : next;
        });
    }, []);

    const fetchRandomRecipes = useCallback(
        async ({ count, excludeIds = [], category }) => {
            const params = new URLSearchParams();
            params.set("count", String(count));
            params.set("category", String(category || "plat"));
            if (excludeIds.length > 0)
                params.set("exclude", buildExcludeParam(excludeIds));

            const url = `${API_BASE_URL}/recipe/random?${params.toString()}`;
            const res = await axios.get(url);
            return Array.isArray(res.data) ? res.data : [];
        },
        []
    );

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
                date: addDaysISO(startDate, dayIndex), // ✅ on stocke la date (YYYY-MM-DD)
                brunch: hasBrunch ? null : undefined,
                lunch,
                dinner,
            };
        },
        [hasBrunch, safeDailyCats, startDate]
    );

    /**
     * Si l'utilisateur change la date de départ :
     * - on met à jour la propriété `date` de chaque jour existant
     * - sans toucher aux recettes/verrous
     */
    useEffect(() => {
        setMenus((prev) => {
            if (!Array.isArray(prev) || prev.length === 0) return prev;
            return prev.map((m, idx) => ({
                ...m,
                dayIndex: m?.dayIndex ?? idx,
                date: addDaysISO(startDate, idx),
            }));
        });
    }, [startDate]);

    /**
     * Génération “intelligente” :
     * - garde ce qui est verrouillé (slot ou journée)
     * - remplit uniquement ce qui est déverrouillé
     */
    const generateMenus = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            // base = length d
            const base = Array.from({ length: d }, (_, dayIndex) => {
                const empty = buildEmptyMenuDay(dayIndex);
                const existing = menus?.[dayIndex];

                // si pas d'existant, on part de empty
                if (!existing) return empty;

                // sinon, on reconstruit en gardant ce qui est verrouillé
                const rebuilt = buildEmptyMenuDay(dayIndex);

                if (hasBrunch) {
                    const brunchLocked = isSlotLocked({
                        dayIndex,
                        meal: "brunch",
                        categoryKey: "brunch",
                    });
                    rebuilt.brunch = brunchLocked ? existing?.brunch ?? null : null;
                }

                for (const cat of safeDailyCats) {
                    const lunchLocked = isSlotLocked({
                        dayIndex,
                        meal: "lunch",
                        categoryKey: cat,
                    });
                    const dinnerLocked = isSlotLocked({
                        dayIndex,
                        meal: "dinner",
                        categoryKey: cat,
                    });

                    rebuilt.lunch[cat] = lunchLocked ? existing?.lunch?.[cat] ?? null : null;
                    rebuilt.dinner[cat] = dinnerLocked ? existing?.dinner?.[cat] ?? null : null;
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

            // brunch : on remplit uniquement les jours où brunch est null (donc non verrouillé)
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

                    exclude = [
                        ...exclude,
                        ...picked.map((r) => r?._id).filter(Boolean),
                    ];
                }
            }

            // lunch/dinner par catégorie
            for (const cat of safeDailyCats) {
                const targets = []; // {dayIndex, meal}
                for (let i = 0; i < d; i++) {
                    if (base[i].lunch?.[cat] == null) targets.push({ dayIndex: i, meal: "lunch" });
                    if (base[i].dinner?.[cat] == null) targets.push({ dayIndex: i, meal: "dinner" });
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
            // si verrouillé (slot ou jour), on ne fait rien
            if (isSlotLocked({ dayIndex, meal, categoryKey: categoryKey ?? meal })) {
                return;
            }

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
                            return { ...m, brunch: replacement };
                        }

                        return {
                            ...m,
                            [meal]: {
                                ...(m[meal] || {}),
                                [categoryKey]: replacement,
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

    /**
     * ✅ Auto-génération uniquement si AUCUN menu n’existe déjà.
     * (et surtout pas avec un useEffect([]) qui utiliserait les valeurs par défaut)
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

    const badgeCategories = useMemo(
        () => CATEGORY_ORDER.filter((c) => !HIDDEN_ON_GENERATOR.has(c)),
        []
    );

    const startDateHelperLabel = useMemo(() => {
        if (isSameISODate(startDate, todayISO)) return "Aujourd’hui";
        // Optionnel : afficher "Demain" si startDate = today + 1
        const tomorrowISO = addDaysISO(todayISO, 1);
        if (isSameISODate(startDate, tomorrowISO)) return "Demain";

        const fmt = new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "short",
        });
        return capitalizeFirst(fmt.format(fromISOToLocalDate(startDate)));
    }, [startDate, todayISO]);

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
                        Génère tes menus, verrouille des recettes, et reviens plus tard sans rien perdre.
                    </p>
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* ✅ Datepicker à gauche */}
                            <label className="space-y-1">
                                <div className="text-sm font-semibold text-zinc-700">
                                    Date de départ
                                </div>
                                <input
                                    className="input h-10"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) setStartDate(v);
                                    }}
                                />
                                <div className="text-xs text-zinc-500">{startDateHelperLabel}</div>
                            </label>

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

                        {/* 🔓 Déverrouiller tout */}
                        <button
                            className="btn-secondary-sm whitespace-nowrap w-full md:w-auto inline-flex items-center justify-center gap-2"
                            onClick={unlockAll}
                            disabled={loading}
                            title="Enlève tous les verrous (recettes + journées)"
                        >
                            <FiUnlock />
                            Déverrouiller tout
                        </button>
                    </div>

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {menus.map((menu, idx) => {
                        const dayLocked = isDayLocked(menu.dayIndex);

                        // ✅ label de carte basé sur `menu.date`
                        const dateISO = menu?.date ?? addDaysISO(startDate, idx);
                        const dayTitle = formatDayLabelForCard({ dateISO, todayISO });

                        return (
                            <div
                                key={menu.dayIndex}
                                className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4"
                            >
                                <div className="flex items-center justify-between mb-3 gap-2">
                                    <h3 className="text-primary font-extrabold">
                                        {dayTitle}
                                    </h3>

                                    <div className="flex items-center gap-2">
                                        {/* ✅ Un seul bouton icône pour lock/unlock journée */}
                                        <button
                                            type="button"
                                            className={[
                                                "btn-secondary-sm",
                                                "whitespace-nowrap",
                                                dayLocked ? "ring-2 ring-primary/30" : "",
                                            ].join(" ")}
                                            onClick={() => toggleDayLock(menu.dayIndex)}
                                            title={
                                                dayLocked
                                                    ? "Journée verrouillée : aucune recette ne peut être regénérée"
                                                    : "Verrouiller toute la journée"
                                            }
                                            aria-label={
                                                dayLocked
                                                    ? "Déverrouiller la journée"
                                                    : "Verrouiller la journée"
                                            }
                                        >
                                            {dayLocked ? <FiLock /> : <FiUnlockIcon />}
                                        </button>
                                    </div>
                                </div>

                                {hasBrunch && (
                                    <div className="mb-4">
                                        <SectionTitle icon="☕">Brunch</SectionTitle>
                                        <div className="rounded-xl ring-1 ring-zinc-200 overflow-hidden divide-y divide-zinc-200">
                                            <GeneratorRecipeCard
                                                embedded
                                                recipe={menu.brunch}
                                                locked={isSlotLocked({
                                                    dayIndex: menu.dayIndex,
                                                    meal: "brunch",
                                                    categoryKey: "brunch",
                                                })}
                                                onToggleLock={() =>
                                                    toggleSlotLock({
                                                        dayIndex: menu.dayIndex,
                                                        meal: "brunch",
                                                        categoryKey: "brunch",
                                                    })
                                                }
                                                onRegenerate={() =>
                                                    regenerateOne({
                                                        dayIndex: menu.dayIndex,
                                                        meal: "brunch",
                                                    })
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
                                                locked={isSlotLocked({
                                                    dayIndex: menu.dayIndex,
                                                    meal: "lunch",
                                                    categoryKey: cat,
                                                })}
                                                onToggleLock={() =>
                                                    toggleSlotLock({
                                                        dayIndex: menu.dayIndex,
                                                        meal: "lunch",
                                                        categoryKey: cat,
                                                    })
                                                }
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
                                                locked={isSlotLocked({
                                                    dayIndex: menu.dayIndex,
                                                    meal: "dinner",
                                                    categoryKey: cat,
                                                })}
                                                onToggleLock={() =>
                                                    toggleSlotLock({
                                                        dayIndex: menu.dayIndex,
                                                        meal: "dinner",
                                                        categoryKey: cat,
                                                    })
                                                }
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
                        );
                    })}
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
