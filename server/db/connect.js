const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Mongo connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message || error);
    console.warn("Continuing server startup without MongoDB connection.");
  }
};

module.exports = connectDB;
