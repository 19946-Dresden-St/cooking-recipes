const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSignUp = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email or password cannot be empty",
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                error: "Email already exists",
            });
        }

        const hashPwd = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            password: hashPwd,
        });

        const token = jwt.sign(
            { email, id: newUser._id },
            process.env.SECRET_KEY,
            { expiresIn: "24h" }
        );

        return res.status(200).json({
            token,
            user: {
                _id: newUser._id,
                email: newUser.email,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: "Signup error" });
    }
};

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email or password cannot be empty",
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(400).json({
                error: "Invalid email or password",
            });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(400).json({
                error: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            { email, id: user._id },
            process.env.SECRET_KEY,
            { expiresIn: "24h" }
        );

        user.password = undefined;

        return res.status(200).json({
            token,
            user: {
                _id: user._id,
                email: user.email,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: "Login error" });
    }
};

const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.json({
            _id: user._id,
            email: user.email,
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
