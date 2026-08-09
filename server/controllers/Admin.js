const https = require("https");
const Event = require("../Modals/Event");
const Notification = require("../Modals/Notification");
const EventRegistration = require("../Modals/EventRegistration");
const EventResult = require("../Modals/EventResult");
const Result = require("../Modals/Result");
const ChallengeAttempt = require("../Modals/ChallengeAttempt");
const Challenge = require("../Modals/Challenge");
const AdminNotification = require("../Modals/AdminNotification");
const UserNotification = require("../Modals/UserNotification");
const User = require("../Modals/User");
const {
  buildEventEndAt,
  buildEventSchedule,
  getEffectiveEventStatus,
  withEffectiveEventStatus,
} = require("../utils/eventStatus");

const REQUIRED_FIELDS = [
  "eventName",
  "description",
  "categoryId",
  "categoryName",
  "difficulty",
  "questionCount",
  "questionType",
  "duration",
  "eventDate",
  "startTime",
  "registrationDeadline",
];

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

const buildApiUrl = ({ questionCount, categoryId, difficulty, questionType }) => {
  const params = new URLSearchParams({
    amount: String(questionCount),
    category: String(categoryId),
    difficulty,
    type: questionType,
  });

  return `https://opentdb.com/api.php?${params.toString()}`;
};

const validateEventPayload = (payload) => {
  const errors = {};

  REQUIRED_FIELDS.forEach((field) => {
    if (
      payload[field] === undefined ||
      payload[field] === null ||
      payload[field] === ""
    ) {
      errors[field] = `${field} is mandatory`;
    }
  });

  if (payload.difficulty && !["easy", "medium", "hard"].includes(payload.difficulty)) {
    errors.difficulty = "Invalid difficulty";
  }

  if (payload.questionType && !["multiple", "boolean"].includes(payload.questionType)) {
    errors.questionType = "Invalid question type";
  }

  if (payload.questionCount && Number(payload.questionCount) < 1) {
    errors.questionCount = "Question count must be greater than 0";
  }

  if (payload.duration && Number(payload.duration) < 1) {
    errors.duration = "Duration must be greater than 0";
  }

  return errors;
};

const normalizeEventPayload = (payload, userId) => {
  const normalized = {
    eventName: payload.eventName,
    description: payload.description,
    categoryId: Number(payload.categoryId),
    categoryName: payload.categoryName,
    difficulty: payload.difficulty,
    questionCount: Number(payload.questionCount),
    questionType: payload.questionType,
    duration: Number(payload.duration),
    eventDate: payload.eventDate,
    startTime: payload.startTime,
    registrationDeadline: payload.registrationDeadline,
    notifyUsers: Boolean(payload.notifyUsers),
  };

  const schedule = buildEventSchedule(normalized);
  normalized.startAt = schedule.startAt;
  normalized.endAt = schedule.endAt;
  normalized.apiUrl = buildApiUrl(normalized);

  if (userId) {
    normalized.createdBy = userId;
  }

  return normalized;
};

const fetchOpenTdbQuestions = (url) =>
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

const normalizeQuestions = (questions) =>
  questions.map((item, questionIndex) => {
    const answers = [
      { answer: item.correct_answer, isCorrect: true },
      ...item.incorrect_answers.map((answer) => ({
        answer,
        isCorrect: false,
      })),
    ].map((answer, answerIndex) => ({
      ...answer,
      answerOrder: answerIndex + 1,
    }));

    return {
      questionOrder: questionIndex + 1,
      question: item.question,
      correctAnswer: item.correct_answer,
      incorrectAnswers: item.incorrect_answers,
      answers,
    };
  });

const getUserStatus = (user) => {
  if (user.isDeleted) return "Deleted";
  if (user.isActive === false) return "Inactive";
  return "Active";
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profilePicture: user.profilePicture,
  role: user.role || "USER",
  isActive: user.isActive !== false,
  isDeleted: Boolean(user.isDeleted),
  deactivatedAt: user.deactivatedAt,
  deletedAt: user.deletedAt,
  createdAt: user.createdAt,
  status: getUserStatus(user),
});

const ensureCanManageUser = (targetUser, adminUserId) => {
  if (!targetUser) {
    return "User not found";
  }

  if (targetUser._id.toString() === adminUserId) {
    return "You cannot manage your own active admin account";
  }

  return "";
};

