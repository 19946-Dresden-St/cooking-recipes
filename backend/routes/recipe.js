const express = require("express")
const {getRecipes, getRecipe, addRecipe, editRecipe, deleteRecipe, upload} = require("../controllers/recipe");
const verifyToken = require("../middlewares/auth");
const router = express.Router()

router.get("/", getRecipes) // Get all recipes
router.get("/:id", getRecipe) // Get recipe by ID
router.post("/", verifyToken, upload.single("file"), addRecipe); // Add a new recipe
router.put("/:id", verifyToken, upload.single("file"), editRecipe); // Edit a recipe
router.delete("/:id", verifyToken, deleteRecipe); // Delete a recipe

module.exports = router
