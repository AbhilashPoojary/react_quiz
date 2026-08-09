const AppSetting = require("../Modals/AppSetting");

const QUIZ_SETUP_VERSION_KEY = "quizSetupVersion";
const DEFAULT_QUIZ_SETUP_VERSION = "V1";
const VALID_QUIZ_SETUP_VERSIONS = ["V1", "V2"];

const getQuizSetupVersionValue = async () => {
  const setting = await AppSetting.findOne({ key: QUIZ_SETUP_VERSION_KEY }).lean();
  return VALID_QUIZ_SETUP_VERSIONS.includes(setting?.value)
    ? setting.value
    : DEFAULT_QUIZ_SETUP_VERSION;
};

const getQuizSetupVersion = async (req, res) => {
  try {
    const version = await getQuizSetupVersionValue();
    res.status(200).json({ quizSetupVersion: version });
  } catch (error) {
    res.status(500).json({ error: "Unable to load quiz setup setting" });
  }
};

const updateQuizSetupVersion = async (req, res) => {
  try {
    const version = String(req.body?.quizSetupVersion || "").toUpperCase();

    if (!VALID_QUIZ_SETUP_VERSIONS.includes(version)) {
      return res.status(400).json({ error: "Invalid quiz setup version" });
    }

    const setting = await AppSetting.findOneAndUpdate(
      { key: QUIZ_SETUP_VERSION_KEY },
      {
        value: version,
        updatedBy: req.user.userId,
      },
      { new: true, upsert: true }
    ).lean();

    res.status(200).json({ quizSetupVersion: setting.value });
  } catch (error) {
    res.status(500).json({ error: "Unable to update quiz setup setting" });
  }
};

module.exports = {
  getQuizSetupVersion,
  updateQuizSetupVersion,
  getQuizSetupVersionValue,
};
