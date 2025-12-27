const jwt = require("jsonwebtoken");
const User = require("../models/user");
const httpError = require("../utils/httpError");

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next(httpError(401, "Missing token"));
        }

        const parts = authHeader.split(" ");
        const token = parts.length === 2 ? parts[1] : null;

        if (!token) {
            return next(httpError(401, "Invalid token format"));
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        const user = await User.findById(decoded.id).select("username email role");
        if (!user) {
            return next(httpError(401, "User not found"));
        }

        req.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
        };

        return next();
    } catch {
        return next(httpError(401, "Invalid token"));
    }
};

const requireRole = (requiredRole) => (req, res, next) => {
    if (!req.user) {
        return next(httpError(401, "Unauthorized"));
    }

    if (req.user.role !== requiredRole) {
        return next(httpError(403, "Forbidden"));
    }

    return next();
};

module.exports = {
    verifyToken,
    requireRole,
};
