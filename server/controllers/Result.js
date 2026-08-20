const https = require("https");
const mongoose = require("mongoose");
const Result = require("../Modals/Result");
const User = require("../Modals/User");
const Event = require("../Modals/Event");
const Notification = require("../Modals/Notification");
const AdminNotification = require("../Modals/AdminNotification");
const UserNotification = require("../Modals/UserNotification");
const EventRegistration = require("../Modals/EventRegistration");
const EventResult = require("../Modals/EventResult");
const Challenge = require("../Modals/Challenge");
const ChallengeAttempt = require("../Modals/ChallengeAttempt");
const {
  buildEventEndAt,
  getEffectiveEventStatus,
  withEffectiveEventStatus,
} = require("../utils/eventStatus");
const { validateName } = require("../utils/nameValidation");
const { getUniqueExistingQuestions } = require("../services/questionExtractionService");
const {
  getGlobalLeaderboard,
  updateGlobalPerformance,
} = require("../services/globalLeaderboardService");
const { handleQuizGamification } = require("../services/gamificationService");

const categoryNames = {
  9: "General Knowledge",
  10: "Books",
  11: "Films",
  12: "Music",
  13: "Musicals and Theaters",
  14: "Television",
  15: "Video Games",
  16: "Board Games",
  17: "Science and Nature",
  18: "Computer",
  19: "Mathematics",
  20: "Mythology",
  21: "Sports",
  22: "Geography",
  23: "History",
  24: "Politics",
  26: "Celebrities",
  27: "Animals",
  28: "Vehicles",
  29: "Comics",
  30: "Gadgets",
  31: "Japanese Anime",
  32: "Cartoon and Animations",
};

const POINTS_PER_QUESTION = 10;

const fetchJsonFromUrl = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });

const normalizeQuestionMatchValue = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/^entertainment:\s*/i, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeResult = (item) => {
  const result = item.toObject ? item.toObject() : { ...item };
  const questionCount = Math.max(1, toNumber(result.questionCount, 10));
  const maxScore = Math.max(
    1,
    toNumber(result.maxScore, questionCount * POINTS_PER_QUESTION)
  );
  const rawScore = toNumber(result.score);
  const correctAnswers = Math.min(
    questionCount,
    Math.max(
      0,
      toNumber(result.correctAnswers, Math.round(rawScore / POINTS_PER_QUESTION))
    )
  );
  const score = Math.min(maxScore, correctAnswers * POINTS_PER_QUESTION);
  const wrongAnswers = Math.max(
    0,
    Math.min(
      questionCount - correctAnswers,
      toNumber(result.wrongAnswers, questionCount - correctAnswers)
    )
  );
  const timeTaken = toNumber(result.timeTaken, toNumber(result.totaltime));
  const accuracy = (correctAnswers / questionCount) * 100;
  const averageTimePerQuestion = toNumber(
    result.averageTimePerQuestion,
    timeTaken / questionCount
  );
  const scorePercentage = (score / maxScore) * 100;

  return {
    ...result,
    score,
    maxScore,
    correctAnswers,
    wrongAnswers,
    accuracy,
    questionCount,
    timeTaken,
    totaltime: toNumber(result.totaltime, timeTaken),
    averageTimePerQuestion,
    scorePercentage,
  };
};

const rankResults = (items) =>
  items.sort((a, b) => {
    if (b.accuracy !== a.accuracy) {
      return b.accuracy - a.accuracy;
    }

    if (b.scorePercentage !== a.scorePercentage) {
      return b.scorePercentage - a.scorePercentage;
    }

    return a.averageTimePerQuestion - b.averageTimePerQuestion;
  });

