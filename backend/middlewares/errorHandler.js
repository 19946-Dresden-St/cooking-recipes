module.exports = function errorHandler(err, req, res, next) {

    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    const status = err.statusCode || err.status || 500;
    const message = err.message || "Server error";

    return res.status(status).json({
        message,
        error: message,
    });
};
