const bcrypt = require("bcrypt");
const crypto = require("crypto");
const https = require("https");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const User = require("../Modals/User");
const {
  hasEmailConfig,
  verifyTransporter,
} = require("../utils/email");
const { sendTemplateEmail } = require("../services/emailTemplateService");
const { validateName } = require("../utils/nameValidation");
const { getPasswordExpiryInfo } = require("../utils/passwordExpiry");
const { validatePasswordStrength } = require("../utils/passwordValidation");
const { createWelcomeNotification } = require("../services/welcomeNotificationService");

dotenv.config();

const SECRET = process.env.JWT_SECRET;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const PASSWORD_RESET_SUCCESS_MESSAGE =
  "If an account exists for this email, a password reset link has been sent.";

const validatePasswordResetPayload = (password, confirmPassword) => {
  if (!password || !confirmPassword) {
    return "New Password and Confirm Password are mandatory";
  }

  if (password !== confirmPassword) {
    return "Passwords should match";
  }

  const passwordStrengthError = validatePasswordStrength(password);

  if (passwordStrengthError) {
    return passwordStrengthError;
  }

  return "";
};

const sanitizeUser = (user) => {
  const safeUser = typeof user.toObject === "function" ? user.toObject() : { ...user };
  safeUser.role = safeUser.role || "USER";
  delete safeUser.password;
  delete safeUser.resetPasswordToken;
  delete safeUser.resetPasswordExpires;
  return safeUser;
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const register = async (req, res) => {
  const { password, email, role, ...fields } = req.body;
  const lowercaseEmail = normalizeEmail(email);
  try {
    const nameError = validateName(fields.name);

    if (nameError) {
      return res.status(400).json({ error: nameError });
    }

    const passwordStrengthError = validatePasswordStrength(password || "");

    if (passwordStrengthError) {
      return res.status(400).json({ error: passwordStrengthError });
    }

    const existingUser = await User.findOne({ email: lowercaseEmail }).select("_id");

    if (existingUser) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);
    const sessionId = crypto.randomUUID();
    const user = await new User({
      ...fields,
      email: lowercaseEmail,
      password: hashPassword,
      role: "USER",
      sessionId,
      passwordChangedAt: new Date(),
    }).save();
    await createWelcomeNotification(user);
    const safeUser = sanitizeUser(user);
    const passwordExpiry = getPasswordExpiryInfo(user);
    const token = jwt.sign(
      {
        email: safeUser.email,
        userId: safeUser._id,
        username: safeUser.name,
        role: safeUser.role || "USER",
        sessionId,
      },
      SECRET,
      {
        expiresIn: 60 * 60,
      }
    );
    res.status(201).json({ token, user: safeUser, passwordExpiry });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    res.status(500).json({ error: error.message });
  }
};

const checkEmail = async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email);

    if (!email) {
      return res.status(200).json({ available: true });
    }

    const existingUser = await User.findOne({ email }).select("_id");
    res.status(200).json({ available: !existingUser });
  } catch (error) {
    res.status(500).json({ error: "Unable to check email availability" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, forceLogin = false } = req.body;
    const lowercaseEmail = normalizeEmail(email);
    let user = await User.findOne({ email: lowercaseEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.isDeleted || user.isActive === false) {
      return res.status(403).json({
        error: "Your account is inactive. Please contact an administrator.",
      });
    }
    const hashPassword = user.password;
    const passwordMatched = bcrypt.compareSync(password, hashPassword);
    if (!passwordMatched) {
      return res.status(401).json({ error: "Invalid user credentials" });
    }

    if (user.sessionId && !forceLogin) {
      return res.status(409).json({
        error:
          "You are already logged in on another device. Do you want to logout the previous session and continue?",
        alreadyLoggedIn: true,
      });
    }

    const sessionId = crypto.randomUUID();
    user.sessionId = sessionId;
    await user.save();

    const passwordExpiry = getPasswordExpiryInfo(user);
    user = sanitizeUser(user);

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id,
        username: user.name,
        role: user.role || "USER",
        sessionId,
      },
      SECRET,
      {
        expiresIn: 60 * 60,
      }
    );
    res.status(200).json({ token, user, sessionId, passwordExpiry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (email) {
      if (hasEmailConfig()) {
        await verifyTransporter();
      }

      const user = await User.findOne({ email });

      if (user) {
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const resetUrl = `${clientUrl.replace(/\/$/, "")}/reset-password/${resetToken}`;

        await sendTemplateEmail({
          templateKey: "FORGOT_PASSWORD",
          to: user.email,
          variables: {
            userName: user.name || "Quiz Playground user",
            resetLink: resetUrl,
            expiryMinutes: 15,
          },
        });
      }
    }

    res.status(200).json({ message: PASSWORD_RESET_SUCCESS_MESSAGE });
  } catch (error) {
    console.error("[password-reset] Unable to send reset email:", error);

    const email = normalizeEmail(req.body.email);

    if (email) {
      try {
        await User.findOneAndUpdate(
          { email },
          {
            $set: {
              resetPasswordToken: null,
              resetPasswordExpires: null,
            },
          }
        );
      } catch (cleanupError) {
        console.error(
          "[password-reset] Unable to clear reset token after email failure:",
          cleanupError
        );
      }
    }

    res.status(500).json({
      error: "Unable to send password reset email. Please try again later.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const validationError = validatePasswordResetPayload(password, confirmPassword);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(req.params.token || "")
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Password reset link is invalid or has expired" });
    }

    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(password, salt);
    user.passwordChangedAt = new Date();
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.sessionId = null;
    await user.save();

    res.status(200).json({
      message: "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to reset password" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, password, confirmPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: "Current Password is mandatory" });
    }

    const validationError = validatePasswordResetPayload(password, confirmPassword);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatched = bcrypt.compareSync(currentPassword, user.password);
    if (!passwordMatched) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(password, salt);
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({
      message: "Password changed successfully.",
      passwordExpiry: getPasswordExpiryInfo(user),
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to change password" });
  }
};

const deleteProfilePicture = async (req, res) => {
  const { publicId } = req.body;

  if (!publicId) {
    return res.status(400).json({ error: "Public id is required" });
  }

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return res
      .status(500)
      .json({ error: "Cloudinary delete configuration is missing" });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureString = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto
    .createHash("sha1")
    .update(signatureString)
    .digest("hex");

  const formBody = new URLSearchParams({
    public_id: publicId,
    api_key: CLOUDINARY_API_KEY,
    timestamp,
    signature,
  }).toString();

  const request = https.request(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(formBody),
      },
    },
    (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        try {
          const payload = JSON.parse(data);
          if (payload.result === "ok") {
            return res
              .status(200)
              .json({ message: "Profile picture removed successfully" });
          }

          return res.status(400).json({
            error: payload.error || "Unable to remove profile picture",
          });
        } catch (error) {
          return res.status(500).json({ error: error.message });
        }
      });
    }
  );

  request.on("error", (error) => {
    res.status(500).json({ error: error.message });
  });

  request.write(formBody);
  request.end();
};

const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { sessionId: null });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  deleteProfilePicture,
  forgotPassword,
  resetPassword,
  checkEmail,
  changePassword,
};
