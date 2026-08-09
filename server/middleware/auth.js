const jwt = require("jsonwebtoken");
const User = require("../Modals/User");
const { getPasswordExpiryInfo } = require("../utils/passwordExpiry");

const SECRET = process.env.JWT_SECRET;

const verifyTokenWithOptions = async (req, res, next, options = {}) => {
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

    if (user.isDeleted || user.isActive === false) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Your account is inactive. Please contact an administrator.",
      });
    }

    const passwordExpiry = getPasswordExpiryInfo(user);

    if (passwordExpiry.expired && !options.allowExpiredPassword) {
      return res.status(403).json({
        code: "PASSWORD_EXPIRED",
        message: "Your password has expired.",
        passwordExpiry,
      });
    }

    req.user = decoded;
    req.user.role = user.role || "USER";
    req.user.passwordExpiry = passwordExpiry;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Session expired. Please login again.",
    });
  }
};

const verifyToken = (req, res, next) => verifyTokenWithOptions(req, res, next);

const verifyTokenAllowExpiredPassword = (req, res, next) =>
  verifyTokenWithOptions(req, res, next, { allowExpiredPassword: true });

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

module.exports = verifyToken;
module.exports.requireAdmin = requireAdmin;
module.exports.allowExpiredPassword = verifyTokenAllowExpiredPassword;
