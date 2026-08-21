const Achievement = require("../Modals/Achievement");
const UserAchievement = require("../Modals/UserAchievement");
const UserGamificationStats = require("../Modals/UserGamificationStats");
const Result = require("../Modals/Result");
const ChallengeAttempt = require("../Modals/ChallengeAttempt");
const GlobalPerformance = require("../Modals/GlobalPerformance");

const DEFAULT_ACHIEVEMENTS = [
  {
    code: "FIRST_BLOOD",
    name: "First Blood",
    description: "Complete first quiz",
    icon: "🎯",
    conditionType: "QUIZ_COUNT",
    target: 1,
    displayOrder: 1,
  },
  {
    code: "ON_FIRE",
    name: "On Fire",
    description: "Maintain a 5-day quiz streak",
    icon: "🔥",
    conditionType: "STREAK",
    target: 5,
    displayOrder: 2,
  },
  {
    code: "PERFECTIONIST",
    name: "Perfectionist",
    description: "Score 100% on a quiz containing at least 10 questions",
    icon: "💯",
    conditionType: "ACCURACY",
    threshold: 100,
    minimumQuestions: 10,
    target: 1,
    displayOrder: 3,
  },
  {
    code: "QUIZ_MASTER",
    name: "Quiz Master",
    description: "Complete 100 quizzes",
    icon: "🧠",
    conditionType: "QUIZ_COUNT",
    target: 100,
    displayOrder: 4,
  },
  {
    code: "HARD_MODE_HERO",
    name: "Hard Mode Hero",
    description: "Score at least 80% on 10 Hard quizzes",
    icon: "💀",
    conditionType: "DIFFICULTY_ACCURACY_COUNT",
    difficulty: "hard",
    threshold: 80,
    target: 10,
    displayOrder: 5,
  },
  {
    code: "LUCKY_SPINNER",
    name: "Lucky Spinner",
    description: "Complete 10 Spin Challenges",
    icon: "🎡",
    conditionType: "QUIZ_TYPE_COUNT",
    quizType: "SPIN",
    target: 10,
    displayOrder: 6,
  },
  {
    code: "CHALLENGER",
    name: "Challenger",
    description: "Win 10 Friend Challenges",
    icon: "⚔️",
    conditionType: "CHALLENGE_WIN_COUNT",
    target: 10,
    displayOrder: 7,
  },
  {
    code: "ELITE",
    name: "Elite",
    description: "Reach Global Top 10",
    icon: "👑",
    conditionType: "GLOBAL_RANK",
    target: 10,
    displayOrder: 8,
  },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDateKey = (date = new Date()) => new Date(date).toISOString().slice(0, 10);
let seedPromise = null;

const addDays = (dateKey, days) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
};

