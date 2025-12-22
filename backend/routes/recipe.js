const express = require("express");
const { getRecipes, getRecipe, addRecipe, editRecipe, deleteRecipe, upload, getRandomRecipes} = require("../controllers/recipe");
const { verifyToken } = require("../middlewares/auth");
const router = express.Router();

router.get("/", getRecipes);
router.get("/random", getRandomRecipes);
router.get("/:id", getRecipe);
router.post("/", verifyToken, upload.single("file"), addRecipe);
router.put("/:id", verifyToken, upload.single("file"), editRecipe);
router.delete("/:id", verifyToken, deleteRecipe);

module.exports = router;
