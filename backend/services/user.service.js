const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { normalizeUsername } = require("../utils/username");
const httpError = require("../utils/httpError");

const USERNAME_COLLATION = { locale: "en", strength: 2 };

/**
 * Trouve un user par username (case-insensitive via collation)
 * @param {string} username
 * @param {{ withPassword?: boolean }} options
 */
const findUserByUsername = async (username, { withPassword = false } = {}) => {
    let query = User.findOne({ username }).collation(USERNAME_COLLATION);

    if (withPassword) {
        query = query.select("+password");
    }

    return query;
};

const isUsernameTaken = async (username) => {
    const existing = await User.findOne({ username })
        .collation(USERNAME_COLLATION)
        .select("_id");
    return Boolean(existing);
};

const getPublicUserById = async (id) => {
    return User.findById(id).select("_id username");
};

/* ===== SIGN UP (bas niveau) ===== */
const signUpUser = async ({ username, password }) => {
    const hashPwd = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        username,
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

    return {
        token,
        user: {
            _id: newUser._id,
            username: newUser.username,
            role: newUser.role,
        },
    };
};

/* ===== LOGIN (bas niveau) ===== */
const loginUser = async ({ user, password }) => {
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        return null;
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

    return {
        token,
        user: {
            _id: user._id,
            username: user.username,
            role: user.role,
        },
    };
};

/* ===== FLOWS "haut niveau" (validation + orchestration) ===== */
const registerUser = async ({ username, password }) => {
    if (!username || !password) {
        throw httpError(400, "Username or password cannot be empty");
    }

    const normalized = normalizeUsername(username);

    if (normalized.length < 3) {
        throw httpError(400, "Username must be at least 3 characters");
    }

    const taken = await isUsernameTaken(normalized);
    if (taken) {
        throw httpError(400, "Username already exists");
    }

    return signUpUser({ username: normalized, password });
};

const authenticateUser = async ({ username, password }) => {
    if (!username || !password) {
        throw httpError(400, "Username or password cannot be empty");
    }

    const normalized = normalizeUsername(username);

    const user = await findUserByUsername(normalized, { withPassword: true });
    if (!user) {
        throw httpError(400, "Invalid username or password");
    }

    const result = await loginUser({ user, password });
    if (!result) {
        throw httpError(400, "Invalid username or password");
    }

    return result;
};

module.exports = {
    // queries / helpers
    findUserByUsername,
    isUsernameTaken,
    getPublicUserById,

    // low-level auth
    signUpUser,
    loginUser,

    // high-level flows (controllers should call these)
    registerUser,
    authenticateUser,
};
