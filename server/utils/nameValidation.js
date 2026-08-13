const nameRequirements = "Name must be between 3 and 50 characters.";

const validateName = (name = "") => {
  const trimmedName = String(name || "").trim();

  if (!trimmedName) {
    return "Name is mandatory";
  }

  if (trimmedName.length < 3 || trimmedName.length > 50) {
    return nameRequirements;
  }

  return "";
};

module.exports = {
  nameRequirements,
  validateName,
};
