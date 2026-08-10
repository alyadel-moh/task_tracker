import { createLogger, format, transports } from "winston";

const SENSITIVE_KEYS = ["password", "token", "authorization", "secret", "jwt"];

// Helper function to recursively mask sensitive keys in objects/JSON
const sanitizeData = (data: any): any => {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  for (const key of Object.keys(data)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      data[key] = "***MASKED***";
    } else if (typeof data[key] === "object" && data[key] !== null) {
      sanitizeData(data[key]);
    }
  }

  return data;
};

// Formatter that mutates info in-place without stripping Winston's internal Symbols
const maskFormat = format((info) => {
  sanitizeData(info);
  return info;
});

export const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    maskFormat(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [new transports.Console()],
});
