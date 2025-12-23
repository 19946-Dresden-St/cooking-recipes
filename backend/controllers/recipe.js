const mongoose = require("mongoose");
const Recipes = require("../models/recipe");
const fs = require("fs");
const path = require("path");
const { normalizeStringArray } = require("../utils/normalize");
const { uploadRecipeImage } = require("../middlewares/uploadRecipeImage");
const {
    getAllRecipes,
    getRecipeById,
    createRecipe,
    updateRecipeById,
    deleteRecipeById,
} = require("../services/recipe.service");


const upload = uploadRecipeImage;

/* ===== LISTE DES RECETTES ===== */
const getRecipes = async (req, res) => {
    const recipes = await getAllRecipes();
    return res.json(recipes);
};

/* ===== RECETTE PAR ID ===== */
const getRecipe = async (req, res) => {
    const recipe = await getRecipeById(req.params.id);
    return res.json(recipe);
};

const getRandomRecipes = async (req, res) => {
    try {
        const countRaw = req.query.count;
        const countParsed = Number.parseInt(countRaw, 10);
        const count =
            Number.isFinite(countParsed) && countParsed > 0
                ? Math.min(countParsed, 50)
                : 1;

        const categoryRaw = (req.query.category || "plat").toString().trim();
        const categories = categoryRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        const excludeRaw = (req.query.exclude || "").toString().trim();
        const excludeIds = excludeRaw
            ? excludeRaw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((id) => {
                    try {
                        return new mongoose.Types.ObjectId(id);
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean)
            : [];

        const match = {};

        if (categories.length === 1) {
            match.category = categories[0];
        } else if (categories.length > 1) {
            match.category = { $in: categories };
        } else {
            match.category = "plat";
        }

        if (excludeIds.length > 0) {
            match._id = { $nin: excludeIds };
        }

        const randomRecipes = await Recipes.aggregate([
            { $match: match },
            { $sample: { size: count } },
        ]);

        return res.json(randomRecipes);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

const addRecipe = async (req, res) => {
    const { title, ingredients, instructions, time, category, servings } = req.body;

    const cleanedIngredients = normalizeStringArray(ingredients);
    const cleanedInstructions = normalizeStringArray(instructions);

    if (!title || !time || cleanedIngredients.length === 0 || cleanedInstructions.length === 0) {
        return res.status(400).json({
            message:
                "Le nom, le temps, les ingrédients et les instructions sont requis.",
        });
    }

    const parsedTime = Number(time);
    if (!Number.isInteger(parsedTime) || parsedTime <= 0) {
        return res.status(400).json({
            message: "Le temps doit être un entier positif.",
        });
    }

    const parsedServings =
        servings === undefined || servings === null || servings === ""
            ? 4
            : Number(servings);

    if (!Number.isInteger(parsedServings) || parsedServings <= 0) {
        return res.status(400).json({
            message: "Le nombre de personnes doit être un entier positif.",
        });
    }

    const coverImage = req.file ? req.file.filename : "heroSection.jpg";

    const newRecipe = await createRecipe({
        title,
        ingredients: cleanedIngredients,
        instructions: cleanedInstructions,
        time: parsedTime,
        servings: parsedServings,
        category: category || "plat",
        coverImage,
        createdBy: req.user.id,
    });

    return res.status(201).json(newRecipe);
};

const editRecipe = async (req, res) => {
    try {
        const recipe = await Recipes.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        let coverImage = recipe.coverImage;

        if (req.file) {
            if (recipe.coverImage && recipe.coverImage !== "heroSection.jpg") {
                const oldImagePath = path.join(
                    __dirname,
                    "..",
                    "public",
                    "images",
                    recipe.coverImage
                );

                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.warn("Old image deletion failed:", err.message);
                    }
                });
            }

            coverImage = req.file.filename;
        }

        const updateData = { ...req.body, coverImage };

        if (updateData.ingredients !== undefined) {
            updateData.ingredients = normalizeStringArray(updateData.ingredients);
            if (updateData.ingredients.length === 0) {
                return res.status(400).json({
                    message: "Ajoute au moins un ingrédient.",
                });
            }
        }

        if (updateData.instructions !== undefined) {
            updateData.instructions = normalizeStringArray(updateData.instructions);
            if (updateData.instructions.length === 0) {
                return res.status(400).json({
                    message: "Ajoute au moins une instruction.",
                });
            }
        }

        if (updateData.time !== undefined) {
            const parsedTime = Number(updateData.time);
            if (!Number.isInteger(parsedTime) || parsedTime <= 0) {
                return res.status(400).json({
                    message: "Le temps doit être un entier positif.",
                });
            }
            updateData.time = parsedTime;
        }

        if (updateData.servings !== undefined) {
            const parsedServings = Number(updateData.servings);
            if (!Number.isInteger(parsedServings) || parsedServings <= 0) {
                return res.status(400).json({
                    message: "Le nombre de personnes doit être un entier positif.",
                });
            }
            updateData.servings = parsedServings;
        }

        const updatedRecipe = await Recipes.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        return res.json(updatedRecipe);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: "Error updating recipe" });
    }
};

const deleteRecipe = async (req, res) => {
    const recipe = await getRecipeById(req.params.id);

    if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
    }

    if (recipe.coverImage && recipe.coverImage !== "heroSection.jpg") {
        const imagePath = path.join(
            __dirname,
            "..",
            "public",
            "images",
            recipe.coverImage
        );

        fs.unlink(imagePath, () => {});
    }

    await deleteRecipeById(req.params.id);
    return res.json({ status: "Recipe deleted successfully" });
};

module.exports = {
    getRecipes,
    getRecipe,
    getRandomRecipes,
    addRecipe,
    editRecipe,
    deleteRecipe,
    upload,
};
