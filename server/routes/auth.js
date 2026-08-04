const express = require("express");
const {
  register,
  login,
  logout,
  deleteProfilePicture,
} = require("../controllers/Auth");
const verifyToken = require("../middleware/auth");

const AuthRouter = express.Router();

AuthRouter.post("/register", register);
AuthRouter.post("/login", login);
AuthRouter.post("/logout", verifyToken, logout);
AuthRouter.post("/delete-profile-picture", deleteProfilePicture);

module.exports = AuthRouter;
