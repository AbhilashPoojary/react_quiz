const mongoose = require("mongoose");
const GlobalPerformance = require("../Modals/GlobalPerformance");
const User = require("../Modals/User");
const Result = require("../Modals/Result");
const Event = require("../Modals/Event");
const EventResult = require("../Modals/EventResult");
const Challenge = require("../Modals/Challenge");
const ChallengeAttempt = require("../Modals/ChallengeAttempt");

const difficultyMultiplier = {
  easy: 1,
  medium: 1.25,
  hard: 1.5,
};
let backgroundSyncStarted = false;

const normalizeDifficulty = (difficulty = "") =>
  String(difficulty || "").toLowerCase().trim();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const calculateLeaderboardPoints = ({ correctAnswers, difficulty }) => {
  const multiplier = difficultyMultiplier[normalizeDifficulty(difficulty)] || 1;
  return Math.round(toNumber(correctAnswers) * 10 * multiplier);
};

const updateGlobalPerformance = async ({
  userId,
  attemptId,
  attemptType = "QUIZ",
  correctAnswers,
  questionCount,
  difficulty,
  completedAt = new Date(),
}) => {
  if (!userId || !attemptId) {
    return null;
  }

  const normalizedAttemptType = ["CHALLENGE", "EVENT"].includes(attemptType)
    ? attemptType
    : "QUIZ";
  const attemptKey = String(attemptId);
  const existingCredit = await GlobalPerformance.exists({
    userId,
    creditedAttempts: {
      $elemMatch: {
        attemptType: normalizedAttemptType,
        attemptId: attemptKey,
      },
    },
  });

  if (existingCredit) {
    return GlobalPerformance.findOne({ userId });
  }

  const points = calculateLeaderboardPoints({ correctAnswers, difficulty });

  return GlobalPerformance.findOneAndUpdate(
    { userId },
    {
      $inc: {
        totalQuizzes: 1,
        totalQuestions: Math.max(0, toNumber(questionCount)),
        totalCorrectAnswers: Math.max(0, toNumber(correctAnswers)),
        leaderboardPoints: points,
      },
      $set: {
        lastPlayedAt: completedAt,
      },
      $push: {
        creditedAttempts: {
          attemptType: normalizedAttemptType,
          attemptId: attemptKey,
          points,
          creditedAt: new Date(),
        },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const syncExistingQuizAttempts = async () => {
  const results = await Result.find()
    .select("userId correctAnswers questionCount difficulty createdAt")
    .lean();

  for (const attempt of results) {
    await updateGlobalPerformance({
      userId: attempt.userId,
      attemptId: attempt._id.toString(),
      attemptType: "QUIZ",
      correctAnswers: attempt.correctAnswers,
      questionCount: attempt.questionCount,
      difficulty: attempt.difficulty,
      completedAt: attempt.createdAt,
    });
  }
};

const syncExistingChallengeAttempts = async () => {
  const attempts = await ChallengeAttempt.find()
    .select("challengeId userId correctAnswers answers completedAt createdAt")
    .lean();
  const challengeIds = Array.from(new Set(attempts.map((item) => item.challengeId)));
  const challenges = await Challenge.find({ _id: { $in: challengeIds } })
    .select("config.difficulty")
    .lean();
  const challengeMap = challenges.reduce((acc, challenge) => {
    acc[challenge._id.toString()] = challenge;
    return acc;
  }, {});

  for (const attempt of attempts) {
    const questionCount = Array.isArray(attempt.answers) ? attempt.answers.length : 0;
    const difficulty =
      challengeMap[attempt.challengeId]?.config?.difficulty ||
      attempt.answers?.[0]?.difficulty ||
      "easy";

    await updateGlobalPerformance({
      userId: attempt.userId,
      attemptId: attempt._id.toString(),
      attemptType: "CHALLENGE",
      correctAnswers: attempt.correctAnswers,
      questionCount,
      difficulty,
      completedAt: attempt.completedAt || attempt.createdAt,
    });
  }
};

const syncExistingEventAttempts = async () => {
  const attempts = await EventResult.find()
    .select("eventId userId correctCount totalQuestions createdAt")
    .lean();
  const eventIds = Array.from(new Set(attempts.map((item) => item.eventId)));
  const events = await Event.find({ _id: { $in: eventIds } })
    .select("difficulty")
    .lean();
  const eventMap = events.reduce((acc, event) => {
    acc[event._id.toString()] = event;
    return acc;
  }, {});

  for (const attempt of attempts) {
    await updateGlobalPerformance({
      userId: attempt.userId,
      attemptId: attempt._id.toString(),
      attemptType: "EVENT",
      correctAnswers: attempt.correctCount,
      questionCount: attempt.totalQuestions,
      difficulty: eventMap[attempt.eventId]?.difficulty || "easy",
      completedAt: attempt.createdAt,
    });
  }
};

const syncExistingAttempts = async () => {
  await syncExistingQuizAttempts();
  await syncExistingChallengeAttempts();
  await syncExistingEventAttempts();
};

const startBackgroundSync = () => {
  if (backgroundSyncStarted) {
    return;
  }

  backgroundSyncStarted = true;
  syncExistingAttempts().catch((error) => {
    backgroundSyncStarted = false;
    console.error("[leaderboard] background sync failed", error);
  });
};

const buildLeaderPayload = (performance, user, rank) => {
  const totalQuestions = toNumber(performance.totalQuestions);
  const totalCorrectAnswers = toNumber(performance.totalCorrectAnswers);
  const accuracy = totalQuestions
    ? (totalCorrectAnswers / totalQuestions) * 100
    : 0;

  return {
    rank,
    userId: performance.userId,
    username: user?.name || "Unknown Player",
    profileImage: user?.profilePicture || "",
    leaderboardPoints: toNumber(performance.leaderboardPoints),
    accuracy,
    totalQuizzes: toNumber(performance.totalQuizzes),
    totalQuestions,
  };
};

const buildFallbackLeaderboardFromQuizAttempts = async ({ userId, limit = 50 }) => {
  const parsedLimit = Math.min(100, Math.max(1, toNumber(limit, 50)));
  const attempts = await Result.find()
    .select("userId name profilePicture correctAnswers questionCount difficulty createdAt")
    .lean();
  const grouped = attempts.reduce((acc, attempt) => {
    if (!attempt.userId) {
      return acc;
    }

    if (!acc[attempt.userId]) {
      acc[attempt.userId] = {
        userId: attempt.userId,
        username: attempt.name || "Unknown Player",
        profileImage: attempt.profilePicture || "",
        totalQuizzes: 0,
        totalQuestions: 0,
        totalCorrectAnswers: 0,
        leaderboardPoints: 0,
        updatedAt: attempt.createdAt || new Date(0),
      };
    }

    acc[attempt.userId].totalQuizzes += 1;
    acc[attempt.userId].totalQuestions += Math.max(0, toNumber(attempt.questionCount));
    acc[attempt.userId].totalCorrectAnswers += Math.max(0, toNumber(attempt.correctAnswers));
    acc[attempt.userId].leaderboardPoints += calculateLeaderboardPoints({
      correctAnswers: attempt.correctAnswers,
      difficulty: attempt.difficulty,
    });

    if (new Date(attempt.createdAt || 0) > new Date(acc[attempt.userId].updatedAt || 0)) {
      acc[attempt.userId].updatedAt = attempt.createdAt;
    }

    return acc;
  }, {});
  const ranked = Object.values(grouped)
    .map((performance) => ({
      ...performance,
      accuracy: performance.totalQuestions
        ? (performance.totalCorrectAnswers / performance.totalQuestions) * 100
        : 0,
    }))
    .sort((first, second) => {
      if (second.leaderboardPoints !== first.leaderboardPoints) {
        return second.leaderboardPoints - first.leaderboardPoints;
      }

      return new Date(first.updatedAt || 0) - new Date(second.updatedAt || 0);
    })
    .map((performance, index) => ({ ...performance, rank: index + 1 }));

  return {
    leaders: ranked.slice(0, parsedLimit),
    currentUser: userId
      ? ranked.find((performance) => performance.userId === userId) || null
      : null,
  };
};

const getGlobalLeaderboard = async ({ userId, limit = 50 }) => {
  startBackgroundSync();

  const parsedLimit = Math.min(100, Math.max(1, toNumber(limit, 50)));
  const performanceCount = await GlobalPerformance.estimatedDocumentCount();

  if (!performanceCount) {
    return buildFallbackLeaderboardFromQuizAttempts({
      userId,
      limit: parsedLimit,
    });
  }

  const performances = await GlobalPerformance.find()
    .sort({ leaderboardPoints: -1, updatedAt: 1 })
    .limit(parsedLimit)
    .lean();
  const topUserIds = performances.map((item) => item.userId);
  const currentPerformance = userId
    ? await GlobalPerformance.findOne({ userId }).lean()
    : null;
  const userIds = Array.from(
    new Set([...topUserIds, ...(currentPerformance ? [currentPerformance.userId] : [])])
  );
  const objectIds = userIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const users = await User.find({ _id: { $in: objectIds } })
    .select("name profilePicture")
    .lean();
  const userMap = users.reduce((acc, user) => {
    acc[user._id.toString()] = user;
    return acc;
  }, {});
  const leaders = performances.map((performance, index) =>
    buildLeaderPayload(performance, userMap[performance.userId], index + 1)
  );

  let currentUser = null;

  if (currentPerformance) {
    const betterCount = await GlobalPerformance.countDocuments({
      $or: [
        { leaderboardPoints: { $gt: currentPerformance.leaderboardPoints } },
        {
          leaderboardPoints: currentPerformance.leaderboardPoints,
          updatedAt: { $lt: currentPerformance.updatedAt },
        },
      ],
    });

    currentUser = buildLeaderPayload(
      currentPerformance,
      userMap[currentPerformance.userId],
      betterCount + 1
    );
  }

  return { leaders, currentUser };
};

module.exports = {
  calculateLeaderboardPoints,
  getGlobalLeaderboard,
  syncExistingAttempts,
  updateGlobalPerformance,
};
