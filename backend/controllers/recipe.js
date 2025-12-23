const mongoose = require("mongoose");
const { normalizeStringArray } = require("../utils/normalize");
const httpError = require("../utils/httpError");
const {
    getAllRecipes,
    getRecipeByIdOrThrow,
    getRandomRecipes: getRandomRecipesService,
    createRecipe,
    updateRecipeWithImage,
    deleteRecipeWithImage,
} = require("../services/recipe.service");

/* ===== LISTE DES RECETTES ===== */
const getRecipes = async (req, res) => {
    const recipes = await getAllRecipes();
    return res.json(recipes);
};

/* ===== RECETTE PAR ID ===== */
const getRecipe = async (req, res) => {
    const recipe = await getRecipeByIdOrThrow(req.params.id);
    return res.json(recipe);
};

const getRandomRecipes = async (req, res) => {
    const countRaw = req.query.count;
    const countParsed = Number.parseInt(countRaw, 10);
    const count = Number.isFinite(countParsed) && countParsed > 0 ? Math.min(countParsed, 50) : 1;

    const categoryRaw = (req.query.category || "plat").toString().trim();
    const categories = categoryRaw.split(",").map((s) => s.trim()).filter(Boolean);

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

    const randomRecipes = await getRandomRecipesService({ count, categories, excludeIds });
    return res.json(randomRecipes);
};

const addRecipe = async (req, res) => {
    const { title, ingredients, instructions, time, category, servings } = req.body;

    const cleanedIngredients = normalizeStringArray(ingredients);
    const cleanedInstructions = normalizeStringArray(instructions);

    if (!title || !time || cleanedIngredients.length === 0 || cleanedInstructions.length === 0) {
        throw httpError(400, "Le nom, le temps, les ingrédients et les instructions sont requis.");
    }

    const parsedTime = Number(time);
    if (!Number.isInteger(parsedTime) || parsedTime <= 0) {
        throw httpError(400, "Le temps doit être un entier positif.");
    }

    const parsedServings =
        servings === undefined || servings === null || servings === "" ? 4 : Number(servings);

    if (!Number.isInteger(parsedServings) || parsedServings <= 0) {
        throw httpError(400, "Le nombre de personnes doit être un entier positif.");
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
    const updateData = { ...req.body };

    if (updateData.ingredients !== undefined) {
        updateData.ingredients = normalizeStringArray(updateData.ingredients);
        if (updateData.ingredients.length === 0) {
            throw httpError(400, "Ajoute au moins un ingrédient.");
        }
    }

    if (updateData.instructions !== undefined) {
        updateData.instructions = normalizeStringArray(updateData.instructions);
        if (updateData.instructions.length === 0) {
            throw httpError(400, "Ajoute au moins une instruction.");
        }
    }

    if (updateData.time !== undefined) {
        const parsedTime = Number(updateData.time);
        if (!Number.isInteger(parsedTime) || parsedTime <= 0) {
            throw httpError(400, "Le temps doit être un entier positif.");
        }
        updateData.time = parsedTime;
    }

    if (updateData.servings !== undefined) {
        const parsedServings = Number(updateData.servings);
        if (!Number.isInteger(parsedServings) || parsedServings <= 0) {
            throw httpError(400, "Le nombre de personnes doit être un entier positif.");
        }
        updateData.servings = parsedServings;
    }

    const updatedRecipe = await updateRecipeWithImage({
        id: req.params.id,
        updateData,
        newFilename: req.file?.filename,
    });

    return res.json(updatedRecipe);
};

const deleteRecipe = async (req, res) => {
    await deleteRecipeWithImage(req.params.id);
    return res.json({ status: "Recipe deleted successfully" });
};

module.exports = {
    getRecipes,
    getRecipe,
    getRandomRecipes,
    addRecipe,
    editRecipe,
    deleteRecipe,
};