const seedDefaultAchievements = async () => {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = Promise.all(
    DEFAULT_ACHIEVEMENTS.map((achievement) =>
      Achievement.findOneAndUpdate(
        { code: achievement.code },
        { $setOnInsert: achievement },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  return seedPromise;
};

const getOrCreateStats = (userId) =>
  UserGamificationStats.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

const updateDailyStreak = async ({
  userId,
  activityId,
  activityType = "NORMAL",
  completedAt = new Date(),
  streakEligible = true,
}) => {
  const stats = await getOrCreateStats(userId);
  const normalizedActivityType = activityType || "NORMAL";
  const activityKey = String(activityId || "");
  const alreadyCredited = stats.creditedActivities.some(
    (item) =>
      item.activityType === normalizedActivityType &&
      item.activityId === activityKey
  );

  if (alreadyCredited) {
    return {
      stats,
      advancedToday: false,
      duplicate: true,
    };
  }

  const completedDate = toDateKey(completedAt);
  let advancedToday = false;

  if (streakEligible && stats.lastCompletedDate !== completedDate) {
    if (!stats.lastCompletedDate) {
      stats.currentStreak = 1;
    } else if (addDays(stats.lastCompletedDate, 1) === completedDate) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
    }

    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.lastCompletedDate = completedDate;
    advancedToday = true;
  }

  stats.creditedActivities.push({
    activityType: normalizedActivityType,
    activityId: activityKey,
    completedDate,
  });

  await stats.save();

  return {
    stats,
    advancedToday,
    duplicate: false,
  };
};

const getUserStreak = async (userId) => {
  const stats = await getOrCreateStats(userId);
  const today = toDateKey(new Date());

  return {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    lastCompletedDate: stats.lastCompletedDate,
    completedToday: stats.lastCompletedDate === today,
  };
};

const getGlobalRank = async (userId) => {
  const performance = await GlobalPerformance.findOne({ userId }).lean();

  if (!performance) {
    return null;
  }

  const betterCount = await GlobalPerformance.countDocuments({
    leaderboardPoints: { $gt: performance.leaderboardPoints },
  });

  return betterCount + 1;
};

const countAccuracyAttempts = async (userId, achievement) => {
  const query = {
    userId,
    accuracy: { $gte: toNumber(achievement.threshold) },
  };

  if (achievement.minimumQuestions) {
    query.questionCount = { $gte: toNumber(achievement.minimumQuestions) };
  }

  if (achievement.difficulty) {
    query.difficulty = achievement.difficulty;
  }

  return Result.countDocuments(query);
};

const countQuizTypeAttempts = async (userId, quizType) => {
  if (quizType === "SPIN") {
    return Result.countDocuments({ userId, quizType: "SPIN" });
  }

  if (quizType === "CHALLENGE") {
    return ChallengeAttempt.countDocuments({ userId, status: { $ne: "IN_PROGRESS" } });
  }

  if (quizType === "NORMAL") {
    return Result.countDocuments({
      userId,
      $or: [{ quizType: "NORMAL" }, { quizType: { $exists: false } }, { quizType: "" }],
    });
  }

  return Result.countDocuments({ userId });
};

const countChallengeWins = async (userId) => {
  const userAttempts = await ChallengeAttempt.find({
    userId,
    status: { $ne: "IN_PROGRESS" },
  })
    .select("challengeId")
    .lean();
  const challengeIds = Array.from(
    new Set(userAttempts.map((attempt) => attempt.challengeId).filter(Boolean))
  );

  if (!challengeIds.length) {
    return 0;
  }

  const attempts = await ChallengeAttempt.find({
    challengeId: { $in: challengeIds },
    status: { $ne: "IN_PROGRESS" },
  })
    .select("challengeId userId score accuracy timeTaken completedAt")
    .lean();
  const grouped = attempts.reduce((acc, attempt) => {
    acc[attempt.challengeId] = acc[attempt.challengeId] || [];
    acc[attempt.challengeId].push(attempt);
    return acc;
  }, {});

  return Object.values(grouped).reduce((wins, challengeAttempts) => {
    if (challengeAttempts.length < 2) {
      return wins;
    }

    const [winner] = challengeAttempts.sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      if (second.accuracy !== first.accuracy) {
        return second.accuracy - first.accuracy;
      }

      if (first.timeTaken !== second.timeTaken) {
        return first.timeTaken - second.timeTaken;
      }

      return new Date(first.completedAt || 0) - new Date(second.completedAt || 0);
    });

    return winner?.userId === userId ? wins + 1 : wins;
  }, 0);
};

const buildProgressSnapshot = async (userId, stats, achievements = []) => {
  const conditionTypes = new Set(achievements.map((item) => item.conditionType));
  const needsChallengeWins = conditionTypes.has("CHALLENGE_WIN_COUNT");
  const needsGlobalRank = conditionTypes.has("GLOBAL_RANK");
  const [quizAttempts, challengeWins, globalRank] = await Promise.all([
    Result.find({ userId })
      .select("accuracy questionCount difficulty quizType")
      .lean(),
    needsChallengeWins ? countChallengeWins(userId) : Promise.resolve(0),
    needsGlobalRank ? getGlobalRank(userId) : Promise.resolve(null),
  ]);
  const quizCount = quizAttempts.length;
  const quizTypeCounts = quizAttempts.reduce(
    (acc, attempt) => {
      const quizType = attempt.quizType || "NORMAL";
      acc[quizType] = (acc[quizType] || 0) + 1;
      return acc;
    },
    { NORMAL: 0, SPIN: 0 }
  );

  return {
    stats,
    quizAttempts,
    quizCount,
    quizTypeCounts,
    challengeWins,
    globalRank,
  };
};

const countSnapshotAccuracyAttempts = (snapshot, achievement) =>
  snapshot.quizAttempts.filter((attempt) => {
    const meetsAccuracy =
      toNumber(attempt.accuracy) >= toNumber(achievement.threshold);
    const meetsMinimumQuestions =
      !achievement.minimumQuestions ||
      toNumber(attempt.questionCount) >= toNumber(achievement.minimumQuestions);
    const meetsDifficulty =
      !achievement.difficulty || attempt.difficulty === achievement.difficulty;

    return meetsAccuracy && meetsMinimumQuestions && meetsDifficulty;
  }).length;

const getAchievementProgress = async (userId, achievement, stats, snapshot) => {
  const source = snapshot || (await buildProgressSnapshot(userId, stats));

  switch (achievement.conditionType) {
    case "QUIZ_COUNT":
      return source.quizCount;
    case "STREAK":
      return source.stats.currentStreak;
    case "ACCURACY":
    case "DIFFICULTY_ACCURACY_COUNT":
      return countSnapshotAccuracyAttempts(source, achievement);
    case "QUIZ_TYPE_COUNT":
      return source.quizTypeCounts[achievement.quizType] || 0;
    case "CHALLENGE_WIN_COUNT":
      return source.challengeWins;
    case "GLOBAL_RANK": {
      const rank = source.globalRank;
      return rank && rank <= toNumber(achievement.target) ? toNumber(achievement.target) : 0;
    }
    default:
      return 0;
  }
};

