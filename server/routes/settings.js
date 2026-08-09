const express = require("express");
const { getQuizSetupVersion } = require("../controllers/Settings");

const SettingsRouter = express.Router();

SettingsRouter.get("/quiz-setup-version", getQuizSetupVersion);

module.exports = SettingsRouter;
