const mongoose = require("mongoose");

const AppSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    updatedBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const AppSetting = mongoose.model("appsetting", AppSettingSchema);

module.exports = AppSetting;
