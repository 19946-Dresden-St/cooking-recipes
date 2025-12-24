import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle";
import { formatDuration } from "../utils/formatDuration";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Helpers (INGRÉDIENTS)
 */

const stripDiacritics = (s) =>
    String(s ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

const cleanSpaces = (s) => String(s ?? "").trim().replace(/\s+/g, " ");

const toNumber = (raw) => {
    if (!raw) return null;

    const frac = String(raw).match(/^(\d+)\s*\/\s*(\d+)$/);
    if (frac) {
        const a = Number(frac[1]);
        const b = Number(frac[2]);
        if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }

    const n = Number(String(raw).replace(",", "."));
    return Number.isFinite(n) ? n : null;
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

    s = s.replace(/^(de|du|des|d')\s+/i, "").replace(/^(la|le|les|un|une)\s+/i, "");
    s = s.replace(/\s+(de|du|des|d')\s+/gi, " ");
    s = cleanSpaces(s);

    const parts = s.split(" ").map((p) => singularizeFr(p));
    return cleanSpaces(parts.join(" "));
};

const parseIngredientLine = (line) => {
    const raw = cleanSpaces(line);
    if (!raw) return null;

    const mQty = raw.match(/^(\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+)\s*(.*)$/);
    if (!mQty) return { qty: null, unit: "", label: raw };

    const qty = toNumber(mQty[1]);
    if (qty === null) return { qty: null, unit: "", label: raw };

    let rest = cleanSpaces(mQty[2] ?? "");
    if (!rest) return { qty: null, unit: "", label: raw };

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
        if (!label) return { qty: null, unit: "", label: raw };
    }

    return { qty, unit, label };
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

/**
 * Helpers (DATES)
 */
const fromISOToLocalDate = (iso) => {
    if (!iso || typeof iso !== "string") return null;
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    return new Date(y, mo - 1, d);
};

const capitalizeFirst = (s) => {
    const str = String(s ?? "");
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatDayLabel = (dateISO) => {
    const d = fromISOToLocalDate(dateISO);
    if (!d) return "Jour";
    const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "short" });
    return capitalizeFirst(fmt.format(d));
};

/**
 * ✅ Transforme une liste en tableau "rows x cols" pour autoTable
 * (remplit par colonnes pour économiser la hauteur)
 */
const chunkIntoColumns = (items, cols) => {
    const arr = Array.isArray(items) ? items : [];
    if (!arr.length) return [];
    const rows = Math.ceil(arr.length / cols);
    const out = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const idx = r + c * rows; // 👈 remplissage vertical (colonne 1 puis 2 puis 3)
            row.push(arr[idx] ?? "");
        }
        out.push(row);
    }
    return out;
};

const ensureSpace = (doc, y, minRemaining = 90) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y > pageHeight - minRemaining) {
        doc.addPage();
        return 48;
    }
    return y;
};

