const crypto = require("crypto");
const https = require("https");
const Challenge = require("../Modals/Challenge");
const ChallengeAttempt = require("../Modals/ChallengeAttempt");
const User = require("../Modals/User");
const { updateGlobalPerformance } = require("../services/globalLeaderboardService");

const POINTS_PER_QUESTION = 10;
const DEFAULT_EXPIRY_HOURS = 48;

const buildClientUrl = (path) => {
  const baseUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "");
  return baseUrl ? `${baseUrl}${path}` : path;
};

const shuffleArray = (items) => {
  const cloned = [...items];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const randomIndex = crypto.randomInt(index + 1);
    [cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]];
  }

  return cloned;
};

const buildApiUrl = ({ categoryId, difficulty, questionCount, questionType = "multiple" }) => {
  const params = new URLSearchParams({
    amount: String(questionCount),
    category: String(categoryId),
    difficulty,
    type: questionType,
  });

  return `https://opentdb.com/api.php?${params.toString()}`;
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

const generateChallengeCode = async () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = Array.from({ length: 6 }, () =>
      alphabet[crypto.randomInt(alphabet.length)]
    ).join("");
    const exists = await Challenge.exists({ challengeCode: code });

    if (!exists) {
      return code;
    }
  }

  throw new Error("Unable to generate challenge code");
};

const getEffectiveStatus = (challenge) => {
  if (!challenge) {
    return "";
  }

  if (
    challenge.status !== "COMPLETED" &&
    challenge.status !== "CANCELLED" &&
    new Date(challenge.expiresAt) <= new Date()
  ) {
    return "EXPIRED";
  }

  return challenge.status;
};

const getActiveParticipantIds = (challenge) => {
  if (!challenge) {
    return [];
  }

  const creatorId = String(challenge.createdBy || "");
  const uniqueParticipantIds = [];

  [creatorId, ...(challenge.participants || [])].forEach((participantId) => {
    const normalizedId = String(participantId || "");

    if (normalizedId && !uniqueParticipantIds.includes(normalizedId)) {
      uniqueParticipantIds.push(normalizedId);
    }
  });

  const opponentId = uniqueParticipantIds.find((item) => item !== creatorId);

  return opponentId ? [creatorId, opponentId] : [creatorId].filter(Boolean);
};

const normalizeQuestions = (questions) =>
  questions.map((item, index) => ({
    questionOrder: index + 1,
    question: item.question,
    options: shuffleArray([item.correct_answer, ...(item.incorrect_answers || [])]),
    correctAnswer: item.correct_answer,
    difficulty: item.difficulty,
    category: item.category,
  }));

const sanitizeChallenge = async (challenge, currentUserId) => {
  const creator = await User.findById(challenge.createdBy)
    .select("name email")
    .lean();
  const attempts = await ChallengeAttempt.find({
    challengeId: challenge._id.toString(),
  }).lean();
  const participantIds = getActiveParticipantIds(challenge);
  const participantUsers = await User.find({ _id: { $in: participantIds } })
    .select("name email")
    .lean();
  const completedUserIds = new Set(attempts.map((item) => item.userId));
  const normalizedCurrentUserId = String(currentUserId || "");

  return {
    _id: challenge._id,
    challengeCode: challenge.challengeCode,
    createdBy: challenge.createdBy,
    creator: {
      name: creator?.name || "A Quiz Playground user",
      email: creator?.email || "",
    },
    config: challenge.config,
    status: getEffectiveStatus(challenge),
    expiresAt: challenge.expiresAt,
    shareUrl: buildClientUrl(`/challenge/${challenge.challengeCode}`),
    participants: participantUsers.map((user) => ({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      hasCompleted: completedUserIds.has(user._id.toString()),
    })),
    participantCount: participantIds.length,
    hasJoined: participantIds.includes(normalizedCurrentUserId),
    hasCompleted:
      participantIds.includes(normalizedCurrentUserId) &&
      completedUserIds.has(normalizedCurrentUserId),
  };
};

