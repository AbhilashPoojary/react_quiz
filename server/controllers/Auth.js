const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const User = require("../Modals/User");

dotenv.config();

const SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
  console.log(SECRET);
  const { password, email, ...fields } = req.body;
  const lowercaseEmail = email.toLowerCase();
  try {
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);
    const user = await new User({
      ...fields,
      email: lowercaseEmail,
      password: hashPassword,
    }).save();
    delete user.password;
    const token = jwt.sign({ email: user.email, userId: user._id }, SECRET, {
      expiresIn: 60 * 60,
    });
    res.status(201).json({ token, user });
  } catch (error) {
    console.log(SECRET);
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  console.log(req.body);
  try {
    const { email, password } = req.body;
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
    user = user.toObject();
    delete user.password;

    const token = jwt.sign({ email: user.email, userId: user._id }, SECRET, {
      expiresIn: 60 * 60,
    });
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login };
