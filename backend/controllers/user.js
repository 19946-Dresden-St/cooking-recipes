const {
    registerUser,
    authenticateUser,
    getPublicUserById,
} = require("../services/user.service");
const httpError = require("../utils/httpError");

/* ===== SIGN UP ===== */
const userSignUp = async (req, res) => {
    const result = await registerUser(req.body);
    return res.status(200).json(result);
};

/* ===== LOGIN ===== */
const userLogin = async (req, res) => {
    const result = await authenticateUser(req.body);
    return res.status(200).json(result);
};

/* ===== GET USER ===== */
const getUser = async (req, res) => {
    const user = await getPublicUserById(req.params.id);

    if (!user) {
        throw httpError(404, "User not found");
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
