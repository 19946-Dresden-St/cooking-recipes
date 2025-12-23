const httpError = require("../utils/httpError");

module.exports = function notFound(req, res, next) {
    return next(httpError(404, "Not found"));
};
