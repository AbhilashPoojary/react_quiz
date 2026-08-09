const mongoose = require("mongoose");
const { buildEventSchedule } = require("../utils/eventStatus");

const QuestionSchema = new mongoose.Schema(
  {
    questionOrder: {
      type: Number,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    incorrectAnswers: {
      type: [String],
      required: true,
    },
    answers: [
      {
        answerOrder: {
          type: Number,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
      },
    ],
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: Number,
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    questionCount: {
      type: Number,
      required: true,
      min: 1,
    },
    questionType: {
      type: String,
      enum: ["multiple", "boolean"],
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    startAt: {
      type: Date,
    },
    endAt: {
      type: Date,
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "UPCOMING", "LIVE", "COMPLETED", "CANCELLED"],
      default: "DRAFT",
    },
    notifyUsers: {
      type: Boolean,
      default: false,
    },
    apiUrl: {
      type: String,
      required: true,
    },
    questions: {
      type: [QuestionSchema],
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

EventSchema.pre("validate", function setScheduleWindow(next) {
  if (this.eventDate && this.startTime && this.duration) {
    const schedule = buildEventSchedule(this);
    this.startAt = schedule.startAt;
    this.endAt = schedule.endAt;
  }

  next();
});

const Event = mongoose.model("event", EventSchema);

module.exports = Event;
