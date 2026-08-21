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
    attemptKey: {
      type: String,
    },
    quizType: {
      type: String,
      enum: ["NORMAL", "SPIN"],
      default: "NORMAL",
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
    maxScore: {
      type: Number,
      default: 100,
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
    questionCount: {
      type: Number,
      default: 10,
    },
    timeTaken: {
      type: Number,
      default: 0,
    },
    averageTimePerQuestion: {
      type: Number,
      default: 0,
    },
    scorePercentage: {
      type: Number,
      default: 0,
    },
    answers: [
      {
        questionIndex: {
          type: Number,
          default: 0,
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
  },
  { timestamps: true }
);

Resultschema.index(
  { userId: 1, attemptKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      attemptKey: { $type: "string" },
    },
  }
);
Resultschema.index({ userId: 1, createdAt: -1 });
Resultschema.index({ userId: 1, category: 1 });

const Result = mongoose.model("score", Resultschema);

module.exports = Result;
