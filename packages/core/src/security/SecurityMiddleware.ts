import type { Request, Response, NextFunction } from "express"
import type { SecurityConfig } from "../types"
import type { Logger } from "../utils/Logger"

export class SecurityMiddleware {
  private config: SecurityConfig
  private logger: Logger
  private bruteForceAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map()

  constructor(config: SecurityConfig, logger: Logger) {
    this.config = config
    this.logger = logger
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Add security headers
      res.setHeader("X-Content-Type-Options", "nosniff")
      res.setHeader("X-Frame-Options", "DENY")
      res.setHeader("X-XSS-Protection", "1; mode=block")
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")

      // CSRF protection for state-changing operations
      if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
        const token = req.headers["x-csrf-token"] || req.body._csrf
        // In production, implement proper CSRF token validation
      }

      next()
    }
  }

  public bruteForceProtection() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.bruteForce?.enabled) {
        return next()
      }

      const ip = req.ip
      const now = new Date()
      const attempts = this.bruteForceAttempts.get(ip)

      if (attempts) {
        const timeDiff = now.getTime() - attempts.lastAttempt.getTime()
        const blockDuration = (this.config.bruteForce.blockDuration || 15) * 60 * 1000 // 15 minutes default

        if (attempts.count >= (this.config.bruteForce.maxAttempts || 5) && timeDiff < blockDuration) {
          this.logger.warn(`Brute force attempt blocked for IP: ${ip}`)
          return res.status(429).json({
            error: "Too many failed attempts. Please try again later.",
            retryAfter: Math.ceil((blockDuration - timeDiff) / 1000),
          })
        }

        // Reset attempts if block duration has passed
        if (timeDiff >= blockDuration) {
          this.bruteForceAttempts.delete(ip)
        }
      }

      next()
    }
  }

  public recordFailedAttempt(ip: string): void {
    if (!this.config.bruteForce?.enabled) return

    const attempts = this.bruteForceAttempts.get(ip) || { count: 0, lastAttempt: new Date() }
    attempts.count += 1
    attempts.lastAttempt = new Date()

    this.bruteForceAttempts.set(ip, attempts)

    this.logger.warn(`Failed login attempt from IP: ${ip}, count: ${attempts.count}`)
  }

  public clearFailedAttempts(ip: string): void {
    this.bruteForceAttempts.delete(ip)
  }
}
