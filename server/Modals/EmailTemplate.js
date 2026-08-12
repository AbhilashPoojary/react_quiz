const mongoose = require("mongoose");

const EmailTemplateSchema = new mongoose.Schema(
  {
    templateKey: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      immutable: true,
      index: true,
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    htmlBody: {
      type: String,
      required: true,
    },
    allowedVariables: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const EmailTemplate = mongoose.model("emailTemplate", EmailTemplateSchema);

module.exports = EmailTemplate;
