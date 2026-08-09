const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getPasswordExpiryDays = () =>
  parsePositiveInt(process.env.PASSWORD_EXPIRY_DAYS, 90);

const getPasswordExpiryWarningDays = () =>
  parsePositiveInt(process.env.PASSWORD_EXPIRY_WARNING_DAYS, 7);

const getPasswordExpiryInfo = (user, now = new Date()) => {
  const changedAt = user?.passwordChangedAt || user?.createdAt || now;
  const expiresAt = new Date(
    new Date(changedAt).getTime() + getPasswordExpiryDays() * DAY_IN_MS
  );
  const msRemaining = expiresAt.getTime() - now.getTime();
  const expired = msRemaining <= 0;
  const daysRemaining = expired ? 0 : Math.ceil(msRemaining / DAY_IN_MS);
  const warningDays = getPasswordExpiryWarningDays();

  return {
    expired,
    daysRemaining,
    expiresAt,
    warningDays,
    shouldWarn: !expired && daysRemaining <= warningDays,
  };
};

module.exports = {
  getPasswordExpiryDays,
  getPasswordExpiryWarningDays,
  getPasswordExpiryInfo,
};
