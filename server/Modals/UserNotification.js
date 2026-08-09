const mongoose = require("mongoose");

const UserNotificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

UserNotificationSchema.index(
  { notificationId: 1, userId: 1 },
  { unique: true }
);

const UserNotification = mongoose.model(
  "userNotification",
  UserNotificationSchema
);

module.exports = UserNotification;
