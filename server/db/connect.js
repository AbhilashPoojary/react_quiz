const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
let reconnectTimer = null;
let reconnectInFlight = false;

const getNumberEnv = (key, fallback) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const getSanitizedMongoTarget = (mongoUrl = "") => {
  if (!mongoUrl) {
    return "not configured";
  }

  try {
    const url = new URL(mongoUrl);
    return `${url.protocol}//${url.hostname}${url.pathname}`;
  } catch (error) {
    return mongoUrl.replace(/(mongodb(\+srv)?:\/\/)[^@]+@/i, "$1***:***@");
  }
};

mongoose.connection.on("connected", () => {
  console.log("[db] Mongo connection is ready");
});

mongoose.connection.on("disconnected", () => {
  console.warn("[db] Mongo connection disconnected");
});

mongoose.connection.on("error", (error) => {
  console.error("[db] Mongo connection error:", error.message || error);
});

const connectDB = async () => {
  try {
    if (!MONGO_URL) {
      throw new Error("MONGO_URL is not configured");
    }

    mongoose.set("strictQuery", false);
    mongoose.set("bufferCommands", false);

    console.log(`[db] Connecting to ${getSanitizedMongoTarget(MONGO_URL)}`);
    await mongoose.connect(MONGO_URL, {
      serverSelectionTimeoutMS: getNumberEnv(
        "MONGO_SERVER_SELECTION_TIMEOUT_MS",
        10000
      ),
      connectTimeoutMS: getNumberEnv("MONGO_CONNECT_TIMEOUT_MS", 10000),
      socketTimeoutMS: getNumberEnv("MONGO_SOCKET_TIMEOUT_MS", 45000),
      maxPoolSize: getNumberEnv("MONGO_MAX_POOL_SIZE", 10),
    });
    console.log("Mongo connected");
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
    return true;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message || error);
    console.warn("Continuing server startup without MongoDB connection.");
    return false;
  }
};

const startMongoReconnectLoop = () => {
  if (reconnectTimer) {
    return;
  }

  const retryMs = getNumberEnv("MONGO_RETRY_INTERVAL_MS", 15000);
  reconnectTimer = setInterval(async () => {
    if (mongoose.connection.readyState === 1 || reconnectInFlight) {
      return;
    }

    reconnectInFlight = true;
    try {
      console.log("[db] Retrying Mongo connection...");
      await connectDB();
    } finally {
      reconnectInFlight = false;
    }
  }, retryMs);

  if (typeof reconnectTimer.unref === "function") {
    reconnectTimer.unref();
  }
};

connectDB.startMongoReconnectLoop = startMongoReconnectLoop;

module.exports = connectDB;
