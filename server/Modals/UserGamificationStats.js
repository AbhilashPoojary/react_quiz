const mongoose = require("mongoose");

const CreditedActivitySchema = new mongoose.Schema(
  {
    activityType: {
      type: String,
      enum: ["NORMAL", "SPIN", "CHALLENGE", "EVENT"],
      required: true,
    },
    activityId: {
      type: String,
      required: true,
    },
    completedDate: {
      type: String,
      required: true,
    },
    creditedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const UserGamificationStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastCompletedDate: {
      type: String,
      default: "",
    },
    creditedActivities: {
      type: [CreditedActivitySchema],
      default: [],
    },
  },
  { timestamps: true }
);

const UserGamificationStats = mongoose.model(
  "userGamificationStats",
  UserGamificationStatsSchema
);

module.exports = UserGamificationStats;
