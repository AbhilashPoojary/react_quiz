const mongoose = require("mongoose");

const ChallengeSchema = new mongoose.Schema(
  {
    challengeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    participants: {
      type: [String],
      default: [],
    },
    config: {
      categoryId: {
        type: Number,
        required: true,
      },
      categoryName: {
        type: String,
        required: true,
      },
      difficulty: {
        type: String,
        required: true,
      },
      questionCount: {
        type: Number,
        required: true,
      },
      questionType: {
        type: String,
        enum: ["multiple", "boolean"],
        default: "multiple",
      },
      duration: {
        type: Number,
        required: true,
      },
      timedQuiz: {
        type: Boolean,
        default: true,
      },
      showAnswerFeedback: {
        type: Boolean,
        default: true,
      },
      timerMode: {
        type: String,
        enum: ["TOTAL", "PER_QUESTION"],
        default: "TOTAL",
      },
      totalDuration: {
        type: Number,
        default: null,
      },
      timePerQuestion: {
        type: Number,
        default: null,
      },
    },
    questions: [
      {
        questionOrder: {
          type: Number,
          required: true,
        },
        question: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          default: [],
        },
        correctAnswer: {
          type: String,
          required: true,
        },
        difficulty: {
          type: String,
          default: "",
        },
        category: {
          type: String,
          default: "",
        },
      },
    ],
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "OPEN",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

ChallengeSchema.index({ participants: 1, createdAt: -1 });

const Challenge = mongoose.model("challenge", ChallengeSchema);

module.exports = Challenge;
