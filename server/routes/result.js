const express = require("express");
const {
  getQuestions,
  result,
  quizAnalysis,
  leaderboard,
  allresult,
  searchResult,
  profile,
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
} = require("../controllers/Result");
const verifyToken = require("../middleware/auth");
const {
  getUniqueExistingQuestions,
} = require("../services/questionExtractionService");

const ResultRouter = express.Router();

ResultRouter.get("/questions/unique-existing", async (req, res) => {
  try {
    const payload = await getUniqueExistingQuestions();
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ResultRouter.get("/questions", verifyToken, getQuestions);
ResultRouter.post("/score", verifyToken, result);
ResultRouter.get("/score/:attemptId/analysis", verifyToken, quizAnalysis);
ResultRouter.post("/search", searchResult);
ResultRouter.get("/leaderboard", leaderboard);
ResultRouter.get("/all", allresult);
ResultRouter.get("/profile", verifyToken, profile);
ResultRouter.get("/notifications", verifyToken, notifications);
ResultRouter.get("/notifications/unread-count", verifyToken, unreadNotificationCount);
ResultRouter.patch("/notifications/read-all", verifyToken, markAllNotificationsRead);
ResultRouter.patch("/notifications/:id/read", verifyToken, markNotificationRead);
ResultRouter.patch("/notifications/mark-read", verifyToken, markNotificationsRead);
ResultRouter.get("/events/registered", verifyToken, registeredEvents);
ResultRouter.post("/events/:id/register", verifyToken, registerEvent);
ResultRouter.get("/events/:id/play", verifyToken, getEventForPlay);
ResultRouter.post("/events/:id/submit", verifyToken, submitEventResult);
ResultRouter.get("/events/:id/result", verifyToken, getEventResult);

module.exports = ResultRouter;
