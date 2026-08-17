const Notification = require("../Modals/Notification");

const buildWelcomeMessage = (name = "there") =>
  `Welcome to Quiz Playground, ${name}! Your learning streak starts with one small step: pick a quiz, trust your curiosity, and enjoy the climb.`;

const createWelcomeNotification = async (user) => {
  if (!user?._id) {
    return null;
  }

  return Notification.findOneAndUpdate(
    {
      userId: user._id.toString(),
      eventId: `WELCOME:${user._id.toString()}`,
    },
    {
      $setOnInsert: {
        userId: user._id.toString(),
        eventId: `WELCOME:${user._id.toString()}`,
        title: "Welcome to Quiz Playground",
        message: buildWelcomeMessage(user.name),
        read: false,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

module.exports = {
  createWelcomeNotification,
};
