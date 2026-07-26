import winston from "winston";

const isProduction = process.env.NODE_ENV === "production" || process.env.LOG_FORMAT === "json";

const format = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }), // Extract stack trace from Error objects automatically
  isProduction
    ? winston.format.json() // Production: Output structured JSON for Log Monitoring
    : winston.format.combine(
        // Local development: Output colorized human-readable text
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level}]: ${message}${stack ? `\n${stack}` : ""}`;
        }),
      ),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format,
  defaultMeta: { service: "service-syncer" }, // Standard service tag for log grouping
  transports: [new winston.transports.Console()],
});

export { logger };
