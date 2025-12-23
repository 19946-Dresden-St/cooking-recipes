const express = require("express");
const router = express.Router();
const { userSignUp, userLogin, getUser } = require("../controllers/user");
const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../middlewares/validateObjectId");

router.post("/signUp", asyncHandler(userSignUp));
router.post("/login", asyncHandler(userLogin));
router.get("/user/:id", validateObjectId("id"), asyncHandler(getUser));

module.exports = router;
