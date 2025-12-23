const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

/* ===== SIGN UP ===== */
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

/* ===== LOGIN ===== */
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

module.exports = {
    // queries / helpers
    findUserByUsername,
    isUsernameTaken,
    getPublicUserById,

    // existing auth flows
    signUpUser,
    loginUser,
};
