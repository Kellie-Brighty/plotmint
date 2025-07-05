// Simple browser-compatible logger
// Replaces Winston for frontend use

interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class BrowserLogger {
  private currentLevel: number = LOG_LEVELS.INFO;

  private formatMessage(level: string, message: string, extra?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (extra && typeof extra === "object") {
      try {
        // Safe JSON.stringify that handles BigInt values
        const safeExtra = JSON.stringify(extra, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value
        );
        return `${baseMessage} ${safeExtra}`;
      } catch {
        return `${baseMessage} [Complex object]`;
      }
    }

    return baseMessage;
  }

  error(message: string, extra?: any): void {
    if (this.currentLevel >= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage("error", message, extra));
    }
  }

  warn(message: string, extra?: any): void {
    if (this.currentLevel >= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage("warn", message, extra));
    }
  }

  info(message: string, extra?: any): void {
    if (this.currentLevel >= LOG_LEVELS.INFO) {
      console.info(this.formatMessage("info", message, extra));
    }
  }

  debug(message: string, extra?: any): void {
    if (this.currentLevel >= LOG_LEVELS.DEBUG) {
      console.debug(this.formatMessage("debug", message, extra));
    }
  }

  setLevel(level: "error" | "warn" | "info" | "debug"): void {
    switch (level) {
      case "error":
        this.currentLevel = LOG_LEVELS.ERROR;
        break;
      case "warn":
        this.currentLevel = LOG_LEVELS.WARN;
        break;
      case "info":
        this.currentLevel = LOG_LEVELS.INFO;
        break;
      case "debug":
        this.currentLevel = LOG_LEVELS.DEBUG;
        break;
    }
  }
}

const logger = new BrowserLogger();

// Set default level based on environment
if (import.meta.env.DEV) {
  logger.setLevel("debug");
} else {
  logger.setLevel("info");
}

export default logger;
