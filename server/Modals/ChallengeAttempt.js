const mongoose = require("mongoose");

const ChallengeAttemptSchema = new mongoose.Schema(
  {
    challengeId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED"],
      default: "COMPLETED",
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    timeTaken: {
      type: Number,
      default: 0,
    },
    remainingSeconds: {
      type: Number,
      default: null,
    },
    answers: [
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
        selectedAnswer: {
          type: String,
          default: "",
        },
        correctAnswer: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
        category: {
          type: String,
          default: "",
        },
        difficulty: {
          type: String,
          default: "",
        },
        pointsEarned: {
          type: Number,
          default: 0,
        },
      },
    ],
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ChallengeAttemptSchema.index({ challengeId: 1, userId: 1 }, { unique: true });
ChallengeAttemptSchema.index({ challengeId: 1, status: 1 });

const ChallengeAttempt = mongoose.model(
  "challengeAttempt",
  ChallengeAttemptSchema
);

module.exports = ChallengeAttempt;
