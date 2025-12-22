const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const normalizeUsername = (value) =>
    String(value ?? "")
        .trim()

const userSignUp = async (req, res) => {
    try {
        const { username, password, email } = req.body;

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

        // ✅ Debug utile (maintenant mongoose est défini)
        console.log(
            "Mongo connected to DB:",
            mongoose.connection.name,
            "| host:",
            mongoose.connection.host
        );

        // ✅ Collation pour éviter les soucis si tu as déjà des usernames pas normalisés en DB
        const existingUser = await User.findOne({ username: normalized }).collation({
            locale: "en",
            strength: 2, // insensible à la casse
        });

        if (existingUser) {
            return res.status(400).json({
                error: "Username already exists",
            });
        }

        const hashPwd = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username: normalized,
            password: hashPwd,
            role: 1,
        });

        const token = jwt.sign(
            {
                id: newUser._id,
                username: newUser.username,
                role: newUser.role,
            },
            process.env.SECRET_KEY,
            { expiresIn: "24h" }
        );

        return res.status(200).json({
            token,
            user: {
                _id: newUser._id,
                username: newUser.username,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);

        // Duplicate key Mongo (ex: username unique)
        if (error && error.code === 11000) {
            return res.status(400).json({ error: "Username already exists" });
        }

        return res.status(500).json({ error: error?.message || "Signup error" });
    }
};

const userLogin = async (req, res) => {
    try {
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

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({
                error: "Invalid username or password",
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                role: user.role,
            },
            process.env.SECRET_KEY,
            { expiresIn: "24h" }
        );

        return res.status(200).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: error?.message || "Login error" });
    }
};

const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({
            _id: user._id,
            username: user.username,
        });
    } catch (error) {
        res.status(500).json({ error: "User not found" });
    }
};

module.exports = {
    userSignUp,
    userLogin,
    getUser,
};
