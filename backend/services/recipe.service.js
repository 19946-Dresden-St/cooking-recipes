const Recipes = require("../models/recipe");

/* ===== READ ===== */
const getAllRecipes = async () => {
    return Recipes.find();
};

const getRecipeById = async (id) => {
    return Recipes.findById(id);
};

/* ===== CREATE ===== */
const createRecipe = async (data) => {
    return Recipes.create(data);
};

/* ===== UPDATE ===== */
const updateRecipeById = async (id, updateData) => {
    return Recipes.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });
};

/* ===== DELETE ===== */
const deleteRecipeById = async (id) => {
    return Recipes.deleteOne({ _id: id });
};

module.exports = {
    getAllRecipes,
    getRecipeById,
    createRecipe,
    updateRecipeById,
    deleteRecipeById,
};
