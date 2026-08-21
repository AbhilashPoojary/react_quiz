const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const AuthRouter = require("./routes/auth");
const ResultRouter = require("./routes/result");
const AdminRouter = require("./routes/admin");
const ChallengeRouter = require("./routes/challenge");
const SettingsRouter = require("./routes/settings");
const requestLogger = require("./middleware/requestLogger");
const connectDB = require("./db/connect");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT;

app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(requestLogger);

const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    error: "Database temporarily unavailable. Please try again shortly.",
  });
};

app.get("/", (req, res) => {
  res.status(200).json({
    status: "running",
    port: PORT || 8800,
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use(["/auth", "/api"], requireDatabase);

app.use("/auth", AuthRouter);
app.use("/api/auth", AuthRouter);
app.use("/api/settings", SettingsRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/challenges", ChallengeRouter);
app.use("/api/", ResultRouter);

const startServer = async () => {
  const isDbConnected = await connectDB();
  if (!isDbConnected) {
    connectDB.startMongoReconnectLoop();
  }

  app.listen(PORT || 8800, () =>
    console.log(`Server started on ${PORT || 8800}`)
  );
};

startServer();
