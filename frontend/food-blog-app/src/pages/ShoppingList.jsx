import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle";

/**
 * Helpers
 */

const stripDiacritics = (s) =>
    String(s ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

const cleanSpaces = (s) => String(s ?? "").trim().replace(/\s+/g, " ");

const toNumber = (raw) => {
    if (!raw) return null;

    // 1/2, 3/4...
    const frac = String(raw).match(/^(\d+)\s*\/\s*(\d+)$/);
    if (frac) {
        const a = Number(frac[1]);
        const b = Number(frac[2]);
        if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }

    // 1,5 -> 1.5
    const n = Number(String(raw).replace(",", "."));
    return Number.isFinite(n) ? n : null;
};

// unités fréquentes (tu peux en ajouter quand tu veux)
const UNIT_ALIASES = new Map([
    // mass
    ["g", "g"],
    ["gr", "g"],
    ["gramme", "g"],
    ["grammes", "g"],
    ["kg", "kg"],
    ["kilo", "kg"],
    ["kilos", "kg"],

    // volume
    ["ml", "ml"],
    ["cl", "cl"],
    ["l", "l"],
    ["litre", "l"],
    ["litres", "l"],

    // pièces / mesures cuisine
    ["piece", "pc"],
    ["pieces", "pc"],
    ["pc", "pc"],
    ["pce", "pc"],

    ["c", "c"],
    ["cas", "càs"],
    ["càs", "càs"],
    ["cuillere a soupe", "càs"],
    ["cuilleres a soupe", "càs"],
    ["cuillere a soupe(s)", "càs"],
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

const singularizeFr = (word) => {
    const w = String(word);
    if (w.length <= 3) return w;
    if (w.endsWith("oeufs")) return w.slice(0, -1);
    if (w.endsWith("s") && !w.endsWith("us") && !w.endsWith("is")) return w.slice(0, -1);
    if (w.endsWith("x") && !w.endsWith("eaux")) return w.slice(0, -1);
    return w;
};

const normalizeLabelKey = (label) => {
    let s = cleanSpaces(String(label ?? "").toLowerCase());
    s = stripDiacritics(s);

    s = s
        .replace(/^(de|du|des|d')\s+/i, "")
        .replace(/^(la|le|les|un|une)\s+/i, "");
    s = s.replace(/\s+(de|du|des|d')\s+/gi, " ");
    s = cleanSpaces(s);

    const parts = s.split(" ").map((p) => singularizeFr(p));
    return cleanSpaces(parts.join(" "));
};

const prettifyLabel = (label) => cleanSpaces(String(label ?? ""));

const parseIngredientLine = (line) => {
    const raw = cleanSpaces(line);
    if (!raw) return null;

    const mQty = raw.match(/^(\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+)\s*(.*)$/);
    if (!mQty) return { qty: null, unit: "", label: raw, rawLabel: raw };

    const qty = toNumber(mQty[1]);
    if (qty === null) return { qty: null, unit: "", label: raw, rawLabel: raw };

    let rest = cleanSpaces(mQty[2] ?? "");
    if (!rest) return { qty: null, unit: "", label: raw, rawLabel: raw };

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
        if (!label) {
            return { qty: null, unit: "", label: raw, rawLabel: raw };
        }
    }

    return {
        qty,
        unit,
        label: prettifyLabel(label),
        rawLabel: label,
    };
};

const formatQty = (n) => {
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    const rounded = Math.round(n * 100) / 100;
    return String(rounded).replace(".", ",");
};

const getRecipeMultiplier = (recipe) => {
    if (!recipe) return 1;

    const base = Number.isFinite(recipe.servings) && recipe.servings > 0 ? recipe.servings : 1;
    const selected =
        Number.isFinite(recipe.selectedServings) && recipe.selectedServings > 0
            ? recipe.selectedServings
            : base;

    return selected / base;
};

export default function ShoppingList() {
    usePageTitle("Qu'est-ce qu'on mange ? | Liste de course");

    const navigate = useNavigate();
    const location = useLocation();

    const menus = location?.state?.menus ?? [];

    const result = useMemo(() => {
        const totals = new Map(); // key -> { labelPretty, qty, unit }
        const singles = new Map(); // key -> labelPretty

        const pushLine = (line, multiplier = 1) => {
            const parsed = parseIngredientLine(line);
            if (!parsed) return;

            const labelKey = normalizeLabelKey(parsed.label);
            if (!labelKey) return;

            const unitKey = normalizeUnit(parsed.unit);
            const key = `${unitKey}::${labelKey}`;

            if (parsed.qty === null) {
                if (!singles.has(key)) singles.set(key, parsed.label);
                return;
            }

            const scaledQty = parsed.qty * (Number.isFinite(multiplier) ? multiplier : 1);

            const prev = totals.get(key);
            if (!prev) {
                totals.set(key, {
                    labelPretty: parsed.label,
                    qty: scaledQty,
                    unit: parsed.unit,
                });
            } else {
                totals.set(key, {
                    ...prev,
                    qty: prev.qty + scaledQty,
                });
            }
        };

        for (const day of menus) {
            if (!day) continue;

            // brunch
            if (day.brunch?.ingredients) {
                const mult = getRecipeMultiplier(day.brunch);
                for (const ing of day.brunch.ingredients) pushLine(ing, mult);
            }

            // lunch/dinner
            for (const mealKey of ["lunch", "dinner"]) {
                const meal = day?.[mealKey];
                if (!meal) continue;

                for (const catKey of Object.keys(meal)) {
                    const recipe = meal[catKey];
                    const ingredients = recipe?.ingredients;
                    if (!Array.isArray(ingredients)) continue;

                    const mult = getRecipeMultiplier(recipe);
                    for (const ing of ingredients) pushLine(ing, mult);
                }
            }
        }

        const items = [];

        for (const [, v] of totals) {
            const q = formatQty(v.qty);
            const u = v.unit ? `${v.unit} ` : "";
            items.push(`${q} ${u}${v.labelPretty}`.trim());
        }

        for (const [, label] of singles) {
            items.push(label);
        }

        items.sort((a, b) => a.localeCompare(b, "fr"));
        return items;
    }, [menus]);

    return (
        <div className="max-w-5xl mx-auto px-4 pb-12">
            <div className="flex items-center justify-between gap-3 mt-6">
                <h1 className="text-2xl font-extrabold text-primary">Liste de course</h1>

                <button className="btn-secondary-sm whitespace-nowrap" onClick={() => navigate(-1)}>
                    Retour
                </button>
            </div>

            {!Array.isArray(menus) || menus.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4 text-sm text-zinc-600">
                    Aucun menu trouvé. Reviens au générateur et clique sur “Liste de course”.
                </div>
            ) : (
                <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4">
                    {result.length === 0 ? (
                        <p className="text-sm text-zinc-600">Aucun ingrédient.</p>
                    ) : (
                        <ul className="list-disc pl-6 space-y-1 text-sm text-zinc-700">
                            {result.map((line) => (
                                <li key={line}>{line}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
