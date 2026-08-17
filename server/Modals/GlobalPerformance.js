const mongoose = require("mongoose");

const CreditedAttemptSchema = new mongoose.Schema(
  {
    attemptType: {
      type: String,
      enum: ["QUIZ", "CHALLENGE", "EVENT"],
      required: true,
    },
    attemptId: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    creditedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const GlobalPerformanceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalQuizzes: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    totalCorrectAnswers: {
      type: Number,
      default: 0,
    },
    leaderboardPoints: {
      type: Number,
      default: 0,
      index: true,
    },
    creditedAttempts: {
      type: [CreditedAttemptSchema],
      default: [],
    },
    lastPlayedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

GlobalPerformanceSchema.index({ leaderboardPoints: -1, updatedAt: 1 });
const GlobalPerformance = mongoose.model(
  "globalPerformance",
  GlobalPerformanceSchema
);

module.exports = GlobalPerformance;
