const mongoose = require("mongoose");
const httpError = require("../utils/httpError");

module.exports = function validateObjectId(paramName = "id") {
    return function (req, res, next) {
        const value = req.params?.[paramName];

        if (!value || !mongoose.Types.ObjectId.isValid(value)) {
            return next(httpError(400, "Invalid id"));
        }

        return next();
    };
};
