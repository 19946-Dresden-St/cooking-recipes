const fs = require("fs");
const path = require("path");
const Recipes = require("../models/recipe");
const httpError = require("../utils/httpError");

const DEFAULT_IMAGE = "heroSection.jpg";

function unlinkIfExists(filePath) {
    fs.unlink(filePath, () => {});
}

function deleteRecipeImageIfNeeded(filename) {
    if (!filename || filename === DEFAULT_IMAGE) return;
    const imagePath = path.join(__dirname, "..", "public", "images", filename);
    unlinkIfExists(imagePath);
}

/* ===== READ ===== */
const getAllRecipes = async () => Recipes.find();

const getRecipeById = async (id) => Recipes.findById(id);

/* ===== RANDOM ===== */
const getRandomRecipes = async ({ count = 1, categories = ["plat"], excludeIds = [] }) => {
    const match = {};

    if (categories.length === 1) match.category = categories[0];
    else if (categories.length > 1) match.category = { $in: categories };
    else match.category = "plat";

    if (excludeIds.length > 0) {
        match._id = { $nin: excludeIds };
    }

    return Recipes.aggregate([{ $match: match }, { $sample: { size: count } }]);
};

/* ===== CREATE ===== */
const createRecipe = async (data) => Recipes.create(data);

/* ===== UPDATE (avec gestion image) ===== */
const updateRecipeWithImage = async ({ id, updateData, newFilename }) => {
    const recipe = await Recipes.findById(id);
    if (!recipe) {
        throw httpError(404, "Recipe not found");
    }

    let coverImage = recipe.coverImage;
    if (newFilename) {
        deleteRecipeImageIfNeeded(recipe.coverImage);
        coverImage = newFilename;
    }

    return Recipes.findByIdAndUpdate(
        id,
        { ...updateData, coverImage },
        { new: true, runValidators: true }
    );
};

/* ===== DELETE (avec gestion image) ===== */
const deleteRecipeWithImage = async (id) => {
    const recipe = await Recipes.findById(id);
    if (!recipe) {
        throw httpError(404, "Recipe not found");
    }

    deleteRecipeImageIfNeeded(recipe.coverImage);
    await Recipes.deleteOne({ _id: id });
    return true;
};

module.exports = {
    getAllRecipes,
    getRecipeById,
    getRandomRecipes,
    createRecipe,
    updateRecipeWithImage,
    deleteRecipeWithImage,
};
