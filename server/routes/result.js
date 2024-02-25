const express = require("express");
const {
  result,
  leaderboard,
  allresult,
  searchResult,
} = require("../controllers/Result");

const ResultRouter = express.Router();

ResultRouter.post("/score", result);
ResultRouter.post("/search", searchResult);
ResultRouter.get("/leaderboard", leaderboard);
ResultRouter.get("/all", allresult);

module.exports = ResultRouter;
