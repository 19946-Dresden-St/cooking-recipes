const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder: "recipes",
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
        };
    },
});

const uploadRecipeImage = multer({ storage });

module.exports = {
    uploadRecipeImage,
};
