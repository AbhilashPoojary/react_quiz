const bcrypt = require("bcrypt");
const crypto = require("crypto");
const https = require("https");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const User = require("../Modals/User");

dotenv.config();

const SECRET = process.env.JWT_SECRET;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const register = async (req, res) => {
  console.log(SECRET);
  const { password, email, ...fields } = req.body;
  const lowercaseEmail = email.toLowerCase();
  try {
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);
    const sessionId = crypto.randomUUID();
    const user = await new User({
      ...fields,
      email: lowercaseEmail,
      password: hashPassword,
      sessionId,
    }).save();
    delete user.password;
    const token = jwt.sign(
      { email: user.email, userId: user._id, username: user.name, sessionId },
      SECRET,
      {
        expiresIn: 60 * 60,
      }
    );
    res.status(201).json({ token, user });
  } catch (error) {
    console.log(SECRET);
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  console.log(req.body);
  try {
    const { email, password, forceLogin = false } = req.body;
    const lowercaseEmail = email.toLowerCase();
    let user = await User.findOne({ email: lowercaseEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
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
    await User.findByIdAndUpdate(user._id, { sessionId });

    user = user.toObject();
    delete user.password;

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id,
        username: user.name,
        sessionId,
      },
      SECRET,
      {
        expiresIn: 60 * 60,
      }
    );
    res.status(200).json({ token, user, sessionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

module.exports = { register, login, logout, deleteProfilePicture };
