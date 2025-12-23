const mongoose = require("mongoose");

module.exports = function validateObjectId(paramName = "id") {
    return function (req, res, next) {
        const value = req.params?.[paramName];

        if (!value || !mongoose.Types.ObjectId.isValid(value)) {
            return res.status(400).json({
                message: "Invalid id",
                error: "Invalid id",
            });
        }

        return next();
    };
};
