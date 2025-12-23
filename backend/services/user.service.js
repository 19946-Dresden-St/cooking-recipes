const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
    signUpUser,
    loginUser,
};
