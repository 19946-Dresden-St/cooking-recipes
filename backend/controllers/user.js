const mongoose = require("mongoose");
const User = require("../models/user");
const { normalizeUsername } = require("../utils/username");
const { signUpUser, loginUser } = require("../services/user.service");

/* ===== SIGN UP ===== */
const userSignUp = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "Username or password cannot be empty",
        });
    }

    const normalized = normalizeUsername(username);

    if (normalized.length < 3) {
        return res.status(400).json({
            error: "Username must be at least 3 characters",
        });
    }

    const existingUser = await User.findOne({ username: normalized }).collation({
        locale: "en",
        strength: 2,
    });

    if (existingUser) {
        return res.status(400).json({
            error: "Username already exists",
        });
    }

    const result = await signUpUser({
        username: normalized,
        password,
    });

    return res.status(200).json(result);
};

/* ===== LOGIN ===== */
const userLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "Username or password cannot be empty",
        });
    }

    const normalized = normalizeUsername(username);

    const user = await User.findOne({ username: normalized })
        .collation({ locale: "en", strength: 2 })
        .select("+password");

    if (!user) {
        return res.status(400).json({
            error: "Invalid username or password",
        });
    }

    const result = await loginUser({ user, password });

    if (!result) {
        return res.status(400).json({
            error: "Invalid username or password",
        });
    }

    return res.status(200).json(result);
};

/* ===== GET USER ===== */
const getUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json({
        _id: user._id,
        username: user.username,
    });
};

module.exports = {
    userSignUp,
    userLogin,
    getUser,
};