const assertPlayable = async (challenge, userId) => {
  if (!challenge) {
    return "Challenge not found";
  }

  const effectiveStatus = getEffectiveStatus(challenge);

  if (effectiveStatus === "EXPIRED") {
    return "This challenge has expired";
  }

  if (effectiveStatus === "CANCELLED" || effectiveStatus === "COMPLETED") {
    return "This challenge is closed";
  }

  const activeParticipantIds = getActiveParticipantIds(challenge);

  if (!activeParticipantIds.includes(String(userId || ""))) {
    return "Please accept the challenge before playing";
  }

  const existingAttempt = await ChallengeAttempt.exists({
    challengeId: challenge._id.toString(),
    userId,
  });

  if (existingAttempt) {
    return "You have already completed this challenge";
  }

  return "";
};

const createChallenge = async (req, res) => {
  try {
    const {
      categoryId,
      categoryName,
      difficulty,
      questionType = "multiple",
      questionCount,
      duration,
      timedQuiz = true,
      showAnswerFeedback = true,
      timerMode = "TOTAL",
      totalDuration,
      timePerQuestion,
    } = req.body;
    const normalizedQuestionCount = Number(questionCount);
    const normalizedDuration = Number(duration);
    const normalizedTimerMode = String(timerMode || "TOTAL").toUpperCase();
    const normalizedTimedQuiz = Boolean(timedQuiz);
    const normalizedShowAnswerFeedback = showAnswerFeedback !== false;
    const normalizedTotalDuration =
      totalDuration === null || totalDuration === undefined
        ? null
        : Number(totalDuration);
    const normalizedTimePerQuestion =
      timePerQuestion === null || timePerQuestion === undefined
        ? null
        : Number(timePerQuestion);

    if (!categoryId || !categoryName || !difficulty) {
      return res.status(400).json({ error: "Category and difficulty are required" });
    }

    if (![10, 15, 20, 25].includes(normalizedQuestionCount)) {
      return res.status(400).json({ error: "Invalid number of questions" });
    }

    if (!["multiple", "boolean"].includes(questionType)) {
      return res.status(400).json({ error: "Invalid question type" });
    }

    if (!Number.isFinite(normalizedDuration) || normalizedDuration < 1) {
      return res.status(400).json({ error: "Duration must be greater than 0" });
    }

    if (!["TOTAL", "PER_QUESTION"].includes(normalizedTimerMode)) {
      return res.status(400).json({ error: "Invalid timer mode" });
    }

    if (
      normalizedTimedQuiz &&
      normalizedTimerMode === "TOTAL" &&
      (!Number.isFinite(normalizedTotalDuration) || normalizedTotalDuration < 60)
    ) {
      return res.status(400).json({ error: "Total quiz time is required" });
    }

    if (
      normalizedTimedQuiz &&
      normalizedTimerMode === "PER_QUESTION" &&
      (!Number.isFinite(normalizedTimePerQuestion) || normalizedTimePerQuestion < 5)
    ) {
      return res.status(400).json({ error: "Time per question is required" });
    }

    const payload = await fetchOpenTdbQuestions(
      buildApiUrl({
        categoryId,
        difficulty,
        questionCount: normalizedQuestionCount,
        questionType,
      })
    );
    const questions = Array.isArray(payload.results) ? payload.results : [];

    if (questions.length !== normalizedQuestionCount) {
      return res.status(400).json({
        error: `Expected ${normalizedQuestionCount} questions, received ${questions.length}`,
      });
    }

    const challengeCode = await generateChallengeCode();
    const challenge = await new Challenge({
      challengeCode,
      createdBy: req.user.userId,
      participants: [req.user.userId],
      config: {
        categoryId: Number(categoryId),
        categoryName,
        difficulty,
        questionType,
        questionCount: normalizedQuestionCount,
        duration: normalizedDuration,
        timedQuiz: normalizedTimedQuiz,
        showAnswerFeedback: normalizedShowAnswerFeedback,
        timerMode: normalizedTimedQuiz ? normalizedTimerMode : "TOTAL",
        totalDuration:
          normalizedTimedQuiz && normalizedTimerMode === "TOTAL"
            ? normalizedTotalDuration
            : null,
        timePerQuestion:
          normalizedTimedQuiz && normalizedTimerMode === "PER_QUESTION"
            ? normalizedTimePerQuestion
            : null,
      },
      questions: normalizeQuestions(questions),
      status: "OPEN",
      expiresAt: new Date(Date.now() + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000),
    }).save();

    res.status(201).json(await sanitizeChallenge(challenge, req.user.userId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      challengeCode: String(req.params.code || "").toUpperCase(),
    });

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    res.status(200).json(await sanitizeChallenge(challenge, req.user.userId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const acceptChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      challengeCode: String(req.params.code || "").toUpperCase(),
    });

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    const effectiveStatus = getEffectiveStatus(challenge);

    if (effectiveStatus === "EXPIRED") {
      return res.status(400).json({ error: "This challenge has expired" });
    }

    if (effectiveStatus === "CANCELLED" || effectiveStatus === "COMPLETED") {
      return res.status(400).json({ error: "This challenge is closed" });
    }

    if (challenge.createdBy === req.user.userId) {
      return res.status(400).json({ error: "You cannot join your own challenge" });
    }

    const activeParticipantIds = getActiveParticipantIds(challenge);

    if (activeParticipantIds.includes(req.user.userId)) {
      return res.status(200).json(await sanitizeChallenge(challenge, req.user.userId));
    }

    if (activeParticipantIds.length >= 2) {
      return res.status(400).json({ error: "This challenge already has an opponent" });
    }

    const updatedChallenge = await Challenge.findOneAndUpdate(
      {
        _id: challenge._id,
        participants: { $ne: req.user.userId },
        "participants.1": { $exists: false },
      },
      {
        $addToSet: { participants: req.user.userId },
        $set: { status: "IN_PROGRESS" },
      },
      { new: true }
    );

    if (!updatedChallenge) {
      return res.status(400).json({ error: "This challenge already has an opponent" });
    }

    res.status(200).json(await sanitizeChallenge(updatedChallenge, req.user.userId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      challengeCode: String(req.params.code || "").toUpperCase(),
    });

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    if (challenge.createdBy !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Only the challenge creator can delete this challenge" });
    }

    const attemptExists = await ChallengeAttempt.exists({
      challengeId: challenge._id.toString(),
    });

    if (attemptExists) {
      return res.status(400).json({
        error: "This challenge already has results and cannot be deleted",
      });
    }

    await Challenge.deleteOne({ _id: challenge._id });
    res.status(200).json({ message: "Challenge deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getChallengeQuestions = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      challengeCode: String(req.params.code || "").toUpperCase(),
    });

    const error = await assertPlayable(challenge, req.user.userId);

    if (error) {
      return res.status(error === "Challenge not found" ? 404 : 400).json({ error });
    }

    res.status(200).json({
      challengeCode: challenge.challengeCode,
      config: challenge.config,
      questions: challenge.questions
        .sort((a, b) => a.questionOrder - b.questionOrder)
        .map((item) => ({
          questionOrder: item.questionOrder,
          question: item.question,
          answers: item.options,
          correctAnswer:
            challenge.config?.showAnswerFeedback === false
              ? undefined
              : item.correctAnswer,
          category: item.category,
          difficulty: item.difficulty,
        })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      challengeCode: String(req.params.code || "").toUpperCase(),
    });

    const error = await assertPlayable(challenge, req.user.userId);

    if (error) {
      return res.status(error === "Challenge not found" ? 404 : 400).json({ error });
    }

    const submittedAnswers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const submittedMap = submittedAnswers.reduce((acc, item) => {
      acc[item.questionOrder] = item.selectedAnswer || "";
      return acc;
    }, {});
    const answers = challenge.questions
      .sort((a, b) => a.questionOrder - b.questionOrder)
      .map((question) => {
        const selectedAnswer = submittedMap[question.questionOrder] || "";
        const isCorrect = selectedAnswer === question.correctAnswer;

        return {
          question: question.question,
          options: question.options,
          selectedAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          category: question.category,
          difficulty: question.difficulty,
          pointsEarned: isCorrect ? POINTS_PER_QUESTION : 0,
        };
      });
    const correctAnswers = answers.filter((item) => item.isCorrect).length;
    const questionCount = challenge.questions.length;
    const maxScore = questionCount * POINTS_PER_QUESTION;
    const score = correctAnswers * POINTS_PER_QUESTION;
    const wrongAnswers = questionCount - correctAnswers;
    const accuracy = questionCount ? (correctAnswers / questionCount) * 100 : 0;
    const attempt = await new ChallengeAttempt({
      challengeId: challenge._id.toString(),
      userId: req.user.userId,
      score,
      maxScore,
      correctAnswers,
      wrongAnswers,
      accuracy,
      timeTaken: Math.max(0, Number(req.body.timeTaken || 0)),
      answers,
      completedAt: new Date(),
    }).save();

    await updateGlobalPerformance({
      userId: req.user.userId,
      attemptId: attempt._id.toString(),
      attemptType: "CHALLENGE",
      correctAnswers,
      questionCount,
      difficulty: challenge.config?.difficulty,
      completedAt: attempt.completedAt,
    });

    const activeParticipantIds = getActiveParticipantIds(challenge);
    const attemptCount = await ChallengeAttempt.countDocuments({
      challengeId: challenge._id.toString(),
      userId: { $in: activeParticipantIds },
    });

    if (activeParticipantIds.length >= 2 && attemptCount >= 2) {
      challenge.status = "COMPLETED";
      await challenge.save();
    }

    res.status(201).json({
      attempt: {
        _id: attempt._id,
        challengeId: attempt.challengeId,
        userId: attempt.userId,
        score: attempt.score,
        maxScore: attempt.maxScore,
        correctAnswers: attempt.correctAnswers,
        wrongAnswers: attempt.wrongAnswers,
        accuracy: attempt.accuracy,
        timeTaken: attempt.timeTaken,
        completedAt: attempt.completedAt,
      },
      redirectTo: `/challenge/${challenge.challengeCode}/results`,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "You have already completed this challenge" });
    }

    res.status(500).json({ error: error.message });
  }
};

