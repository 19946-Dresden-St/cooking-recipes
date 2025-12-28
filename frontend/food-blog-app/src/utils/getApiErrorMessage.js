// frontend/food-blog-app/src/utils/getApiErrorMessage.js

export function getApiErrorMessage(err) {
    // Déjà une string
    if (typeof err === "string") return err;

    // Erreur "standard" JS
    if (err instanceof Error && typeof err.message === "string" && err.message.trim()) {
        // On ne return pas tout de suite car axios peut contenir plus précis dans response.data
        // (on continue la logique)
    }

    // Cas Axios (err.response)
    const data = err?.response?.data;

    // 1) Si l'API renvoie directement une string
    if (typeof data === "string" && data.trim()) return data;

    // 2) Nouveau contrat (backend): { error: { code, message, details }, message }
    const apiError = data?.error;
    if (apiError) {
        if (typeof apiError === "string" && apiError.trim()) return apiError;
        if (typeof apiError?.message === "string" && apiError.message.trim()) return apiError.message;
    }

    // 3) Ancien / autre contrat: { message: "..." }
    if (typeof data?.message === "string" && data.message.trim()) return data.message;

    // 4) fallback axios: statusText
    const statusText = err?.response?.statusText;
    if (typeof statusText === "string" && statusText.trim()) return statusText;

    // 5) fallback Error.message
    if (typeof err?.message === "string" && err.message.trim()) return err.message;

    return "Une erreur est survenue.";
}
