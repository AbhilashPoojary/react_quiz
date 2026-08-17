const Achievement = require("../Modals/Achievement");
const {
  getUserAchievements,
  getUserStreak,
  seedDefaultAchievements,
} = require("../services/gamificationService");

const conditionTypes = new Set([
  "QUIZ_COUNT",
  "STREAK",
  "ACCURACY",
  "DIFFICULTY_ACCURACY_COUNT",
  "QUIZ_TYPE_COUNT",
  "CHALLENGE_WIN_COUNT",
  "GLOBAL_RANK",
]);

const difficulties = new Set(["easy", "medium", "hard", "", null, undefined]);
const quizTypes = new Set(["NORMAL", "SPIN", "CHALLENGE", "EVENT", "", null, undefined]);

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePayload = (body = {}) => ({
  code: String(body.code || "").trim().toUpperCase(),
  name: String(body.name || "").trim(),
  description: String(body.description || "").trim(),
  icon: String(body.icon || "🏅").trim() || "🏅",
  conditionType: String(body.conditionType || "").trim(),
  target: toNumberOrNull(body.target) ?? 1,
  threshold: toNumberOrNull(body.threshold),
  difficulty: body.difficulty || null,
  quizType: body.quizType || null,
  minimumQuestions: toNumberOrNull(body.minimumQuestions),
  active: body.active !== false,
  displayOrder: toNumberOrNull(body.displayOrder) ?? 0,
});

const validateAchievement = (payload) => {
  const errors = {};

  if (!payload.name || payload.name.length < 3 || payload.name.length > 80) {
    errors.name = "Achievement name must be between 3 and 80 characters";
  }

  if (!/^[A-Z0-9_]{3,60}$/.test(payload.code)) {
    errors.code = "Code must be 3-60 uppercase letters, numbers, or underscores";
  }

  if (!payload.description || payload.description.length < 5 || payload.description.length > 240) {
    errors.description = "Description must be between 5 and 240 characters";
  }

  if (!conditionTypes.has(payload.conditionType)) {
    errors.conditionType = "Condition type is invalid";
  }

  if (!Number.isFinite(payload.target) || payload.target < 1) {
    errors.target = "Target must be at least 1";
  }

  if (!difficulties.has(payload.difficulty)) {
    errors.difficulty = "Difficulty is invalid";
  }

  if (!quizTypes.has(payload.quizType)) {
    errors.quizType = "Quiz type is invalid";
  }

  if (["ACCURACY", "DIFFICULTY_ACCURACY_COUNT"].includes(payload.conditionType)) {
    if (!Number.isFinite(payload.threshold) || payload.threshold < 0 || payload.threshold > 100) {
      errors.threshold = "Accuracy threshold must be between 0 and 100";
    }
  }

  if (payload.conditionType === "DIFFICULTY_ACCURACY_COUNT" && !payload.difficulty) {
    errors.difficulty = "Difficulty is required for this condition";
  }

  if (payload.conditionType === "QUIZ_TYPE_COUNT" && !payload.quizType) {
    errors.quizType = "Quiz type is required for this condition";
  }

  if (
    payload.minimumQuestions !== null &&
    (!Number.isFinite(payload.minimumQuestions) || payload.minimumQuestions < 1)
  ) {
    errors.minimumQuestions = "Minimum questions must be at least 1";
  }

  return errors;
};

const listUserAchievements = async (req, res) => {
  try {
    res.status(200).json(await getUserAchievements(req.user.userId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const userStreak = async (req, res) => {
  try {
    res.status(200).json(await getUserStreak(req.user.userId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listAdminAchievements = async (req, res) => {
  try {
    await seedDefaultAchievements();
    const achievements = await Achievement.find().sort({
      displayOrder: 1,
      createdAt: 1,
    });
    res.status(200).json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createAchievement = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const errors = validateAchievement(payload);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const achievement = await new Achievement(payload).save();
    res.status(201).json(achievement);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ errors: { code: "Code already exists" } });
    }

    res.status(500).json({ error: error.message });
  }
};

const updateAchievement = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const errors = validateAchievement(payload);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const achievement = await Achievement.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }

    res.status(200).json(achievement);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ errors: { code: "Code already exists" } });
    }

    res.status(500).json({ error: error.message });
  }
};

const updateAchievementStatus = async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndUpdate(
      req.params.id,
      { active: req.body.active === true },
      { new: true }
    );

    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }

    res.status(200).json(achievement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createAchievement,
  listAdminAchievements,
  listUserAchievements,
  updateAchievement,
  updateAchievementStatus,
  userStreak,
};
