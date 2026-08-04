const express = require("express");
const {
  getQuestions,
  result,
  leaderboard,
  allresult,
  searchResult,
} = require("../controllers/Result");
const verifyToken = require("../middleware/auth");

const ResultRouter = express.Router();

ResultRouter.get("/questions", verifyToken, getQuestions);
ResultRouter.post("/score", verifyToken, result);
ResultRouter.post("/search", searchResult);
ResultRouter.get("/leaderboard", leaderboard);
ResultRouter.get("/all", allresult);

module.exports = ResultRouter;
