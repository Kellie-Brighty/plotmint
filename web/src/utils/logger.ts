import { createLogger, format, transports } from 'winston';
import path from "path";

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level.toUpperCase}: ${stack || message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    colorize(),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      level: 'info'
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    })
  ],
  exitOnError: false, // Prevents process exit on error
});

export default logger;