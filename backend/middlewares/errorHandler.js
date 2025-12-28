module.exports = function errorHandler(err, req, res, next) {
    console.error(err);

    if (res.headersSent) return next(err);

    // Defaults
    let status = err.statusCode || err.status || 500;
    let code = err.code || "INTERNAL_ERROR";
    let message = err.message || "Server error";
    let details = null;

    // Mongoose common errors => 400e
    if (err?.name === "ValidationError") {
        status = 400;
        code = "VALIDATION_ERROR";
        message = "Validation error";

        // détails utiles (par champ)
        details = Object.values(err.errors || {}).map((e) => ({
            field: e.path,
            message: e.message,
        }));
    }

    if (err?.name === "CastError") {
        status = 400;
        code = "INVALID_ID";
        message = "Invalid id";
    }

    return res.status(status).json({
        error: { code, message, details },

        // Optionnel : rétro-compat (si ton front l'utilise déjà)
        message,
    });
};
