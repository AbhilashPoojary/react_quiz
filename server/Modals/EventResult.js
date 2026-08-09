const mongoose = require("mongoose");

const EventAnswerSchema = new mongoose.Schema(
  {
    questionOrder: {
      type: Number,
      required: true,
    },
    selectedAnswer: {
      type: String,
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const EventResultSchema = new mongoose.Schema(
  {
    eventId: {
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
    correctCount: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    totalTime: {
      type: Number,
      default: 0,
    },
    answers: {
      type: [EventAnswerSchema],
      default: [],
    },
  },
  { timestamps: true }
);

EventResultSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EventResult = mongoose.model("eventResult", EventResultSchema);

module.exports = EventResult;
