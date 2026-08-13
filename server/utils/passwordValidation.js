const passwordRequirements =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

const validatePasswordStrength = (password = "") => {
  if (password.length < 8) {
    return passwordRequirements;
  }

  if (!/[A-Z]/.test(password)) {
    return passwordRequirements;
  }

  if (!/[a-z]/.test(password)) {
    return passwordRequirements;
  }

  if (!/[0-9]/.test(password)) {
    return passwordRequirements;
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return passwordRequirements;
  }

  return "";
};

module.exports = {
  passwordRequirements,
  validatePasswordStrength,
};
