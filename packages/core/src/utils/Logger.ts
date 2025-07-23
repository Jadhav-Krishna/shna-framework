import winston from "winston"
import type { LoggingConfig } from "../types"

export class Logger {
  private logger: winston.Logger

  constructor(config: LoggingConfig) {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`
          }),
        ),
      }),
    ]

    if (config.file) {
      transports.push(
        new winston.transports.File({
          filename: config.file,
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      )
    }

    this.logger = winston.createLogger({
      level: config.level || "info",
      transports,
    })
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, meta)
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta)
  }

  public error(message: string, meta?: any): void {
    this.logger.error(message, meta)
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta)
  }
}
