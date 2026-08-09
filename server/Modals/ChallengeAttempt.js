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
    score: {
      type: Number,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    wrongAnswers: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      required: true,
    },
    timeTaken: {
      type: Number,
      required: true,
    },
    answers: [
      {
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
      default: Date.now,
    },
  },
  { timestamps: true }
);

ChallengeAttemptSchema.index({ challengeId: 1, userId: 1 }, { unique: true });

const ChallengeAttempt = mongoose.model(
  "challengeAttempt",
  ChallengeAttemptSchema
);

module.exports = ChallengeAttempt;
