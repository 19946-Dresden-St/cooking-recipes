const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const connectDb = require("./config/connectionDb");

const path = require("path");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await connectDb();

        app.use(express.json());
        app.use(cors());

        app.get("/health", (req, res) => {
            res.status(200).json({ ok: true });
        });

        app.use("/images", express.static(path.join(__dirname, "public", "images")));
        app.use("/", require("./routes/user"));
        app.use("/recipe", require("./routes/recipe"));

        try {
            const { buildAdminRouter } = require("./admin");
            const { admin, router } = await buildAdminRouter();
            app.use(admin.options.rootPath, router);
        } catch (err) {
            console.error("❌ AdminJS init failed:", err);
        }

        app.use(notFound);
        app.use(errorHandler);

        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        const shutdown = async (signal) => {
            console.log(`\n${signal} received. Shutting down...`);
            server.close(async () => {
                try {
                    await mongoose.connection.close();
                } catch (err) {
                    console.error("❌ Error closing MongoDB connection:", err);
                }
                process.exit(0);
            });

            setTimeout(() => process.exit(1), 10_000).unref();
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (err) {
        console.error("❌ Server failed to start:", err);
        process.exit(1);
    }
}

start();
