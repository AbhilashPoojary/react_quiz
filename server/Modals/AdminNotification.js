const mongoose = require("mongoose");

const AdminNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["GENERAL", "EVENT", "ACCOUNT", "CHALLENGE", "SYSTEM"],
      default: "GENERAL",
    },
    targetType: {
      type: String,
      enum: ["ALL_ACTIVE_USERS", "SPECIFIC_USERS", "EVENT_REGISTERED_USERS"],
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const AdminNotification = mongoose.model(
  "adminNotification",
  AdminNotificationSchema
);

module.exports = AdminNotification;
