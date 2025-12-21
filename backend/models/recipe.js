const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        ingredients: {
            type: [String],
            required: true,
        },
        instructions: {
            type: String,
            required: true,
        },
        time: {
            type: Number,
            required: true,
            min: [1, "Le temps doit être supérieur à 0"],
        },
        servings: {
            type: Number,
            required: true,
            min: [1, "Le nombre de personnes doit être supérieur à 0"],
            default: 4,
        },
        category: {
            type: String,
            enum: ["apero", "entree", "plat", "dessert", "boisson", "brunch"],
            default: "plat",
            required: true,
        },
        coverImage: {
            type: String,
            default: "heroSection.jpg",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);