const normalizeAnswerAnalysis = (
  answers = [],
  fallbackCategory,
  fallbackDifficulty,
  maxCount = 0
) => {
  const answerMap = new Map();

  (Array.isArray(answers) ? answers : []).forEach((item, index) => {
    const isCorrect = Boolean(item.isCorrect);
    const questionIndex = Math.max(0, toNumber(item.questionIndex, index));
    const key = Number.isFinite(Number(item.questionIndex))
      ? `index:${questionIndex}`
      : `question:${item.question || index}`;

    answerMap.set(key, {
      question: String(item.question || ""),
      questionIndex,
      options: Array.isArray(item.options)
        ? item.options.map((option) => String(option))
        : [],
      selectedAnswer: String(item.selectedAnswer || ""),
      correctAnswer: String(item.correctAnswer || ""),
      isCorrect,
      category: String(item.category || fallbackCategory || ""),
      difficulty: String(item.difficulty || fallbackDifficulty || ""),
      pointsEarned: isCorrect ? POINTS_PER_QUESTION : 0,
    });
  });

  return Array.from(answerMap.values())
    .sort((a, b) => a.questionIndex - b.questionIndex)
    .slice(0, maxCount || undefined);
};

const getQuestions = async (req, res) => {
  const {
    amount = 10,
    category = "",
    difficulty = "",
    type = "multiple",
  } = req.query;
  const requestedAmount = Math.max(1, toNumber(amount, 10));
  const requestedCategoryName = normalizeQuestionMatchValue(categoryNames[category] || "");
  const requestedDifficulty = normalizeQuestionMatchValue(difficulty);
  const requestedType = normalizeQuestionMatchValue(type || "multiple");

  const query = new URLSearchParams({
    amount,
    category,
    difficulty,
    type,
  }).toString();

  try {
    const apiUrl = `https://opentdb.com/api.php?${query}`;
    const parsed = await fetchJsonFromUrl(apiUrl);
    const externalQuestions = Array.isArray(parsed.results) ? parsed.results : [];

    if (externalQuestions.length > 0) {
      return res.status(200).json(externalQuestions);
    }

    const questionBank = await getUniqueExistingQuestions();
    const internalQuestions = (questionBank.questions || [])
      .filter((question) => {
        const categoryMatches =
          !requestedCategoryName ||
          normalizeQuestionMatchValue(question.category) === requestedCategoryName;
        const difficultyMatches =
          !requestedDifficulty ||
          normalizeQuestionMatchValue(question.difficulty) === requestedDifficulty;
        const typeMatches =
          !requestedType ||
          normalizeQuestionMatchValue(question.type || "multiple") === requestedType;

        return (
          categoryMatches &&
          difficultyMatches &&
          typeMatches &&
          question.question &&
          question.correctAnswer &&
          Array.isArray(question.options) &&
          question.options.length > 1
        );
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, requestedAmount)
      .map((question) => {
        const correctAnswer = String(question.correctAnswer || "");
        const incorrectAnswers = (question.options || [])
          .filter((option) => option !== correctAnswer)
          .slice(0, requestedType === "boolean" ? 1 : 3);

        return {
          category: question.category || categoryNames[category] || "",
          type: question.type || requestedType || "multiple",
          difficulty: question.difficulty || requestedDifficulty || "",
          question: question.question,
          correct_answer: correctAnswer,
          incorrect_answers: incorrectAnswers,
        };
      });

    if (internalQuestions.length > 0) {
      return res.status(200).json(internalQuestions);
    }

    return res.status(200).json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const result = async (req, res) => {
  const { userId, ...others } = req.body;
  try {
    const attemptKey = String(others.attemptKey || "").trim();

    if (attemptKey) {
      const existingAttempt = await Result.findOne({
        userId: req.user.userId,
        attemptKey,
      });

      if (existingAttempt) {
        await updateGlobalPerformance({
          userId: req.user.userId,
          attemptId: existingAttempt._id.toString(),
          attemptType: "QUIZ",
          correctAnswers: existingAttempt.correctAnswers,
          questionCount: existingAttempt.questionCount,
          difficulty: existingAttempt.difficulty,
          completedAt: existingAttempt.createdAt || new Date(),
        });

        return res.status(200).json(existingAttempt);
      }
    }

    const questionCount = Math.max(1, toNumber(others.questionCount, 10));
    const maxScore = Math.max(
      1,
      toNumber(others.maxScore, questionCount * POINTS_PER_QUESTION)
    );
    const rawScore = toNumber(others.score);
    const correctAnswers = Math.min(
      questionCount,
      Math.max(
        0,
        toNumber(others.correctAnswers, Math.round(rawScore / POINTS_PER_QUESTION))
      )
    );
    const score = Math.min(maxScore, correctAnswers * POINTS_PER_QUESTION);
    const wrongAnswers = Math.max(
      0,
      Math.min(
        questionCount - correctAnswers,
        toNumber(others.wrongAnswers, questionCount - correctAnswers)
      )
    );
    const timeTaken = toNumber(others.timeTaken, toNumber(others.totaltime));
    const accuracy = (correctAnswers / questionCount) * 100;
    const averageTimePerQuestion = timeTaken / questionCount;
    const scorePercentage = (score / maxScore) * 100;
    const answers = normalizeAnswerAnalysis(
      others.answers,
      others.category,
      others.difficulty,
      questionCount
    );
    const quizType = others.quizType === "SPIN" ? "SPIN" : "NORMAL";

    const result = await new Result({
      ...others,
      userId: req.user.userId,
      attemptKey: attemptKey || undefined,
      quizType,
      score,
      maxScore,
      correctAnswers,
      wrongAnswers,
      accuracy,
      questionCount,
      timeTaken,
      totaltime: timeTaken,
      averageTimePerQuestion,
      scorePercentage,
      answers,
    }).save();

    await updateGlobalPerformance({
      userId: req.user.userId,
      attemptId: result._id.toString(),
      attemptType: "QUIZ",
      correctAnswers,
      questionCount,
      difficulty: others.difficulty,
      completedAt: result.createdAt || new Date(),
    });

    const gamification = await handleQuizGamification({
      userId: req.user.userId,
      activityId: result._id.toString(),
      activityType: quizType,
      completedAt: result.createdAt || new Date(),
      streakEligible: ["NORMAL", "SPIN"].includes(quizType),
    });

    res.status(201).json({
      ...result.toObject(),
      streak: gamification.streak,
      newAchievements: gamification.newAchievements,
    });
  } catch (error) {
    if (error.code === 11000 && others.attemptKey) {
      const existingAttempt = await Result.findOne({
        userId: req.user.userId,
        attemptKey: String(others.attemptKey || "").trim(),
      });

      if (existingAttempt) {
        return res.status(200).json(existingAttempt);
      }
    }

    res.status(500).json({ error: error.message });
  }
};

const quizAnalysis = async (req, res) => {
  try {
    const attempt = await Result.findOne({
      _id: req.params.attemptId,
      userId: req.user.userId,
    })
      .select(
        "name category difficulty score maxScore correctAnswers wrongAnswers accuracy questionCount timeTaken totaltime averageTimePerQuestion scorePercentage answers createdAt"
      )
      .lean();

    if (!attempt) {
      return res.status(404).json({ error: "Quiz attempt not found" });
    }

    res.status(200).json(normalizeResult(attempt));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const leaderboard = async (req, res) => {
  try {
    const questionCount = toNumber(req.query.questionCount);
    const results = await Result.find().select("-answers").lean();
    const normalizedResults = results
      .map(normalizeResult)
      .filter((item) => !questionCount || item.questionCount === questionCount);

    res.status(200).json(rankResults(normalizedResults).slice(0, 4));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const globalLeaderboard = async (req, res) => {
  try {
    const payload = await getGlobalLeaderboard({
      userId: req.user.userId,
      limit: req.query.limit,
    });

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const allresult = async (req, res) => {
  try {
    const results = await Result.find().select("-answers").lean();
    res.status(200).json(rankResults(results.map(normalizeResult)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchResult = async (req, res) => {
  const { category, difficulty, questionCount } = req.body;
  try {
    const matchStage = {};
    if (category !== undefined && category !== null && category !== "") {
      matchStage.category = category;
    }
    if (difficulty !== undefined && difficulty !== null && difficulty !== "") {
      matchStage.difficulty = difficulty;
    }
    const results = await Result.find(matchStage)
      .select("-profilePicture -answers")
      .lean();
    const selectedQuestionCount = toNumber(questionCount);
    const normalizedResults = results
      .map(normalizeResult)
      .filter(
        (item) =>
          !selectedQuestionCount || item.questionCount === selectedQuestionCount
      );

    res.status(200).json(
      rankResults(normalizedResults).map(({ profilePicture, ...item }) => item)
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "name email profilePicture"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const results = (
      await Result.find({ userId: req.user.userId }).sort({
      createdAt: -1,
      })
    ).map(normalizeResult);

    const gamesPlayed = results.length;
    const highestScore = gamesPlayed
      ? Math.max(...results.map((item) => item.score))
      : 0;
    const totalScore = results.reduce((sum, item) => sum + item.score, 0);
    const avgScore = gamesPlayed ? Math.round(totalScore / gamesPlayed) : 0;
    const averageAccuracy = gamesPlayed
      ? Math.round(
          results.reduce((sum, item) => sum + toNumber(item.accuracy), 0) /
            gamesPlayed
        )
      : 0;

    const categoryMap = results.reduce((acc, item) => {
      const category = item.category;

      if (!acc[category]) {
        acc[category] = {
          category,
          categoryName: categoryNames[category] || "Unknown",
          gamesPlayed: 0,
          totalScore: 0,
          totalAccuracy: 0,
          highestScore: 0,
        };
      }

      acc[category].gamesPlayed += 1;
      acc[category].totalScore += item.score;
      acc[category].totalAccuracy += toNumber(item.accuracy);
      acc[category].highestScore = Math.max(
        acc[category].highestScore,
        item.score
      );

      return acc;
    }, {});

    const performanceByCategory = Object.values(categoryMap)
      .map((item) => ({
        ...item,
        avgRawScore: Math.round(item.totalScore / item.gamesPlayed),
        avgScore: Math.min(
          100,
          Math.round(item.totalAccuracy / item.gamesPlayed)
        ),
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    const recentHistory = results.slice(0, 8).map((item) => ({
      _id: item._id,
      category: item.category,
      categoryName: categoryNames[item.category] || "Unknown",
      difficulty: item.difficulty,
      score: item.score,
      totalTime: item.totaltime,
      createdAt: item.createdAt,
    }));
    const userId = req.user.userId;
    const challenges = await Challenge.find({
      participants: userId,
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    const challengeIds = challenges.map((item) => item._id.toString());
    const challengeAttempts = await ChallengeAttempt.find({
      challengeId: { $in: challengeIds },
    }).lean();
    const attemptMap = challengeAttempts.reduce((acc, attempt) => {
      if (!acc[attempt.challengeId]) {
        acc[attempt.challengeId] = [];
      }

      acc[attempt.challengeId].push(attempt);
      return acc;
    }, {});
    const challengeHistory = challenges.map((challenge) => {
      const attempts = attemptMap[challenge._id.toString()] || [];
      const userAttempt =
        attempts.find((attempt) => attempt.userId === userId) || null;
      const participantCount = challenge.participants.length;
      const isExpired =
        challenge.status !== "COMPLETED" &&
        challenge.status !== "CANCELLED" &&
        new Date(challenge.expiresAt) <= new Date();
      const status = isExpired ? "EXPIRED" : challenge.status;

      return {
        _id: challenge._id,
        challengeCode: challenge.challengeCode,
        createdBy: challenge.createdBy,
        categoryName: challenge.config.categoryName,
        difficulty: challenge.config.difficulty,
        questionCount: challenge.config.questionCount,
        duration: challenge.config.duration,
        status,
        createdAt: challenge.createdAt,
        participantCount,
        completedCount: attempts.length,
        hasCompleted: Boolean(userAttempt),
        canDelete:
          challenge.createdBy === userId &&
          participantCount <= 1 &&
          attempts.length === 0 &&
          status === "OPEN",
        score: userAttempt?.score ?? null,
        maxScore: userAttempt?.maxScore ?? challenge.config.questionCount * 10,
      };
    });

    res.status(200).json({
      user,
      stats: {
        gamesPlayed,
        highestScore,
        avgScore,
        accuracy: Math.min(100, averageAccuracy),
      },
      performanceByCategory,
      recentHistory,
      challengeHistory,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const profilePicture = String(req.body.profilePicture || "").trim();

    const nameError = validateName(name);

    if (nameError) {
      return res.status(400).json({ error: nameError });
    }

    if (!email) {
      return res.status(400).json({ error: "Email is mandatory" });
    }

    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user.userId },
    }).select("_id");

    if (existingUser) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        name,
        email,
        ...(profilePicture ? { profilePicture } : {}),
      },
      { new: true, runValidators: true }
    ).select("name email profilePicture role");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await Result.updateMany(
      { userId: req.user.userId },
      {
        name: updatedUser.name,
        profilePicture: updatedUser.profilePicture,
      }
    );

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const notifications = async (req, res) => {
  try {
    const [items, userNotifications] = await Promise.all([
      Notification.find({ userId: req.user.userId }).sort({
        createdAt: -1,
      }),
      UserNotification.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .lean(),
    ]);
    const adminNotificationIds = userNotifications.map(
      (item) => item.notificationId
    );
    const adminNotifications = await AdminNotification.find({
      _id: { $in: adminNotificationIds },
    }).lean();
    const adminNotificationMap = adminNotifications.reduce((acc, item) => {
      acc[item._id.toString()] = item;
      return acc;
    }, {});
    const generalNotifications = userNotifications
      .filter((delivery) => adminNotificationMap[delivery.notificationId])
      .map((delivery) => {
        const notification = adminNotificationMap[delivery.notificationId];

        return {
          _id: delivery._id,
          notificationId: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          targetType: notification.targetType,
          read: delivery.isRead,
          isRead: delivery.isRead,
          readAt: delivery.readAt,
          createdAt: delivery.createdAt,
          source: "ADMIN",
        };
      });
    const latestItems = items.filter(
      (item, index, list) =>
        list.findIndex((entry) => entry.eventId === item.eventId) === index
    );
    const eventBackedItems = latestItems.filter((item) =>
      mongoose.Types.ObjectId.isValid(item.eventId)
    );
    const standaloneNotifications = latestItems
      .filter((item) => !mongoose.Types.ObjectId.isValid(item.eventId))
      .map((item) => ({
        ...item.toObject(),
        _id: item._id.toString(),
        type: item.eventId?.startsWith("WELCOME:") ? "WELCOME" : "GENERAL",
        isRead: item.read,
        source: "SYSTEM",
      }));
    const eventIds = eventBackedItems.map((item) => item.eventId);
    const [events, registrations] = await Promise.all([
      Event.find({ _id: { $in: eventIds } }).select(
        "eventName categoryName difficulty eventDate startTime startAt endAt duration timerMode totalDuration timePerQuestion status registrationDeadline"
      ),
      EventRegistration.find({
        userId: req.user.userId,
        eventId: { $in: eventIds },
      }),
    ]);

    const eventMap = events.reduce((acc, event) => {
      acc[event._id.toString()] = event;
      return acc;
    }, {});
    const registeredEventIds = new Set(
      registrations.map((item) => item.eventId)
    );
    const existingEventIds = Object.keys(eventMap);
    const results = await EventResult.find({
      userId: req.user.userId,
      eventId: { $in: existingEventIds },
    });
    const submittedEventIds = new Set(results.map((item) => item.eventId));

    const eventNotifications = eventBackedItems
        .filter((item) => eventMap[item.eventId])
        .map((item) => ({
          ...item.toObject(),
          type: "EVENT",
          isRead: item.read,
          source: "EVENT",
          event: {
            ...withEffectiveEventStatus(eventMap[item.eventId]),
            computedStatus: getEffectiveEventStatus(eventMap[item.eventId]),
          },
          isRegistered: registeredEventIds.has(item.eventId),
          hasSubmitted: submittedEventIds.has(item.eventId),
        }));

    res.status(200).json(
      [...generalNotifications, ...standaloneNotifications, ...eventNotifications].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const unreadNotificationCount = async (req, res) => {
  try {
    const [result] = await Notification.aggregate([
      { $match: { userId: req.user.userId } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$eventId", read: { $first: "$read" } } },
      { $match: { read: false } },
      { $count: "count" },
    ]);
    const generalCount = await UserNotification.countDocuments({
      userId: req.user.userId,
      isRead: false,
    });
    const count = (result?.count || 0) + generalCount;

    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await Promise.all([
      Notification.updateMany(
        { userId: req.user.userId, read: false },
        { read: true }
      ),
      UserNotification.updateMany(
        { userId: req.user.userId, isRead: false },
        { isRead: true, readAt: new Date() }
      ),
    ]);

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const updated = await UserNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!updated) {
      const legacyUpdated = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.userId },
        { read: true },
        { new: true }
      );

      if (!legacyUpdated) {
        return res.status(404).json({ error: "Notification not found" });
      }
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAllNotificationsRead = markNotificationsRead;

const registerEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const effectiveStatus = getEffectiveEventStatus(event);

    if (effectiveStatus !== "UPCOMING" && effectiveStatus !== "LIVE") {
      return res.status(400).json({ error: "Event is not open for registration" });
    }

    const registrationDeadline = new Date(event.registrationDeadline);
    registrationDeadline.setHours(23, 59, 59, 999);
    registrationDeadline.setHours(registrationDeadline.getHours() + 1);

    if (registrationDeadline < new Date()) {
      return res.status(400).json({ error: "Registration deadline has passed" });
    }

    const registration = await EventRegistration.findOneAndUpdate(
      { eventId: event._id.toString(), userId: req.user.userId },
      { eventId: event._id.toString(), userId: req.user.userId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: "Registered successfully",
      registration,
      event: withEffectiveEventStatus(event),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ message: "Already registered" });
    }

    res.status(500).json({ error: error.message });
  }
};

const registeredEvents = async (req, res) => {
  try {
    const registrations = await EventRegistration.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });
    const eventIds = registrations.map((item) => item.eventId);
    const [events, results] = await Promise.all([
      Event.find({ _id: { $in: eventIds } }).sort({ eventDate: 1 }),
      EventResult.find({ userId: req.user.userId, eventId: { $in: eventIds } }),
    ]);
    const resultMap = results.reduce((acc, item) => {
      acc[item.eventId] = item;
      return acc;
    }, {});

    res.status(200).json(
      events.map((event) => ({
        ...event.toObject(),
        effectiveStatus: getEffectiveEventStatus(event),
        computedStatus: getEffectiveEventStatus(event),
        hasSubmitted: Boolean(resultMap[event._id.toString()]),
        result: resultMap[event._id.toString()] || null,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEventForPlay = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const registration = await EventRegistration.findOne({
      eventId: event._id.toString(),
      userId: req.user.userId,
    });

    if (!registration) {
      return res.status(403).json({ error: "Please register before participating" });
    }

    const existingResult = await EventResult.findOne({
      eventId: event._id.toString(),
      userId: req.user.userId,
    });

    if (existingResult) {
      return res.status(400).json({ error: "You have already completed this event" });
    }

    const effectiveStatus = getEffectiveEventStatus(event);

    if (effectiveStatus !== "LIVE") {
      return res.status(400).json({ error: "Event is not live yet" });
    }

    res.status(200).json({
      _id: event._id,
      eventName: event.eventName,
      categoryName: event.categoryName,
      difficulty: event.difficulty,
      duration: event.duration,
      timerMode: event.timerMode || "TOTAL",
      totalDuration: event.totalDuration,
      timePerQuestion: event.timePerQuestion,
      startAt: event.startAt,
      endAt: event.endAt,
      effectiveStatus,
      questionCount: event.questionCount,
      questions: event.questions
        .sort((a, b) => a.questionOrder - b.questionOrder)
        .map((question) => ({
          questionOrder: question.questionOrder,
          question: question.question,
          answers: question.answers
            .sort((a, b) => a.answerOrder - b.answerOrder)
            .map((answer) => ({
              answerOrder: answer.answerOrder,
              answer: answer.answer,
            })),
        })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitEventResult = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const registration = await EventRegistration.findOne({
      eventId: event._id.toString(),
      userId: req.user.userId,
    });

    if (!registration) {
      return res.status(403).json({ error: "Please register before submitting" });
    }

    const existingResult = await EventResult.findOne({
      eventId: event._id.toString(),
      userId: req.user.userId,
    });

    if (existingResult) {
      return res.status(400).json({ error: "You have already completed this event" });
    }

    const effectiveStatus = getEffectiveEventStatus(event);

    if (effectiveStatus === "UPCOMING") {
      return res.status(400).json({ error: "Event is not live yet" });
    }

    if (effectiveStatus !== "LIVE") {
      return res.status(400).json({ error: "Event submission time has ended" });
    }

    if (new Date() > buildEventEndAt(event)) {
      return res.status(400).json({ error: "Event submission time has ended" });
    }

    const submittedAnswers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const submittedMap = submittedAnswers.reduce((acc, item) => {
      acc[item.questionOrder] = item.selectedAnswer;
      return acc;
    }, {});

    let correctCount = 0;
    const answers = event.questions.map((question) => {
      const selectedAnswer = submittedMap[question.questionOrder] || "";
      const isCorrect = selectedAnswer === question.correctAnswer;

      if (isCorrect) {
        correctCount += 1;
      }

      return {
        questionOrder: question.questionOrder,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      };
    });

    const totalQuestions = event.questions.length;
    const score = totalQuestions
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    const result = await new EventResult({
      eventId: event._id.toString(),
      userId: req.user.userId,
      score,
      correctCount,
      totalQuestions,
      totalTime: Number(req.body.totalTime || 0),
      answers,
    }).save();

    await updateGlobalPerformance({
      userId: req.user.userId,
      attemptId: result._id.toString(),
      attemptType: "EVENT",
      correctAnswers: correctCount,
      questionCount: totalQuestions,
      difficulty: event.difficulty,
      completedAt: result.createdAt || new Date(),
    });

    const payload = await buildEventResultPayload(
      event._id.toString(),
      req.user.userId,
      result
    );

    res.status(201).json(payload);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "You have already completed this event" });
    }

    res.status(500).json({ error: error.message });
  }
};

const getEventResult = async (req, res) => {
  try {
    const result = await EventResult.findOne({
      eventId: req.params.id,
      userId: req.user.userId,
    });

    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }

    const payload = await buildEventResultPayload(
      req.params.id,
      req.user.userId,
      result
    );

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const buildEventResultPayload = async (eventId, userId, currentResult) => {
  const [event, results] = await Promise.all([
    Event.findById(eventId).select(
      "eventName categoryName difficulty questionCount duration timerMode totalDuration timePerQuestion status eventDate startTime startAt endAt"
    ),
    EventResult.find({ eventId }).sort({
      score: -1,
      totalTime: 1,
      createdAt: 1,
    }),
  ]);

  const userIds = results.map((item) => item.userId);
  const users = await User.find({ _id: { $in: userIds } }).select(
    "name email profilePicture"
  );
  const userMap = users.reduce((acc, user) => {
    acc[user._id.toString()] = user;
    return acc;
  }, {});

  const rankedResults = results.map((item, index) => {
    const user = userMap[item.userId];

    return {
      _id: item._id,
      rank: index + 1,
      userId: item.userId,
      name: user?.name || "Unknown User",
      profilePicture: user?.profilePicture || "",
      score: item.score,
      correctCount: item.correctCount,
      totalQuestions: item.totalQuestions,
      totalTime: item.totalTime,
      createdAt: item.createdAt,
    };
  });

  const currentRank =
    rankedResults.find((item) => item.userId === userId)?.rank || null;

  return {
    result: currentResult,
    event: event ? withEffectiveEventStatus(event) : null,
    leaderboard: rankedResults.slice(0, 5),
    participantCount: rankedResults.length,
    rank: currentRank,
    currentUserEntry:
      rankedResults.find((item) => item.userId === userId) || null,
  };
};

module.exports = {
  getQuestions,
  result,
  quizAnalysis,
  leaderboard,
  globalLeaderboard,
  allresult,
  searchResult,
  profile,
  updateProfile,
  notifications,
  unreadNotificationCount,
  markNotificationsRead,
  markNotificationRead,
  markAllNotificationsRead,
  registerEvent,
  registeredEvents,
  getEventForPlay,
  submitEventResult,
  getEventResult,
};
