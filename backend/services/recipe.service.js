const fs = require("fs");
const path = require("path");
const Recipes = require("../models/recipe");
const httpError = require("../utils/httpError");
const cloudinary = require("../config/cloudinary");

const DEFAULT_IMAGE = "heroSection.jpg";

function unlinkIfExists(filePath) {
    fs.unlink(filePath, () => {});
}

function isCloudinaryUrl(value) {
    return typeof value === "string" && value.startsWith("http");
}

// Support rétro-compatibilité : si tu as encore d’anciennes recettes avec images locales
function deleteLocalRecipeImageIfNeeded(filename) {
    if (!filename || filename === DEFAULT_IMAGE) return;
    const imagePath = path.join(__dirname, "..", "public", "images", filename);
    unlinkIfExists(imagePath);
}

async function deleteRecipeImageIfNeeded(recipe) {
    if (!recipe) return;

    // Si Cloudinary : on supprime via public_id
    if (recipe.coverImagePublicId) {
        try {
            await cloudinary.uploader.destroy(recipe.coverImagePublicId);
        } catch (e) {
            // on ne bloque pas la requête si Cloudinary refuse
        }
        return;
    }

    // Sinon, si c’est une ancienne image locale (filename)
    if (!isCloudinaryUrl(recipe.coverImage)) {
        deleteLocalRecipeImageIfNeeded(recipe.coverImage);
    }
}

/* ===== LISTE ===== */
const getAllRecipes = async () => Recipes.find().sort({ createdAt: -1 });

/* ===== FIND BY ID ===== */
const getRecipeById = async (id) => Recipes.findById(id);

const getRecipeByIdOrThrow = async (id) => {
    const recipe = await Recipes.findById(id);
    if (!recipe) {
        throw httpError(404, "Recipe not found");
    }
    return recipe;
};

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
const updateRecipeWithImage = async ({ id, updateData, newImageUrl, newImagePublicId }) => {
    const recipe = await Recipes.findById(id);
    if (!recipe) {
        throw httpError(404, "Recipe not found");
    }

    let coverImage = recipe.coverImage;
    let coverImagePublicId = recipe.coverImagePublicId ?? null;

    if (newImageUrl && newImagePublicId) {
        await deleteRecipeImageIfNeeded(recipe);
        coverImage = newImageUrl;
        coverImagePublicId = newImagePublicId;
    }

    return Recipes.findByIdAndUpdate(
        id,
        { ...updateData, coverImage, coverImagePublicId },
        { new: true, runValidators: true }
    );
};

/* ===== DELETE (avec gestion image) ===== */
const deleteRecipeWithImage = async (id) => {
    const recipe = await Recipes.findById(id);
    if (!recipe) {
        throw httpError(404, "Recipe not found");
    }

    await deleteRecipeImageIfNeeded(recipe);
    await Recipes.deleteOne({ _id: id });
    return true;
};

module.exports = {
    getAllRecipes,
    getRecipeById,
    getRecipeByIdOrThrow,
    getRandomRecipes,
    createRecipe,
    updateRecipeWithImage,
    deleteRecipeWithImage,
};
