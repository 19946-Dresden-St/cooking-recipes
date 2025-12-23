const express = require("express");
const {
    getRecipes,
    getRecipe,
    addRecipe,
    editRecipe,
    deleteRecipe,
    getRandomRecipes,
} = require("../controllers/recipe");
const { uploadRecipeImage } = require("../middlewares/uploadRecipeImage");
const { verifyToken } = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../middlewares/validateObjectId");

const router = express.Router();

router.get("/", asyncHandler(getRecipes));
router.get("/random", asyncHandler(getRandomRecipes));
router.get("/:id", validateObjectId("id"), asyncHandler(getRecipe));

router.post("/", verifyToken, uploadRecipeImage.single("file"), asyncHandler(addRecipe));
router.put("/:id", verifyToken, validateObjectId("id"), uploadRecipeImage.single("file"), asyncHandler(editRecipe));
router.delete("/:id", verifyToken, validateObjectId("id"), asyncHandler(deleteRecipe));

module.exports = router;
