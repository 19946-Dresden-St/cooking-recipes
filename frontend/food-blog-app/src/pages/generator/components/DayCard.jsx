import React from "react";
import { FiLock, FiUnlock } from "react-icons/fi";

import GeneratorRecipeCard from "../../../components/GeneratorRecipeCard";
import { getCategoryLabel } from "../../../utils/categories";
import { addDaysISO, formatDayLabelForCard } from "../dates";
import SectionTitle from "./SectionTitle";

export default function DayCard({
                                    menu,
                                    idx,
                                    startDate,
                                    todayISO,
                                    hasBrunch,
                                    orderedDailyCats,
                                    isDayLocked,
                                    isSlotLocked,
                                    toggleDayLock,
                                    toggleSlotLock,
                                    setMealEnabled,
                                    regenerateOne,
                                    setSelectedServingsForSlot,
                                }) {
    const dayLocked = isDayLocked(menu.dayIndex);

    const dateISO = menu?.date ?? addDaysISO(startDate, idx);
    const dayTitle = formatDayLabelForCard({ dateISO, todayISO });

    const lunchEnabled = menu?.enabledMeals?.lunch !== false;
    const dinnerEnabled = menu?.enabledMeals?.dinner !== false;

    return (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-4">
            <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-primary font-extrabold">{dayTitle}</h3>

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
                        {dayLocked ? <FiLock /> : <FiUnlock />}
                    </button>
                </div>
            </div>

            {/* ✅ Choix Midi/Soir */}
            <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 mr-1">
                    Repas
                </span>

                <label className="relative">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={!!lunchEnabled}
                        onChange={(e) =>
                            setMealEnabled({
                                dayIndex: menu.dayIndex,
                                mealKey: "lunch",
                                enabled: e.target.checked,
                            })
                        }
                    />
                    <span
                        className="
                                            inline-flex h-8 items-center justify-center
                                            rounded-full px-3 text-sm font-semibold
                                            ring-1 transition
                                            peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:ring-primary/30
                                            bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50
                                          "
                    >
                        Midi
                    </span>
                </label>

                <label className="relative">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={!!dinnerEnabled}
                        onChange={(e) =>
                            setMealEnabled({
                                dayIndex: menu.dayIndex,
                                mealKey: "dinner",
                                enabled: e.target.checked,
                            })
                        }
                    />
                    <span
                        className="
                                            inline-flex h-8 items-center justify-center
                                            rounded-full px-3 text-sm font-semibold
                                            ring-1 transition
                                            peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:ring-primary/30
                                            bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50
                                          "
                    >
                        Soir
                    </span>
                </label>
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
                            onServingsChange={(next) =>
                                setSelectedServingsForSlot({
                                    dayIndex: menu.dayIndex,
                                    meal: "brunch",
                                    categoryKey: "brunch",
                                    nextServings: next,
                                })
                            }
                        />
                    </div>
                </div>
            )}

            {/* MIDI */}
            {lunchEnabled && (
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
                                onServingsChange={(next) =>
                                    setSelectedServingsForSlot({
                                        dayIndex: menu.dayIndex,
                                        meal: "lunch",
                                        categoryKey: cat,
                                        nextServings: next,
                                    })
                                }
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* SOIR */}
            {dinnerEnabled && (
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
                                onServingsChange={(next) =>
                                    setSelectedServingsForSlot({
                                        dayIndex: menu.dayIndex,
                                        meal: "dinner",
                                        categoryKey: cat,
                                        nextServings: next,
                                    })
                                }
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
