const { normalizeUsername } = require("../utils/username");
const {
    signUpUser,
    loginUser,
    isUsernameTaken,
    findUserByUsername,
    getPublicUserById,
} = require("../services/user.service");

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

    const taken = await isUsernameTaken(normalized);
    if (taken) {
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

    const user = await findUserByUsername(normalized, { withPassword: true });

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
    const user = await getPublicUserById(req.params.id);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    return res.json({
        _id: user._id,
        username: user.username,
    });
};

module.exports = {
    userSignUp,
    userLogin,
    getUser,
};