const formatUserAchievement = (achievement, progressRecord) => {
  const target = Math.max(1, toNumber(achievement.target, 1));
  const progress = Math.min(target, toNumber(progressRecord?.progress));

  return {
    id: achievement._id,
    code: achievement.code,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    conditionType: achievement.conditionType,
    target,
    threshold: achievement.threshold,
    difficulty: achievement.difficulty,
    quizType: achievement.quizType,
    minimumQuestions: achievement.minimumQuestions,
    displayOrder: achievement.displayOrder,
    progress,
    unlocked: Boolean(progressRecord?.unlocked),
    unlockedAt: progressRecord?.unlockedAt || null,
  };
};

const evaluateAchievements = async (userId) => {
  await seedDefaultAchievements();
  const stats = await getOrCreateStats(userId);
  const achievements = await Achievement.find({ active: true }).sort({
    displayOrder: 1,
    createdAt: 1,
  });
  const snapshot = await buildProgressSnapshot(userId, stats, achievements);
  const progressRows = await UserAchievement.find({
    userId,
    achievementId: { $in: achievements.map((item) => item._id.toString()) },
  });
  const progressMap = progressRows.reduce((acc, row) => {
    acc[row.achievementId] = row;
    return acc;
  }, {});
  const newAchievements = [];

  for (const achievement of achievements) {
    const progressValue = await getAchievementProgress(
      userId,
      achievement,
      stats,
      snapshot
    );
    const target = Math.max(1, toNumber(achievement.target, 1));
    const progress = Math.min(target, progressValue);
    const existing = progressMap[achievement._id.toString()];

    if (existing?.unlocked) {
      if (progress > existing.progress) {
        existing.progress = progress;
        await existing.save();
      }
      continue;
    }

    const shouldUnlock = progressValue >= target;
    const update = {
      progress,
      ...(shouldUnlock
        ? {
            unlocked: true,
            unlockedAt: new Date(),
          }
        : {}),
    };
    const saved = await UserAchievement.findOneAndUpdate(
      { userId, achievementId: achievement._id.toString() },
      { $set: update, $setOnInsert: { userId, achievementId: achievement._id.toString() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (shouldUnlock && !existing?.unlocked) {
      newAchievements.push(formatUserAchievement(achievement, saved));
    }
  }

  return newAchievements;
};

const getUserAchievements = async (userId, { includeInactiveUnlocked = false } = {}) => {
  await seedDefaultAchievements();
  const stats = await getOrCreateStats(userId);
  const query = includeInactiveUnlocked ? {} : { active: true };
  const achievements = await Achievement.find(query).sort({
    displayOrder: 1,
    createdAt: 1,
  });
  const snapshot = await buildProgressSnapshot(userId, stats, achievements);
  const progressRows = await UserAchievement.find({
    userId,
    achievementId: { $in: achievements.map((item) => item._id.toString()) },
  }).lean();
  const progressMap = progressRows.reduce((acc, row) => {
    acc[row.achievementId] = row;
    return acc;
  }, {});
  const visibleAchievements = achievements.filter(
    (achievement) =>
      achievement.active || progressMap[achievement._id.toString()]?.unlocked
  );
  const payload = await Promise.all(
    visibleAchievements.map(async (achievement) => {
      const existingProgress = progressMap[achievement._id.toString()];
      const computedProgress = await getAchievementProgress(
        userId,
        achievement,
        stats,
        snapshot
      );
      const target = Math.max(1, toNumber(achievement.target, 1));
      const progress = Math.min(
        target,
        Math.max(
          toNumber(existingProgress?.progress),
          toNumber(computedProgress)
        )
      );

      return formatUserAchievement(achievement, {
        ...existingProgress,
        progress,
        unlocked: Boolean(existingProgress?.unlocked) || progress >= target,
      });
    })
  );

  return {
    total: payload.length,
    unlocked: payload.filter((item) => item.unlocked).length,
    streak: {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      completedToday: stats.lastCompletedDate === toDateKey(new Date()),
    },
    achievements: payload,
  };
};

const handleQuizGamification = async ({
  userId,
  activityId,
  activityType = "NORMAL",
  completedAt = new Date(),
  streakEligible = true,
}) => {
  const streakResult = await updateDailyStreak({
    userId,
    activityId,
    activityType,
    completedAt,
    streakEligible,
  });
  const newAchievements = streakResult.duplicate
    ? []
    : await evaluateAchievements(userId);

  return {
    streak: {
      currentStreak: streakResult.stats.currentStreak,
      longestStreak: streakResult.stats.longestStreak,
      lastCompletedDate: streakResult.stats.lastCompletedDate,
      advancedToday: streakResult.advancedToday,
    },
    newAchievements,
  };
};

module.exports = {
  DEFAULT_ACHIEVEMENTS,
  evaluateAchievements,
  getUserAchievements,
  getUserStreak,
  handleQuizGamification,
  seedDefaultAchievements,
};
