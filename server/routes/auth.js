const express = require("express");
const {
  register,
  login,
  logout,
  deleteProfilePicture,
  forgotPassword,
  resetPassword,
  checkEmail,
  changePassword,
} = require("../controllers/Auth");
const verifyToken = require("../middleware/auth");

const AuthRouter = express.Router();

AuthRouter.post("/register", register);
AuthRouter.post("/login", login);
AuthRouter.get("/check-email", checkEmail);
AuthRouter.post("/forgot-password", forgotPassword);
AuthRouter.post("/reset-password/:token", resetPassword);
AuthRouter.post("/change-password", verifyToken.allowExpiredPassword, changePassword);
AuthRouter.post("/logout", verifyToken, logout);
AuthRouter.post("/delete-profile-picture", deleteProfilePicture);

module.exports = AuthRouter;
