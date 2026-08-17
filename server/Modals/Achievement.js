const mongoose = require("mongoose");

const AchievementSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "🏅",
    },
    conditionType: {
      type: String,
      enum: [
        "QUIZ_COUNT",
        "STREAK",
        "ACCURACY",
        "DIFFICULTY_ACCURACY_COUNT",
        "QUIZ_TYPE_COUNT",
        "CHALLENGE_WIN_COUNT",
        "GLOBAL_RANK",
      ],
      required: true,
    },
    target: {
      type: Number,
      default: 1,
    },
    threshold: {
      type: Number,
      default: null,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", null],
      default: null,
    },
    quizType: {
      type: String,
      enum: ["NORMAL", "SPIN", "CHALLENGE", "EVENT", null],
      default: null,
    },
    minimumQuestions: {
      type: Number,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Achievement = mongoose.model("achievement", AchievementSchema);

module.exports = Achievement;
