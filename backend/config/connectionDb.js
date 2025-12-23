const mongoose = require("mongoose");

let isConnected = false;

const connectDb = async (mongoUri = process.env.MONGO_URI) => {
    if (!mongoUri) {
        throw new Error("MONGO_URI is missing in environment variables");
    }

    if (isConnected) {
        return mongoose.connection;
    }

    try {
        await mongoose.connect(mongoUri);
        isConnected = true;
        console.log("MongoDB connected");
        return mongoose.connection;
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        throw error;
    }
};

module.exports = connectDb;
