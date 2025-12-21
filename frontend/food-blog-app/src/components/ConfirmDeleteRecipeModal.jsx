import React from "react";
import Modal from "./Modal";

export default function ConfirmDeleteRecipeModal({recipeTitle, onCancel, onConfirm, isLoading = false}) {
    return (
        <Modal onClose={isLoading ? () => {} : onCancel}>
            <div className="space-y-5">
                <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-primary">
                        Supprimer définitivement ?
                    </h3>

                    <p className="text-sm text-zinc-600">
                        Supprimer définitivement la recette{" "}
                        <span className="font-semibold text-zinc-900">“{recipeTitle}”</span> ?
                    </p>

                    <p className="text-xs text-zinc-400">
                        Cette action est irréversible.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="btn-secondary"
                    >
                        Annuler
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="text-sm font-semibold bg-primary hover:bg-accent text-white rounded-md px-5 py-2.5 hover:cursor-pointer transition duration-600"
                    >
                        {isLoading ? "Suppression…" : "Confirmer"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
