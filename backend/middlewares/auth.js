const jwt = require("jsonwebtoken");
const User = require("../models/user");

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "Missing token" });
        }

        const parts = authHeader.split(" ");
        const token = parts.length === 2 ? parts[1] : null;

        if (!token) {
            return res.status(401).json({ message: "Invalid token format" });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        const user = await User.findById(decoded.id).select("username email role");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
        };

        return next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

const requireRole = (requiredRole) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== requiredRole) {
        return res.status(403).json({ message: "Forbidden" });
    }

    return next();
};

module.exports = {
    verifyToken,
    requireRole,
};
