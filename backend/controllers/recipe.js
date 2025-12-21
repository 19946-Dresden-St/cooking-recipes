const Recipes = require("../models/recipe");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/images");
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const fileName = `${Date.now()}-${file.fieldname}${ext}`;
        cb(null, fileName);
    },
});

const upload = multer({ storage });

const getRecipes = async (req, res) => {
    const recipes = await Recipes.find();
    return res.json(recipes);
};

const getRecipe = async (req, res) => {
    const recipe = await Recipes.findById(req.params.id);
    return res.json(recipe);
};

const addRecipe = async (req, res) => {
    try {
        const { title, ingredients, instructions, time, category, servings } = req.body;

        if (!title || !ingredients || !instructions || !time) {
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

        // ✅ servings (optionnel côté front, default 4 sinon)
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

        const newRecipe = await Recipes.create({
            title,
            ingredients,
            instructions,
            time: parsedTime,
            servings: parsedServings,
            category: category || "plat",
            coverImage,
            createdBy: req.user.id,
        });

        return res.status(201).json(newRecipe);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

const editRecipe = async (req, res) => {
    try {
        const recipe = await Recipes.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        // ✅ si nouvelle image : supprimer l'ancienne
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

        // ✅ validations time/servings si présents dans req.body
        const updateData = { ...req.body, coverImage };

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
    try {
        const recipe = await Recipes.findById(req.params.id);

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

            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.warn("Image deletion failed:", err.message);
                }
            });
        }

        await Recipes.deleteOne({ _id: req.params.id });

        return res.json({ status: "Recipe deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getRecipes,
    getRecipe,
    addRecipe,
    editRecipe,
    deleteRecipe,
    upload,
};