const getWinner = (attempts) => {
  if (attempts.length < 2) {
    return null;
  }

  const [first, second] = attempts;
  const comparisons = [
    second.score - first.score,
    second.accuracy - first.accuracy,
    first.timeTaken - second.timeTaken,
  ];

  if (comparisons.every((value) => value === 0)) {
    return { type: "DRAW", userId: null };
  }

  if (
    first.score > second.score ||
    (first.score === second.score && first.accuracy > second.accuracy) ||
    (first.score === second.score &&
      first.accuracy === second.accuracy &&
      first.timeTaken < second.timeTaken)
  ) {
    return { type: "WINNER", userId: first.userId };
  }

  return { type: "WINNER", userId: second.userId };
};

const getChallengeResults = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      challengeCode: String(req.params.code || "").toUpperCase(),
    }).lean();

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    const activeParticipantIds = getActiveParticipantIds(challenge);

    if (!activeParticipantIds.includes(req.user.userId)) {
      return res.status(403).json({ error: "You are not part of this challenge" });
    }

    const attempts = await ChallengeAttempt.find({
      challengeId: challenge._id.toString(),
      userId: { $in: activeParticipantIds },
    })
      .sort({ completedAt: 1 })
      .lean();
    const userIds = [
      ...new Set([...activeParticipantIds, ...attempts.map((item) => item.userId)]),
    ];
    const users = await User.find({ _id: { $in: userIds } })
      .select("name email")
      .lean();
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});
    const bothCompleted = activeParticipantIds.length >= 2 && attempts.length >= 2;
    const effectiveStatus = getEffectiveStatus(challenge);
    const canShowAnalysis = bothCompleted || ["COMPLETED", "CANCELLED", "EXPIRED"].includes(effectiveStatus);
    const winner = getWinner(attempts);

    const sanitizedAttempts = attempts.map((attempt) => ({
      ...attempt,
      answers: canShowAnalysis ? attempt.answers : [],
      user: {
        name: userMap[attempt.userId]?.name || "Player",
        email: userMap[attempt.userId]?.email || "",
      },
    }));
    const currentUserAttempt =
      sanitizedAttempts.find((item) => item.userId === req.user.userId) || null;

    res.status(200).json({
      challenge: {
        challengeCode: challenge.challengeCode,
        config: challenge.config,
        status: effectiveStatus,
        expiresAt: challenge.expiresAt,
      },
      bothCompleted,
      canShowAnalysis,
      currentUserAttempt,
      attempts: sanitizedAttempts,
      participants: activeParticipantIds.map((userId) => ({
        userId,
        name: userMap[userId]?.name || "Player",
        email: userMap[userId]?.email || "",
        hasCompleted: attempts.some((attempt) => attempt.userId === userId),
      })),
      winner,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createChallenge,
  getChallenge,
  acceptChallenge,
  deleteChallenge,
  getChallengeQuestions,
  submitChallenge,
  getChallengeResults,
};
