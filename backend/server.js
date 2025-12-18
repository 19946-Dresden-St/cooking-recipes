const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDb = require("./config/connectionDb");

const app = express();
const PORT = process.env.PORT || 3000;

const path = require("path");

connectDb();

app.use(express.json());
app.use(cors());

app.get("/health", (req, res) => {res.status(200).json({ ok: true }); });

app.use("/images", express.static(path.join(__dirname, "public", "images")));
app.use("/", require("./routes/user"));
app.use("/recipe", require("./routes/recipe"));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
