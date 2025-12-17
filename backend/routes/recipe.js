const express = require("express")
const {getRecipes, getRecipe, addRecipe, editRecipe, deleteRecipe, upload} = require("../controllers/recipe");
const verifyToken = require("../middlewares/auth");
const router = express.Router()

router.get("/", getRecipes) // Get all recipes
router.get("/:id", getRecipe) // Get recipe by ID
router.post("/", upload.single('file'), verifyToken, addRecipe) // Add a new recipe
router.put("/:id", upload.single('file'), editRecipe) // Update a recipe by ID
router.delete("/:id", deleteRecipe) // Delete a recipe by ID

module.exports = router
