const mongoose = require("mongoose");

const UserAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    achievementId: {
      type: String,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    unlocked: {
      type: Boolean,
      default: false,
    },
    unlockedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

const UserAchievement = mongoose.model("userAchievement", UserAchievementSchema);

module.exports = UserAchievement;
