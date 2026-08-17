const ruleMessages = {
  uppercase: "uppercase letter",
  lowercase: "lowercase letter",
  number: "number",
  special: "special character",
};

export const validateField = (value, rules = {}, label = "Field") => {
  const stringValue = String(value || "");
  const trimmedValue = stringValue.trim();

  if (rules.required && !trimmedValue) {
    return `${label} is mandatory`;
  }

  if (!trimmedValue && !rules.required) {
    return "";
  }

  if (rules.minLength && trimmedValue.length < rules.minLength) {
    return `${label} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    return `${label} must be ${rules.maxLength} characters or fewer`;
  }

  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    return rules.patternMessage || `Please enter a valid ${label.toLowerCase()}`;
  }

  const missingRules = [];

  if (rules.uppercase && !/[A-Z]/.test(stringValue)) {
    missingRules.push(ruleMessages.uppercase);
  }

  if (rules.lowercase && !/[a-z]/.test(stringValue)) {
    missingRules.push(ruleMessages.lowercase);
  }

  if (rules.number && !/[0-9]/.test(stringValue)) {
    missingRules.push(ruleMessages.number);
  }

  if (rules.special && !/[^A-Za-z0-9]/.test(stringValue)) {
    missingRules.push(ruleMessages.special);
  }

  if (missingRules.length > 0) {
    return `${label} must include ${missingRules.join(", ")}`;
  }

  if (typeof rules.custom === "function") {
    return rules.custom(stringValue) || "";
  }

  return "";
};

export const validateFile = (file, rules = {}, label = "File") => {
  if (rules.required && !file) {
    return `${label} is mandatory`;
  }

  if (!file) {
    return "";
  }

  if (typeof file === "string") {
    return file.trim() ? "" : `${label} is mandatory`;
  }

  if (rules.accept?.length) {
    const extension = String(file.name || "")
      .split(".")
      .pop()
      ?.toLowerCase();
    const extensionTypeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    const inferredType = extensionTypeMap[extension] || "";
    const isAccepted =
      rules.accept.includes(file.type) ||
      Boolean(inferredType && rules.accept.includes(inferredType));

    if (!isAccepted) {
      return rules.acceptMessage || `Please select a valid ${label.toLowerCase()}`;
    }
  }

  if (rules.maxSizeMb && file.size > rules.maxSizeMb * 1024 * 1024) {
    return `${label} must be ${rules.maxSizeMb}MB or smaller`;
  }

  return "";
};
