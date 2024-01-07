const express = require("express");
const { register, login } = require("../controllers/Auth");

const AuthRouter = express.Router();

AuthRouter.post("/register", register);
AuthRouter.post("/login", login);

module.exports = AuthRouter;
