const express = require("express");
const {
  createChallenge,
  getChallenge,
  acceptChallenge,
  deleteChallenge,
  getChallengeAttempt,
  getChallengeQuestions,
  saveChallengeAnswer,
  startChallengeAttempt,
  submitChallenge,
  updateChallengeAttemptTime,
  getChallengeResults,
} = require("../controllers/Challenge");
const verifyToken = require("../middleware/auth");

const ChallengeRouter = express.Router();

ChallengeRouter.post("/", verifyToken, createChallenge);
ChallengeRouter.get("/:code/attempt", verifyToken, getChallengeAttempt);
ChallengeRouter.post("/:code/attempt", verifyToken, startChallengeAttempt);
ChallengeRouter.post("/:code/attempts/:attemptId/answer", verifyToken, saveChallengeAnswer);
ChallengeRouter.post("/:code/attempts/:attemptId/time", verifyToken, updateChallengeAttemptTime);
ChallengeRouter.get("/:code/questions", verifyToken, getChallengeQuestions);
ChallengeRouter.post("/:code/submit", verifyToken, submitChallenge);
ChallengeRouter.get("/:code/results", verifyToken, getChallengeResults);
ChallengeRouter.get("/:code", verifyToken, getChallenge);
ChallengeRouter.delete("/:code", verifyToken, deleteChallenge);
ChallengeRouter.post("/:code/accept", verifyToken, acceptChallenge);

module.exports = ChallengeRouter;
