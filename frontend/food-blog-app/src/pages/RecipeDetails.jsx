import React from "react";
import { useLoaderData } from "react-router-dom";
import { API_BASE_URL } from "../apiBase.js";
import usePageTitle from "../hooks/usePageTitle.js";
import { getCategoryLabel } from "../utils/categories.js";
import { formatDuration } from "../utils/formatDuration";

/**
 * Helpers (INGRÉDIENTS) — parse + scale + format
 */

const stripDiacritics = (s) =>
    String(s ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

const cleanSpaces = (s) => String(s ?? "").trim().replace(/\s+/g, " ");

const toNumber = (raw) => {
    if (!raw) return null;

    // fraction: "1/2"
    const frac = String(raw).match(/^(\d+)\s*\/\s*(\d+)$/);
    if (frac) {
        const a = Number(frac[1]);
        const b = Number(frac[2]);
        if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }

    const n = Number(String(raw).replace(",", "."));
    return Number.isFinite(n) ? n : null;
};

const formatQty = (n) => {
    if (!Number.isFinite(n)) return "";
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    const rounded = Math.round(n * 100) / 100;
    return String(rounded).replace(".", ",");
};

const UNIT_ALIASES = new Map([
    ["g", "g"],
    ["gr", "g"],
    ["gramme", "g"],
    ["grammes", "g"],
    ["kg", "kg"],
    ["kilo", "kg"],
    ["kilos", "kg"],

    ["ml", "ml"],
    ["cl", "cl"],
    ["l", "l"],
    ["litre", "l"],
    ["litres", "l"],

    ["piece", "pc"],
    ["pieces", "pc"],
    ["pc", "pc"],
    ["pce", "pc"],

    ["cas", "càs"],
    ["càs", "càs"],
    ["cuillere a soupe", "càs"],
    ["cuilleres a soupe", "càs"],
    ["c a soupe", "càs"],
    ["c. a soupe", "càs"],
    ["c. à soupe", "càs"],

    ["cac", "càc"],
    ["càc", "càc"],
    ["cuillere a cafe", "càc"],
    ["cuilleres a cafe", "càc"],
    ["c a cafe", "càc"],
    ["c. a cafe", "càc"],
    ["c. à café", "càc"],
    ["c. a café", "càc"],

    ["pincee", "pincée"],
    ["pincees", "pincée"],

    ["tranche", "tranche"],
    ["tranches", "tranche"],
]);

const normalizeUnit = (rawUnit) => {
    const u = cleanSpaces(stripDiacritics(String(rawUnit ?? "").toLowerCase()));
    if (!u) return "";
    const cleaned = u.replace(/[().]/g, "");
    return UNIT_ALIASES.get(cleaned) ?? cleaned;
};

/**
 * Parse ligne type: "200 g farine" / "1/2 l lait" / "2 oeufs" / "sel"
 * => { qty, unit, label, raw }
 */
const parseIngredientLine = (line) => {
    const raw = cleanSpaces(line);
    if (!raw) return null;

    const mQty = raw.match(/^(\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+)\s*(.*)$/);
    if (!mQty) return { qty: null, unit: "", label: raw, raw };

    const qty = toNumber(mQty[1]);
    if (qty === null) return { qty: null, unit: "", label: raw, raw };

    let rest = cleanSpaces(mQty[2] ?? "");
    if (!rest) return { qty: null, unit: "", label: raw, raw };

    const tokens = rest.split(" ");
    const first = tokens[0] ?? "";
    const unitNorm = normalizeUnit(first);

    let unit = "";
    let label = rest;

    const looksLikeUnit =
        UNIT_ALIASES.has(cleanSpaces(stripDiacritics(first.toLowerCase())).replace(/[().]/g, "")) ||
        /^(g|kg|ml|cl|l)$/i.test(first);

    if (looksLikeUnit) {
        unit = unitNorm || cleanSpaces(first);
        label = cleanSpaces(tokens.slice(1).join(" "));
        if (!label) return { qty: null, unit: "", label: raw, raw };
    }

    return { qty, unit, label, raw };
};

const scaleIngredientLine = (line, multiplier) => {
    const parsed = parseIngredientLine(line);
    if (!parsed) return "";

    // si pas de quantité -> inchangé
    if (parsed.qty === null) return parsed.raw;

    const scaled = parsed.qty * (Number.isFinite(multiplier) ? multiplier : 1);
    const qty = formatQty(scaled);

    // reconstruction
    if (parsed.unit) return `${qty} ${parsed.unit} ${parsed.label}`.trim();
    return `${qty} ${parsed.label}`.trim();
};

export default function RecipeDetails() {
    const recipe = useLoaderData();
    usePageTitle(`Qu'est-ce qu'on mange ? | ${recipe?.title ?? "Recette"}`);

    const categoryValue = recipe?.category ?? "plat";
    const categoryLabel = getCategoryLabel(categoryValue);

    // ====== Cover
    const coverSrc = React.useMemo(() => {
        const c = recipe?.coverImage;
        if (!c) return "";
        return c.startsWith("http") ? c : `${API_BASE_URL}/images/${c}`;
    }, [recipe]);

    // ====== Instructions normalisées
    const normalizedInstructions = React.useMemo(() => {
        const raw = recipe?.instructions;
        if (Array.isArray(raw)) return raw.filter(Boolean);
        if (typeof raw === "string") {
            return raw
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean);
        }
        return [];
    }, [recipe]);

    // ====== Ingredients normalisés
    const baseIngredients = React.useMemo(() => {
        const arr = recipe?.ingredients ?? [];
        return Array.isArray(arr) ? arr.filter(Boolean) : [];
    }, [recipe]);

    // ====== Servings
    const baseServings = React.useMemo(() => {
        const s = Number(recipe?.servings);
        return Number.isFinite(s) && s > 0 ? s : 1;
    }, [recipe?.servings]);

    const [servings, setServings] = React.useState(baseServings);

    React.useEffect(() => {
        // quand on change de recette, on reset les servings sur la recette
        setServings(baseServings);
    }, [recipe?._id, baseServings]);

    const multiplier = React.useMemo(() => servings / baseServings, [servings, baseServings]);

    const scaledIngredients = React.useMemo(() => {
        return baseIngredients.map((line) => scaleIngredientLine(line, multiplier));
    }, [baseIngredients, multiplier]);

    // ====== checklist ingrédients
    const [checkedIngredients, setCheckedIngredients] = React.useState(() => new Set());

    React.useEffect(() => {
        setCheckedIngredients(new Set());
    }, [recipe?._id, servings]); // reset si recette OU servings change

    const toggleIngredient = (idx) => {
        setCheckedIngredients((prev) => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    const checkedIngCount = checkedIngredients.size;
    const totalIngCount = scaledIngredients.length;

    // ====== checklist étapes
    const [checkedSteps, setCheckedSteps] = React.useState(() => new Set());

    React.useEffect(() => {
        setCheckedSteps(new Set());
    }, [recipe?._id]);

    const toggleStep = (idx) => {
        setCheckedSteps((prev) => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    // ====== handlers servings
    const clampServings = (n) => {
        const v = Math.round(Number(n));
        if (!Number.isFinite(v)) return baseServings;
        return Math.min(30, Math.max(1, v)); // limite 1..30 (à ajuster)
    };

    const decServings = () => setServings((s) => clampServings(s - 1));
    const incServings = () => setServings((s) => clampServings(s + 1));

    return (
        <section className="bg-secondary">
            {/* HERO */}
            <div className="relative">
                <div className="h-[260px] md:h-[360px] w-full overflow-hidden">
                    {coverSrc ? (
                        <img
                            src={coverSrc}
                            alt={recipe?.title ?? "Recette"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="h-full w-full bg-zinc-200" />
                    )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/0" />

                <div className="absolute inset-x-0 bottom-0">
                    <div className="mx-auto max-w-5xl px-4 pb-6 md:pb-8">
                        <p className="text-sm text-white/85">
                            Postée par{" "}
                            <span className="font-semibold text-white">{recipe?.username ?? "Anonyme"}</span>
                        </p>

                        <h1 className="mt-2 text-white drop-shadow-sm">{recipe?.title ?? "Recette"}</h1>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge>{categoryLabel}</Badge>
                            <Badge>
                                <span aria-hidden>⏱</span>
                                <span>{formatDuration(recipe?.time)}</span>
                            </Badge>

                            {/* ✅ Servings interactif */}
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-white/30">
                                <span aria-hidden>👤</span>
                                <button
                                    type="button"
                                    onClick={decServings}
                                    className="h-7 w-7 rounded-full bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-secondary/60"
                                    aria-label="Diminuer le nombre de personnes"
                                >
                                    −
                                </button>

                                <div className="w-12">
                                    <input
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={servings}
                                        onChange={(e) => setServings(clampServings(e.target.value))}
                                        inputMode="numeric"
                                        className="w-full bg-transparent text-center tabular-nums outline-none leading-none px-0 py-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={incServings}
                                    className="h-7 w-7 rounded-full bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-secondary/60"
                                    aria-label="Augmenter le nombre de personnes"
                                >
                                    +
                                </button>

                                <span className="text-white/0 select-none">.</span>
                            </div>
                        </div>

                        {/* petit hint */}
                        <p className="mt-2 text-xs text-white/75">
                            Base recette : {baseServings} pers. — ajusté à {servings} pers.
                        </p>
                    </div>
                </div>
            </div>

            {/* CONTENU */}
            <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
                <div className="grid gap-6 items-start md:grid-cols-[380px_1fr]">
                    {/* INGREDIENTS */}
                    <aside className="md:sticky md:top-6">
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-primary text-xl font-extrabold">Ingrédients</h2>
                                    <p className="mt-1 text-xs text-zinc-500">Coche au fur et à mesure.</p>
                                </div>

                                <div className="text-right">
                                    <div className="text-xs font-semibold text-zinc-600">
                                        {totalIngCount ? `${checkedIngCount}/${totalIngCount}` : "—"}
                                    </div>
                                    <div className="mt-2 h-2 w-24 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200">
                                        <div
                                            className="h-full bg-primary"
                                            style={{
                                                width: totalIngCount
                                                    ? `${Math.round((checkedIngCount / totalIngCount) * 100)}%`
                                                    : "0%",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {scaledIngredients.length === 0 ? (
                                <p className="mt-4 text-sm text-zinc-600">Aucun ingrédient.</p>
                            ) : (
                                <ul className="mt-5 space-y-2">
                                    {scaledIngredients.map((item, idx) => {
                                        const isOn = checkedIngredients.has(idx);
                                        return (
                                            <li key={idx}>
                                                <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-secondary/60">
                                                    <input
                                                        type="checkbox"
                                                        checked={isOn}
                                                        onChange={() => toggleIngredient(idx)}
                                                        className="mt-1 h-4 w-4 accent-primary"
                                                    />
                                                    <span
                                                        className={`text-sm leading-snug ${
                                                            isOn ? "line-through text-zinc-400" : "text-zinc-800"
                                                        }`}
                                                    >
                            {item}
                          </span>
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </aside>

                    {/* INSTRUCTIONS */}
                    <main className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                        <div className="flex items-baseline justify-between gap-3">
                            <h2 className="text-primary text-xl font-extrabold">Instructions</h2>

                            {normalizedInstructions.length > 0 && (
                                <span className="text-xs text-zinc-500">
                  {checkedSteps.size}/{normalizedInstructions.length} faites
                </span>
                            )}
                        </div>

                        {normalizedInstructions.length === 0 ? (
                            <p className="mt-4 leading-relaxed text-zinc-800">Aucune instruction.</p>
                        ) : (
                            <ol className="mt-4 space-y-2">
                                {normalizedInstructions.map((step, idx) => {
                                    const done = checkedSteps.has(idx);

                                    return (
                                        <li key={idx}>
                                            <label className="group flex cursor-pointer gap-3 rounded-xl p-2 hover:bg-secondary/60">
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 h-4 w-4 accent-primary"
                                                    checked={done}
                                                    onChange={() => toggleStep(idx)}
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start gap-3">
                            <span
                                className={[
                                    "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1",
                                    done
                                        ? "bg-zinc-100 text-zinc-400 ring-zinc-200"
                                        : "bg-secondary text-primary ring-zinc-200",
                                ].join(" ")}
                            >
                              {idx + 1}
                            </span>

                                                        <p
                                                            className={[
                                                                "min-w-0 leading-relaxed whitespace-pre-line text-zinc-800",
                                                                done ? "line-through text-zinc-400" : "",
                                                            ].join(" ")}
                                                        >
                                                            {step}
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </main>
                </div>
            </div>
        </section>
    );
}

function Badge({ children }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-white/30">
            {children}
        </div>
    );
}
