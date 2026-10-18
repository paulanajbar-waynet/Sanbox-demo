import pino, { type DestinationStream, type Logger, type LoggerOptions } from "pino";

import { loadEnv } from "./config/env";

/** Fields that must never reach a log line (passwords, tokens, JWTs, cookies). */
export const REDACTED_PATHS = [
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "jwt",
  "secret",
  "authorization",
  "cookie",
  "*.password",
  "*.passwordHash",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.jwt",
  "*.secret",
  "*.authorization",
  "*.cookie",
  "headers.authorization",
  "headers.cookie",
  "req.headers.authorization",
  "req.headers.cookie",
];

export function createLogger(options: LoggerOptions = {}, destination?: DestinationStream): Logger {
  const config: LoggerOptions = {
    level: loadEnv().LOG_LEVEL,
    redact: { paths: REDACTED_PATHS, censor: "[REDACTED]" },
    ...options,
  };
  return destination ? pino(config, destination) : pino(config);
}

export const logger = createLogger();

export type { Logger };
