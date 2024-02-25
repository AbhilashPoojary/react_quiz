const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const AuthRouter = require("./routes/auth");
const ResultRouter = require("./routes/result");
const connectDB = require("./db/connect");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT;

app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

app.use("/auth", AuthRouter);
app.use("/api/", ResultRouter);

app.get("/", (req, res) => {
  res.status(200).json(`running on port ${PORT}`);
});

const server = app.listen(PORT || 8800, () =>
  console.log(`Server started on ${PORT || 8800}`)
);
