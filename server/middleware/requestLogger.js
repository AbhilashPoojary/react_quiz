const jwt = require("jsonwebtoken");

const sensitiveKeys = new Set([
  "authorization",
  "token",
  "password",
  "confirmpassword",
  "confirmPassword",
  "currentPassword",
  "resetPasswordToken",
  "resetToken",
]);

const truncateString = (value) =>
  value.length > 500 ? `${value.slice(0, 500)}...` : value;

const normalizeKey = (key = "") => String(key).toLowerCase();

const sanitizeValue = (value, key = "", seen = new WeakSet(), depth = 0) => {
  if (sensitiveKeys.has(key) || sensitiveKeys.has(normalizeKey(key))) {
    return "[REDACTED]";
  }

  if (depth > 6) {
    return "[MaxDepth]";
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (Array.isArray(value)) {
    if (value.length > 10) {
      return {
        type: "array",
        length: value.length,
        sample: value
          .slice(0, 3)
          .map((item) => sanitizeValue(item, "", seen, depth + 1)),
      };
    }

    return value.map((item) => sanitizeValue(item, "", seen, depth + 1));
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);

    return Object.entries(value).reduce((acc, [entryKey, entryValue]) => {
      acc[entryKey] = sanitizeValue(entryValue, entryKey, seen, depth + 1);
      return acc;
    }, {});
  }

  return value;
};

const summarizePayload = (payload) => {
  if (payload === undefined) {
    return undefined;
  }

  const sanitized = sanitizeValue(payload);
  const serialized = JSON.stringify(sanitized);

  if (!serialized || serialized.length <= 1500) {
    return sanitized;
  }

  return {
    type: Array.isArray(sanitized) ? "array" : typeof sanitized,
    summary: truncateString(serialized),
  };
};

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.split(" ")[1] || "";
};

const getRequestUser = (req) => {
  if (req.user?.userId || req.user?._id) {
    return {
      userId: req.user.userId || req.user._id,
      name: req.user.name || req.user.username || "unknown",
    };
  }

  const token = getBearerToken(req);

  if (!token) {
    return {
      userId: "anonymous",
      name: "anonymous",
    };
  }

  const decoded = jwt.decode(token) || {};

  return {
    userId: decoded.userId || decoded._id || "unknown",
    name: decoded.username || decoded.name || decoded.email || "unknown",
  };
};

const requestLogger = (req, res, next) => {
  const startedAt = Date.now();
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let responseBody;

  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  res.send = (body) => {
    responseBody = responseBody === undefined ? body : responseBody;
    return originalSend(body);
  };

res.on("finish", () => {
    try {
      const requestUser = getRequestUser(req);
      const logPayload = {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        userId: requestUser.userId,
        name: requestUser.name,
        requestBody: summarizePayload(req.body),
        response: summarizePayload(responseBody),
      };
      const logMessage = `[request] ${req.method} ${req.originalUrl} ${res.statusCode}`;

      if (res.statusCode >= 400) {
        console.error(logMessage, logPayload);
        return;
      }

      console.info(logMessage, logPayload);
    } catch (error) {
      console.error("[request] logging failed", {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode,
        error: error.message,
      });
    }
  });

  next();
};

module.exports = requestLogger;
