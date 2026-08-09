const express = require("express");
const {
  createChallenge,
  getChallenge,
  acceptChallenge,
  deleteChallenge,
  getChallengeQuestions,
  submitChallenge,
  getChallengeResults,
} = require("../controllers/Challenge");
const verifyToken = require("../middleware/auth");

const ChallengeRouter = express.Router();

ChallengeRouter.post("/", verifyToken, createChallenge);
ChallengeRouter.get("/:code", verifyToken, getChallenge);
ChallengeRouter.delete("/:code", verifyToken, deleteChallenge);
ChallengeRouter.post("/:code/accept", verifyToken, acceptChallenge);
ChallengeRouter.get("/:code/questions", verifyToken, getChallengeQuestions);
ChallengeRouter.post("/:code/submit", verifyToken, submitChallenge);
ChallengeRouter.get("/:code/results", verifyToken, getChallengeResults);

module.exports = ChallengeRouter;
