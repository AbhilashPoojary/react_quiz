const mongoose = require("mongoose");

const Resultschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    category: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
    },
    totaltime: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Result = mongoose.model("score", Resultschema);

module.exports = Result;
