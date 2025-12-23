module.exports = function errorHandler(err, req, res, next) {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    // Valeurs par défaut
    let status = err.statusCode || err.status || 500;
    let message = err.message || "Server error";

    // Mongoose: erreurs courantes => 400
    if (err?.name === "ValidationError") {
        status = 400;
        message = err.message || "Validation error";
    }

    if (err?.name === "CastError") {
        status = 400;
        message = "Invalid id";
    }

    return res.status(status).json({
        message,
        error: message, // on garde le format existant
    });
};
