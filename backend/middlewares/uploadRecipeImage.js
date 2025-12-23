const multer = require("multer");
const path = require("path");

const IMAGES_DIR = path.join(__dirname, "..", "public", "images");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, IMAGES_DIR);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const fileName = `${Date.now()}-${file.fieldname}${ext}`;
        cb(null, fileName);
    },
});

const uploadRecipeImage = multer({ storage });

module.exports = {
    uploadRecipeImage,
    IMAGES_DIR,
};
