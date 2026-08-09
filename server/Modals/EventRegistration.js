const mongoose = require("mongoose");

const EventRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

EventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EventRegistration = mongoose.model(
  "eventRegistration",
  EventRegistrationSchema
);

module.exports = EventRegistration;
