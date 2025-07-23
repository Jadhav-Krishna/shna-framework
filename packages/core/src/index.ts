import express, { type Application } from "express"
import helmet from "helmet"
import cors from "cors"
import compression from "compression"
import rateLimit from "express-rate-limit"
import { createServer } from "http"
import { Server as SocketServer } from "socket.io"
import { AuthEngine } from "./auth/AuthEngine"
import { DatabaseManager } from "./database/DatabaseManager"
import { PaymentGateway } from "./payments/PaymentGateway"
import { MessagingService } from "./messaging/MessagingService"
import { MediaManager } from "./media/MediaManager"
import { StreamingService } from "./streaming/StreamingService"
import { SecurityMiddleware } from "./security/SecurityMiddleware"
import { Logger } from "./utils/Logger"
import { ConfigManager } from "./config/ConfigManager"
import type { ShnaConfig, ShnaOptions } from "./types"

export class Shna {
  private app: Application
  private server: any
  private io?: SocketServer
  private config: ShnaConfig
  private logger: Logger
  private auth: AuthEngine
  private database: DatabaseManager
  private payments: PaymentGateway
  private messaging: MessagingService
  private media: MediaManager
  private streaming?: StreamingService
  private security: SecurityMiddleware

  constructor(options: ShnaOptions = {}) {
    this.app = express()
    this.server = createServer(this.app)

    this.config = ConfigManager.load(options)
    this.logger = new Logger(this.config.logging)

    this.initializeCore()
    this.initializeModules()
    this.setupMiddleware()
    this.setupRoutes()
  }

  private initializeCore(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: this.config.security?.csp || false,
        crossOriginEmbedderPolicy: false,
      }),
    )

    this.app.use(cors(this.config.cors))
    this.app.use(compression())
    this.app.use(express.json({ limit: "50mb" }))
    this.app.use(express.urlencoded({ extended: true, limit: "50mb" }))

    // Rate limiting with Redis support
    if (this.config.rateLimit?.enabled) {
      const limiterConfig: any = {
        windowMs: this.config.rateLimit.windowMs || 15 * 60 * 1000,
        max: this.config.rateLimit.max || 100,
        message: "Too many requests from this IP",
      }

      if (this.config.rateLimit.redis) {
        const RedisStore = require("rate-limit-redis")
        const Redis = require("redis")
        const redisClient = Redis.createClient({
          host: this.config.rateLimit.redis.host,
          port: this.config.rateLimit.redis.port,
          password: this.config.rateLimit.redis.password,
        })
        limiterConfig.store = new RedisStore({
          sendCommand: (...args: string[]) => redisClient.call(...args),
        })
      }

      const limiter = rateLimit(limiterConfig)
      this.app.use(limiter)
    }

    // Initialize Socket.IO if enabled
    if (this.config.messaging.realtime?.provider === "socketio") {
      this.io = new SocketServer(this.server, {
        cors: { origin: "*", methods: ["GET", "POST"] },
        ...this.config.messaging.realtime.socketio?.options,
      })
    }
  }

  private initializeModules(): void {
    this.auth = new AuthEngine(this.config.auth, this.logger)
    this.database = new DatabaseManager(this.config.database, this.logger)
    this.payments = new PaymentGateway(this.config.payments, this.logger)
    this.messaging = new MessagingService(this.config.messaging, this.logger, this.io)
    this.media = new MediaManager(this.config.media, this.logger)
    this.security = new SecurityMiddleware(this.config.security, this.logger)

    // Initialize streaming service if enabled
    if (this.config.streaming?.enabled) {
      this.streaming = new StreamingService(this.config.streaming, this.config.media, this.logger)
    }
  }

  private setupMiddleware(): void {
    // Initialize authentication
    this.app.use(this.auth.initialize())

    // Security middleware
    this.app.use(this.security.middleware())

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      })
      next()
    })
  }

  private setupRoutes(): void {
    // Health check with detailed status
    this.app.get("/health", async (req, res) => {
      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || "2.0.0",
        services: {
          database: await this.database.healthCheck(),
          auth: this.auth.healthCheck(),
          payments: this.payments.healthCheck(),
        },
        memory: process.memoryUsage(),
      }
      res.json(health)
    })

    // Auth routes
    this.app.use("/auth", this.auth.getRoutes())

    // Payment routes
    this.app.use("/payments", this.payments.getRoutes())

    // Media routes
    this.app.use("/media", this.media.getRoutes())

    // Streaming routes (if enabled)
    if (this.streaming) {
      this.app.use("/streaming", this.streaming.getRoutes())
    }

    // Messaging routes
    this.app.use("/messaging", this.messaging.getRoutes())

    // Global error handler
    this.app.use((err: any, req: any, res: any, next: any) => {
      this.logger.error("Unhandled error:", err)
      res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
        requestId: req.id,
      })
    })
  }

  // Public API methods
  public use(middleware: any): void {
    this.app.use(middleware)
  }

  public get(path: string, ...handlers: any[]): void {
    this.app.get(path, ...handlers)
  }

  public post(path: string, ...handlers: any[]): void {
    this.app.post(path, ...handlers)
  }

  public put(path: string, ...handlers: any[]): void {
    this.app.put(path, ...handlers)
  }

  public delete(path: string, ...handlers: any[]): void {
    this.app.delete(path, ...handlers)
  }

  public getAuth(): AuthEngine {
    return this.auth
  }

  public getDatabase(): DatabaseManager {
    return this.database
  }

  public getPayments(): PaymentGateway {
    return this.payments
  }

  public getMessaging(): MessagingService {
    return this.messaging
  }

  public getMedia(): MediaManager {
    return this.media
  }

  public getStreaming(): StreamingService | undefined {
    return this.streaming
  }

  public getIO(): SocketServer | undefined {
    return this.io
  }

  public async start(port = 3000): Promise<void> {
    try {
      // Initialize database connection
      await this.database.connect()

      // Initialize streaming service
      if (this.streaming) {
        await this.streaming.initialize()
      }

      // Start server
      this.server.listen(port, () => {
        this.logger.info(`🚀 Shna Enhanced server running on port ${port}`)
        this.logger.info(`📊 Health check: http://localhost:${port}/health`)
        this.logger.info(`🎬 Streaming: ${this.streaming ? "Enabled" : "Disabled"}`)
      })

      // Graceful shutdown
      process.on("SIGTERM", () => this.shutdown())
      process.on("SIGINT", () => this.shutdown())
    } catch (error) {
      this.logger.error("Failed to start server:", error)
      process.exit(1)
    }
  }

  private async shutdown(): Promise<void> {
    this.logger.info("Shutting down gracefully...")

    this.server.close(() => {
      this.database.disconnect()
      this.logger.info("Server closed")
      process.exit(0)
    })
  }
}

// Export everything
export * from "./types"
export * from "./auth/AuthEngine"
export * from "./database/DatabaseManager"
export * from "./payments/PaymentGateway"
export * from "./messaging/MessagingService"
export * from "./media/MediaManager"
export * from "./streaming/StreamingService"
export * from "./utils/Logger"