export default function ShoppingList() {
    usePageTitle("Qu'est-ce qu'on mange ? | Liste de course");

    const navigate = useNavigate();
    const location = useLocation();
    const menus = location?.state?.menus ?? [];

    const menuSummary = useMemo(() => {
        if (!Array.isArray(menus)) return [];

        const getMealRecipes = (day, mealKey) => {
            if (!day) return [];
            if (mealKey === "brunch") return day.brunch ? [day.brunch] : [];
            const meal = day?.[mealKey];
            if (!meal || typeof meal !== "object") return [];
            return Object.values(meal).filter(Boolean);
        };

        return menus.map((day, idx) => {
            const dayLabel = formatDayLabel(day?.date) || `Jour ${idx + 1}`;
            const lunchEnabled = day?.enabledMeals?.lunch !== false;
            const dinnerEnabled = day?.enabledMeals?.dinner !== false;

            const brunchRecipes = getMealRecipes(day, "brunch");
            const lunchRecipes = lunchEnabled ? getMealRecipes(day, "lunch") : [];
            const dinnerRecipes = dinnerEnabled ? getMealRecipes(day, "dinner") : [];

            return {
                idx,
                dayLabel,
                meals: [
                    { key: "brunch", label: "Brunch", enabled: brunchRecipes.length > 0, recipes: brunchRecipes },
                    { key: "lunch", label: "Midi", enabled: lunchEnabled, recipes: lunchRecipes },
                    { key: "dinner", label: "Soir", enabled: dinnerEnabled, recipes: dinnerRecipes },
                ].filter((m) => m.enabled),
            };
        });
    }, [menus]);

    const shoppingItems = useMemo(() => {
        const totals = new Map();
        const singles = new Map();

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
                totals.set(key, { labelPretty: parsed.label, qty: scaledQty, unit: parsed.unit });
            } else {
                totals.set(key, { ...prev, qty: prev.qty + scaledQty });
            }
        };

        for (const day of menus) {
            if (!day) continue;

            if (day.brunch?.ingredients) {
                const mult = getRecipeMultiplier(day.brunch);
                for (const ing of day.brunch.ingredients) pushLine(ing, mult);
            }

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

        for (const [, label] of singles) items.push(label);

        items.sort((a, b) => a.localeCompare(b, "fr"));
        return items;
    }, [menus]);

    const handlePrint = () => {
        try {
            const doc = new jsPDF({ unit: "pt", format: "a4" });

            // ✅ Force noir & blanc partout (sécurité)
            doc.setTextColor(0);
            doc.setDrawColor(0);

            const pageWidth = doc.internal.pageSize.getWidth();
            const marginX = 40;
            let y = 52;

            const sectionTitle = (txt) => {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.text(txt, marginX, y);
                y += 18;
            };

            const dayTitle = (txt) => {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(11);
                doc.text(txt, marginX, y);
                y += 14;
            };

            const normal = () => {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
            };

            // ========= RÉCAP =========
            sectionTitle("Récapitulatif");
            normal();

            for (const day of menuSummary) {
                y = ensureSpace(doc, y, 130);

                dayTitle(day.dayLabel || "Jour");
                normal();

                for (const meal of day.meals || []) {
                    y = ensureSpace(doc, y, 95);

                    doc.setFont("helvetica", "bold");
                    doc.text(`${meal.label} :`, marginX + 14, y);
                    doc.setFont("helvetica", "normal");

                    const recipes = Array.isArray(meal.recipes) ? meal.recipes : [];
                    if (!recipes.length) {
                        doc.text("—", marginX + 80, y);
                        y += 12;
                        continue;
                    }

                    let firstLine = true;
                    for (const r of recipes) {
                        const name = r?.title || "Recette";
                        const time = formatDuration(r?.time) || "";
                        const line = `${firstLine ? "" : "   "}${name}${time ? ` (${time})` : ""}`;

                        const lines = doc.splitTextToSize(line, pageWidth - marginX * 2 - 80);
                        doc.text(lines, marginX + 80, y);
                        y += lines.length * 12;

                        firstLine = false;
                    }

                    y += 2;
                }

                y += 8;
            }

            // ========= LISTE (NOIR & BLANC + MULTI-COLONNES) =========
            y = ensureSpace(doc, y + 8, 170);
            y += 10;

            sectionTitle("Liste de courses");

            const COLS = 3; // ✅ 2, 3 ou 4 selon ton goût
            const rows = chunkIntoColumns(shoppingItems, COLS);

            const tableWidth = pageWidth - marginX * 2;
            const colWidth = tableWidth / COLS;

            autoTable(doc, {
                startY: y,

                // ✅ IMPORTANT : aucune ligne d'en-tête => pas de bande bleue
                head: [],
                showHead: "never",

                // ✅ IMPORTANT : body en tableau NxCOLS => multi-colonnes
                body: rows.length ? rows : [Array(COLS).fill("")],

                theme: "plain", // base sans style

                tableWidth,

                styles: {
                    font: "helvetica",
                    fontSize: 9,
                    textColor: 0,          // ✅ noir
                    fillColor: null,       // ✅ PAS de fond (ni blanc forcé, ni gris)
                    lineWidth: 0,          // ✅ PAS de bordures
                    cellPadding: { top: 2, right: 6, bottom: 2, left: 0 },
                    valign: "top",
                    overflow: "linebreak",
                },

                // ✅ double sécurité anti-couleurs
                headStyles: { fillColor: null, textColor: 0, lineWidth: 0 },
                bodyStyles: { fillColor: null, textColor: 0, lineWidth: 0 },
                alternateRowStyles: { fillColor: null },

                columnStyles: Object.fromEntries(
                    Array.from({ length: COLS }, (_, i) => [i, { cellWidth: colWidth }])
                ),

                margin: { left: marginX, right: marginX },
                pageBreak: "auto",
            });

            // ========= OUVERTURE PDF (VARIANTE "PRO") =========
            // Objectif : ouvrir *uniquement* dans un nouvel onglet, sans jamais naviguer la page actuelle.
            // Astuce anti pop-up blocker : on ouvre d'abord un onglet vide (synchrone au clic),
            // puis on remplace son URL par l'ObjectURL du PDF.
            const previewTab = window.open("", "_blank", "noopener,noreferrer");

            const blob = doc.output("blob");
            const url = URL.createObjectURL(blob);

            if (previewTab) {
                try {
                    // Petit contenu de secours si le PDF met un instant à se charger
                    previewTab.document.title = "Aperçu PDF";
                    previewTab.document.body.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
                    previewTab.document.body.style.margin = "24px";
                    previewTab.document.body.textContent = "Chargement du PDF…";
                } catch {
                    // Certains navigateurs restreignent l'accès au document quand noopener est activé.
                }

                // Charge le PDF dans l'onglet nouvellement ouvert
                try {
                    previewTab.location.href = url;
                } catch {
                    // Si on ne peut pas rediriger l'onglet (rare), on propose un téléchargement.
                    doc.save("liste-de-courses.pdf");
                }
            } else {
                // Pop-up bloquée : on ne navigue PAS la page courante.
                // On propose un téléchargement direct à la place.
                doc.save("liste-de-courses.pdf");
            }

            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (e) {
            console.error(e);
            alert("Impossible de générer le PDF.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 pb-12">
            <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
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

                    <div className="flex items-center gap-2">
                        <button className="btn-secondary-sm whitespace-nowrap" onClick={() => navigate(-1)}>
                            Retour
                        </button>

                        <button
                            className="btn-primary-sm whitespace-nowrap"
                            onClick={handlePrint}
                            disabled={!Array.isArray(menus) || menus.length === 0}
                            title="Ouvre un PDF (preview Chrome)"
                        >
                            Imprimer
                        </button>
                    </div>
                </div>
            </div>

            {!Array.isArray(menus) || menus.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4 text-sm text-zinc-600">
                    Aucun menu trouvé. Reviens au générateur et clique sur “Liste de course”.
                </div>
            ) : (
                <div className="mt-6 grid grid-cols-1 gap-4">
                    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <h3 className="text-primary font-extrabold">Récapitulatif</h3>
                                <p className="mt-1 text-xs text-zinc-500">Jours, repas et recettes prévues (avec le temps).</p>
                            </div>
                        </div>

                        <div className="divide-y divide-zinc-200">
                            {menuSummary.map((d) => (
                                <div key={d.idx} className="py-3">
                                    <div className="text-sm font-extrabold text-primary">{d.dayLabel}</div>

                                    <div className="mt-2 grid gap-2">
                                        {d.meals.map((meal) => (
                                            <div key={meal.key} className="grid grid-cols-[84px_1fr] gap-3 items-start">
                                                <div className="text-xs font-semibold text-zinc-500">{meal.label}</div>

                                                <div className="space-y-1">
                                                    {meal.recipes?.length ? (
                                                        meal.recipes.map((r) => (
                                                            <div
                                                                key={r?._id || `${meal.key}-${r?.title}`}
                                                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/60 ring-1 ring-zinc-200 px-3 py-2"
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="text-sm text-zinc-900 truncate">
                                                                        {r?.title || "Recette"}
                                                                    </div>
                                                                </div>

                                                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-zinc-600 ring-1 ring-zinc-200">
                                  <span>⏱️</span>
                                  <span className="font-semibold">{formatDuration(r?.time)}</span>
                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-sm text-zinc-500">—</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <h3 className="text-primary font-extrabold">Liste de courses</h3>
                                <p className="mt-1 text-xs text-zinc-500">
                                    Total des ingrédients pour le nombre de personnes sélectionné.
                                </p>
                            </div>
                        </div>

                        {shoppingItems.length === 0 ? (
                            <p className="text-sm text-zinc-600">Aucun ingrédient.</p>
                        ) : (
                            <ul
                                className="
                                list-disc
                                pl-6
                                text-sm
                                text-zinc-700
                                columns-1
                                sm:columns-2
                                lg:columns-3
                                gap-x-8
                              "
                            >
                                {shoppingItems.map((line) => (
                                    <li key={line} className="break-inside-avoid mb-1">
                                        {line}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