const createNotificationDeliveries = async ({
  title,
  message,
  type,
  targetType,
  createdBy,
  userIds,
}) => {
  const uniqueUserIds = [...new Set(userIds.map((item) => String(item)))];

  if (!title?.trim() || !message?.trim()) {
    throw new Error("Title and message are required");
  }

  if (uniqueUserIds.length === 0) {
    throw new Error("No eligible recipients found");
  }

  const notification = await new AdminNotification({
    title: title.trim(),
    message: message.trim(),
    type,
    targetType,
    createdBy,
    recipientCount: uniqueUserIds.length,
  }).save();

  await UserNotification.insertMany(
    uniqueUserIds.map((userId) => ({
      notificationId: notification._id.toString(),
      userId,
    })),
    { ordered: false }
  );

  return notification;
};

const dashboard = async (req, res) => {
  try {
    const [
      events,
      quizResults,
      challenges,
      challengeAttempts,
      totalUsers,
      activeUsers,
      eventRegistrations,
      eventResults,
    ] = await Promise.all([
      Event.find().select(
        "eventName categoryName status eventDate startTime startAt endAt duration"
      ),
      Result.find().select(
        "name userId category correctAnswers questionCount createdAt"
      ),
      Challenge.find().select("challengeCode status expiresAt config createdAt"),
      ChallengeAttempt.find().select(
        "userId challengeId correctAnswers wrongAnswers createdAt completedAt"
      ),
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ isActive: { $ne: false }, isDeleted: { $ne: true } }),
      EventRegistration.find().select("eventId userId createdAt").lean(),
      EventResult.find().select("eventId userId createdAt").lean(),
    ]);
    const counts = events.reduce(
      (acc, event) => {
        const effectiveStatus = getEffectiveEventStatus(event);
        acc[effectiveStatus] = (acc[effectiveStatus] || 0) + 1;
        return acc;
      },
      { DRAFT: 0, UPCOMING: 0, LIVE: 0, COMPLETED: 0 }
    );
    const eventRegistrationCounts = eventRegistrations.reduce((acc, item) => {
      acc[item.eventId] = (acc[item.eventId] || 0) + 1;
      return acc;
    }, {});
    const challengeCounts = challenges.reduce(
      (acc, challenge) => {
        const effectiveStatus =
          challenge.status !== "COMPLETED" &&
          challenge.status !== "CANCELLED" &&
          new Date(challenge.expiresAt) <= new Date()
            ? "EXPIRED"
            : challenge.status;

        acc[effectiveStatus] = (acc[effectiveStatus] || 0) + 1;
        return acc;
      },
      { OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, EXPIRED: 0 }
    );
    const quizCategoryMap = quizResults.reduce((acc, item) => {
      const key = String(item.category || "Unknown");
      const questionCount = Math.max(0, Number(item.questionCount || 0));
      const correctAnswers = Math.max(0, Number(item.correctAnswers || 0));

      if (!acc[key]) {
        acc[key] = {
          category: key,
          attempts: 0,
          correctAnswers: 0,
          questionCount: 0,
        };
      }

      acc[key].attempts += 1;
      acc[key].correctAnswers += correctAnswers;
      acc[key].questionCount += questionCount;
      return acc;
    }, {});
    const quizByCategoryBase = Object.values(quizCategoryMap)
      .map((item) => ({
        category: categoryNames[item.category] || item.category,
        attempts: item.attempts,
        averageAccuracy: item.questionCount
          ? Math.round((item.correctAnswers / item.questionCount) * 100)
          : 0,
      }));
    const quizActivityByCategory = [...quizByCategoryBase]
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 6);
    const categoryAccuracy = [...quizByCategoryBase]
      .sort((a, b) => b.averageAccuracy - a.averageAccuracy)
      .slice(0, 8);
    const totalQuizQuestions = quizResults.reduce(
      (sum, item) => sum + Math.max(0, Number(item.questionCount || 0)),
      0
    );
    const totalQuizCorrect = quizResults.reduce(
      (sum, item) => sum + Math.max(0, Number(item.correctAnswers || 0)),
      0
    );
    const averageQuizAccuracy = totalQuizQuestions
      ? Math.round((totalQuizCorrect / totalQuizQuestions) * 100)
      : 0;
    const totalChallengeQuestions = challengeAttempts.reduce(
      (sum, item) =>
        sum +
        Math.max(0, Number(item.correctAnswers || 0)) +
        Math.max(0, Number(item.wrongAnswers || 0)),
      0
    );
    const totalChallengeCorrect = challengeAttempts.reduce(
      (sum, item) => sum + Math.max(0, Number(item.correctAnswers || 0)),
      0
    );
    const averageChallengeAccuracy = totalChallengeQuestions
      ? Math.round((totalChallengeCorrect / totalChallengeQuestions) * 100)
      : 0;
    const upcomingEventCards = events
      .filter((event) => getEffectiveEventStatus(event) === "UPCOMING")
      .sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0))
      .slice(0, 3)
      .map((event) => ({
        _id: event._id,
        eventName: event.eventName,
        categoryName: event.categoryName,
        startAt: event.startAt,
        eventDate: event.eventDate,
        startTime: event.startTime,
        registeredUsers: eventRegistrationCounts[event._id.toString()] || 0,
      }));
    const eventMap = events.reduce((acc, event) => {
      acc[event._id.toString()] = event;
      return acc;
    }, {});
    const challengeMap = challenges.reduce((acc, challenge) => {
      acc[challenge._id.toString()] = challenge;
      return acc;
    }, {});
    const recentActivity = [
      ...quizResults.map((item) => ({
        type: "QUIZ",
        label: `${item.name || "A user"} completed a quiz`,
        detail: categoryNames[item.category] || "Quiz",
        createdAt: item.createdAt,
      })),
      ...challengeAttempts.map((item) => ({
        type: "CHALLENGE",
        label: "Challenge completed",
        detail:
          challengeMap[item.challengeId]?.challengeCode ||
          challengeMap[item.challengeId]?.config?.categoryName ||
          "Challenge",
        createdAt: item.completedAt || item.createdAt,
      })),
      ...eventResults.map((item) => ({
        type: "EVENT",
        label: "Event completed",
        detail: eventMap[item.eventId]?.eventName || "Event",
        createdAt: item.createdAt,
      })),
      ...eventRegistrations.map((item) => ({
        type: "REGISTRATION",
        label: "User registered for an event",
        detail: eventMap[item.eventId]?.eventName || "Event registration",
        createdAt: item.createdAt,
      })),
    ]
      .filter((item) => item.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.status(200).json({
      totalUsers,
      activeUsers,
      upcomingEvents: counts.UPCOMING,
      draftEvents: counts.DRAFT,
      publishedEvents: counts.UPCOMING + counts.LIVE,
      completedEvents: counts.COMPLETED,
      quizAttempts: quizResults.length,
      averageQuizAccuracy,
      quizByCategory: quizActivityByCategory,
      quizActivityByCategory,
      categoryAccuracy,
      upcomingEventCards,
      recentActivity,
      totalChallenges: challenges.length,
      openChallenges: challengeCounts.OPEN,
      inProgressChallenges: challengeCounts.IN_PROGRESS,
      completedChallenges: challengeCounts.COMPLETED,
      expiredChallenges: challengeCounts.EXPIRED,
      challengeAttempts: challengeAttempts.length,
      averageChallengeAccuracy,
      charts: {
        events: [
          { label: "Draft", value: counts.DRAFT },
          { label: "Upcoming", value: counts.UPCOMING },
          { label: "Live", value: counts.LIVE },
          { label: "Completed", value: counts.COMPLETED },
        ],
        challenges: [
          { label: "Open", value: challengeCounts.OPEN },
          { label: "In Progress", value: challengeCounts.IN_PROGRESS },
          { label: "Completed", value: challengeCounts.COMPLETED },
          { label: "Expired", value: challengeCounts.EXPIRED },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    const eventIds = events.map((event) => event._id.toString());
    const participantCounts = await EventRegistration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
    ]);
    const registrations = await EventRegistration.find({
      eventId: { $in: eventIds },
    }).lean();
    const registeredUserIds = [
      ...new Set(registrations.map((item) => item.userId)),
    ];
    const users = await User.find({ _id: { $in: registeredUserIds } })
      .select("name email profilePicture")
      .lean();
    const participantMap = participantCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});
    const registeredUsersMap = registrations.reduce((acc, registration) => {
      const user = userMap[registration.userId];
      const eventId = registration.eventId;

      if (!acc[eventId]) {
        acc[eventId] = [];
      }

      acc[eventId].push({
        userId: registration.userId,
        name: user?.name || "Unknown User",
        email: user?.email || "",
        profilePicture: user?.profilePicture || "",
      });

      return acc;
    }, {});

    res.status(200).json(
      events.map((event) => ({
        ...withEffectiveEventStatus(event),
        participants: participantMap[event._id.toString()] || 0,
        registeredUsers: registeredUsersMap[event._id.toString()] || [],
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json(withEffectiveEventStatus(event));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createEvent = async (req, res) => {
  const errors = validateEventPayload(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const event = await new Event({
      ...normalizeEventPayload(req.body, req.user.userId),
      status: "DRAFT",
      questions: [],
    }).save();

    res.status(201).json(withEffectiveEventStatus(event));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateEvent = async (req, res) => {
  const errors = validateEventPayload(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const effectiveStatus = getEffectiveEventStatus(event);

    if (effectiveStatus === "LIVE" || effectiveStatus === "COMPLETED") {
      return res.status(400).json({
        error: "Live and completed events cannot be edited",
      });
    }

    Object.assign(event, normalizeEventPayload(req.body), {
      status: event.status,
    });

    await event.save();
    res.status(200).json(withEffectiveEventStatus(event));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    await Notification.deleteMany({ eventId: event._id.toString() });

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.status !== "DRAFT") {
      return res.status(400).json({ error: "Event is already published" });
    }

    if (buildEventEndAt(event) <= new Date()) {
      return res.status(400).json({
        error:
          "This event has already ended. Please choose a future start time before publishing.",
      });
    }

    const payload = await fetchOpenTdbQuestions(event.apiUrl);
    const questions = payload.results || [];

    if (questions.length !== event.questionCount) {
      return res.status(400).json({
        error: `Expected ${event.questionCount} questions, received ${questions.length}`,
      });
    }

    event.questions = normalizeQuestions(questions);
    event.status = "UPCOMING";
    await event.save();

    await Notification.deleteMany({ eventId: event._id.toString() });

    if (event.notifyUsers) {
      const users = await User.find({
        $or: [{ role: "USER" }, { role: { $exists: false } }],
      }).select("_id");
      const notifications = users.map((user) => ({
          userId: user._id.toString(),
          eventId: event._id.toString(),
          title: "New quiz event published",
          message: `${event.eventName} is now open for registration.`,
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(200).json(withEffectiveEventStatus(event));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const {
      search = "",
      status = "All",
      role = "",
      sort = "newest",
      page = 1,
      limit = 10,
    } = req.query;
    const query = {};

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status === "Active") {
      query.isActive = { $ne: false };
      query.isDeleted = { $ne: true };
    } else if (status === "Inactive") {
      query.isActive = false;
      query.isDeleted = { $ne: true };
    } else if (status === "Deleted") {
      query.isDeleted = true;
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 10));
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -resetPasswordToken")
        .sort({ createdAt: sort === "oldest" ? 1 : -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      users: users.map(sanitizeUser),
      total,
      page: pageNumber,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAdminUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -resetPasswordToken")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = user._id.toString();
    const [results, eventsJoined, challengesPlayed] = await Promise.all([
      Result.find({ userId }).select("score accuracy").lean(),
      EventRegistration.countDocuments({ userId }),
      ChallengeAttempt.countDocuments({ userId }),
    ]);
    const gamesPlayed = results.length;
    const highestScore = gamesPlayed
      ? Math.max(...results.map((item) => item.score || 0))
      : 0;
    const averageAccuracy = gamesPlayed
      ? Math.round(
          results.reduce((sum, item) => sum + Number(item.accuracy || 0), 0) /
            gamesPlayed
        )
      : 0;

    res.status(200).json({
      user: sanitizeUser(user),
      stats: {
        gamesPlayed,
        averageAccuracy,
        highestScore,
        eventsJoined,
        challengesPlayed,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserStatus = async (req, res, action) => {
  try {
    const user = await User.findById(req.params.id);
    const validationError = ensureCanManageUser(user, req.user.userId);

    if (validationError) {
      return res
        .status(validationError === "User not found" ? 404 : 400)
        .json({ error: validationError });
    }

    if (action === "activate") {
      user.isActive = true;
      user.deactivatedAt = null;
    } else if (action === "deactivate") {
      user.isActive = false;
      user.deactivatedAt = new Date();
      user.sessionId = null;
    } else if (action === "delete") {
      user.isDeleted = true;
      user.isActive = false;
      user.deletedAt = new Date();
      user.sessionId = null;
    } else if (action === "restore") {
      user.isDeleted = false;
      user.isActive = true;
      user.deletedAt = null;
      user.deactivatedAt = null;
    }

    await user.save();
    res.status(200).json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const activateUser = (req, res) => updateUserStatus(req, res, "activate");
const deactivateUser = (req, res) => updateUserStatus(req, res, "deactivate");
const softDeleteUser = (req, res) => updateUserStatus(req, res, "delete");
const restoreUser = (req, res) => updateUserStatus(req, res, "restore");

const bulkUpdateUsers = async (req, res, action) => {
  try {
    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];
    const uniqueUserIds = [...new Set(userIds.map((item) => String(item)))];

    if (uniqueUserIds.length === 0) {
      return res.status(400).json({ error: "Select at least one user" });
    }

    if (uniqueUserIds.includes(req.user.userId)) {
      return res
        .status(400)
        .json({ error: "You cannot manage your own active admin account" });
    }

    const update =
      action === "activate"
        ? { isActive: true, deactivatedAt: null }
        : { isActive: false, deactivatedAt: new Date(), sessionId: null };

    await User.updateMany(
      { _id: { $in: uniqueUserIds }, isDeleted: { $ne: true } },
      update
    );
    res.status(200).json({ message: "Users updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const bulkActivateUsers = (req, res) => bulkUpdateUsers(req, res, "activate");
const bulkDeactivateUsers = (req, res) =>
  bulkUpdateUsers(req, res, "deactivate");

const resolveNotificationRecipients = async (payload) => {
  if (payload.targetType === "ALL_ACTIVE_USERS") {
    const users = await User.find({
      isActive: { $ne: false },
      isDeleted: { $ne: true },
      $or: [{ role: "USER" }, { role: { $exists: false } }],
    }).select("_id");

    return users.map((user) => user._id.toString());
  }

  if (payload.targetType === "SPECIFIC_USERS") {
    const requestedIds = Array.isArray(payload.userIds) ? payload.userIds : [];
    const users = await User.find({
      _id: { $in: requestedIds },
      isActive: { $ne: false },
      isDeleted: { $ne: true },
    }).select("_id");

    return users.map((user) => user._id.toString());
  }

  if (payload.targetType === "EVENT_REGISTERED_USERS") {
    const registrations = await EventRegistration.find({
      eventId: payload.eventId,
    }).select("userId");
    const registeredIds = registrations.map((item) => item.userId);
    const users = await User.find({
      _id: { $in: registeredIds },
      isActive: { $ne: false },
      isDeleted: { $ne: true },
    }).select("_id");

    return users.map((user) => user._id.toString());
  }

  return [];
};

const createAdminNotification = async (req, res) => {
  try {
    const recipients = await resolveNotificationRecipients(req.body);
    const notification = await createNotificationDeliveries({
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || "GENERAL",
      targetType: req.body.targetType,
      createdBy: req.user.userId,
      userIds: recipients,
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const listAdminNotifications = async (req, res) => {
  try {
    const notifications = await AdminNotification.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const unpublishEvent = async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();

    if (!reason) {
      return res.status(400).json({ error: "Unpublish reason is required" });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const effectiveStatus = getEffectiveEventStatus(event);

    if (event.status === "DRAFT") {
      return res.status(400).json({ error: "Event is already a draft" });
    }

    if (effectiveStatus === "LIVE" || effectiveStatus === "COMPLETED") {
      return res.status(400).json({
        error: "Live and completed events cannot be unpublished",
      });
    }

    const registrations = await EventRegistration.find({
      eventId: event._id.toString(),
    }).select("userId");

    event.status = "DRAFT";
    event.questions = [];
    await event.save();

    await Notification.deleteMany({ eventId: event._id.toString() });

    const notifications = registrations.map((registration) => ({
      userId: registration.userId,
      eventId: event._id.toString(),
      title: "Quiz event unpublished",
      message: `${event.eventName} is no longer open for registration. Reason: ${reason}`,
    }));

    await Promise.all([
      notifications.length ? Notification.insertMany(notifications) : null,
      EventRegistration.deleteMany({ eventId: event._id.toString() }),
    ]);

    res.status(200).json(withEffectiveEventStatus(event));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  dashboard,
  listUsers,
  getAdminUser,
  activateUser,
  deactivateUser,
  softDeleteUser,
  restoreUser,
  bulkActivateUsers,
  bulkDeactivateUsers,
  createAdminNotification,
  listAdminNotifications,
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
};
