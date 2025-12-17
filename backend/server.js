const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDb = require("./config/connectionDb");

const app = express();
const PORT = process.env.PORT || 3000;

connectDb();

app.use(express.json());
app.use(cors());

app.use("/", require("./routes/user"));
app.use("/recipe", require("./routes/recipe"));
app.get("/health", (req, res) => {
    res.status(200).json({ ok: true });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
