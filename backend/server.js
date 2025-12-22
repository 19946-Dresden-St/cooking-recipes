const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDb = require("./config/connectionDb");

const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

async function start() {
    connectDb();

    app.use(express.json());
    app.use(cors());

    app.get("/health", (req, res) => {
        res.status(200).json({ ok: true });
    });

    app.use("/images", express.static(path.join(__dirname, "public", "images")));
    app.use("/", require("./routes/user"));
    app.use("/recipe", require("./routes/recipe"));

    // ✅ AdminJS : montage propre au démarrage (1 seule fois)
    try {
        const { buildAdminRouter } = require("./admin");
        const { admin, router } = await buildAdminRouter();
        app.use(admin.options.rootPath, router);
    } catch (err) {
        console.error("❌ AdminJS init failed:", err);
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

start();
