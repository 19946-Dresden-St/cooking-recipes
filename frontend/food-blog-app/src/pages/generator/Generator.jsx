import React from "react";
import { useNavigate } from "react-router-dom";

import {
    CATEGORY_ORDER,
    getBadgeClass,
    getCategoryLabel,
} from "../../utils/categories";
import usePageTitle from "../../hooks/usePageTitle";

import useGeneratorState from "./useGeneratorState";
import DayCard from "./components/DayCard";
import { HIDDEN_ON_GENERATOR } from "./constants";

export default function Generator() {
    usePageTitle("Générateur");

    const navigate = useNavigate();

    const {
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
    } = useGeneratorState();

    const badgeCategories = React.useMemo(
        () => CATEGORY_ORDER.filter((c) => !HIDDEN_ON_GENERATOR.has(c)),
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
                                        <div className="text-xs font-semibold text-zinc-700">
                                            Date
                                        </div>
                                        <div className="text-[11px] text-zinc-500">
                                            {startDateHelperLabel}
                                        </div>
                                    </div>

                                    <input
                                        className="input h-9 w-full bg-white"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) setStartDate(v);
                                        }}
                                    />
                                </label>

                                <label className="flex items-center gap-3 rounded-xl ring-1 ring-zinc-200 bg-zinc-50/60 px-3 py-2">
                                    <div className="min-w-[110px] leading-tight">
                                        <div className="text-xs font-semibold text-zinc-700">
                                            Jours
                                        </div>
                                        <div className="text-[11px] text-zinc-500">
                                            {d * 2} repas
                                        </div>
                                    </div>

                                    <input
                                        className="input h-9 w-full bg-white"
                                        type="number"
                                        min={1}
                                        max={14}
                                        value={days}
                                        onChange={(e) => setDays(e.target.value)}
                                    />
                                </label>
                            </div>

                            {/* Ligne 2 : Catégories (compact, horizontal) */}
                            <div className="rounded-xl ring-1 ring-zinc-200 bg-zinc-50/60 px-3 py-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-semibold text-zinc-700">
                                        Catégories
                                    </div>
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
                                <div className="text-xs font-semibold text-zinc-700 px-1 pb-2">
                                    Actions
                                </div>

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
