const jwt = require("jsonwebtoken");
const User = require("../Modals/User");

const SECRET = process.env.JWT_SECRET;

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Session expired. Please login again.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.sessionId !== decoded.sessionId) {
      return res.status(401).json({
        error: "Unauthorized",
        message:
          "Your account has been logged in from another device. Please login again.",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Session expired. Please login again.",
    });
  }
};

module.exports = verifyToken;
