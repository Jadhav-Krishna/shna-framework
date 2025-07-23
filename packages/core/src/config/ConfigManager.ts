import type { ShnaConfig, ShnaOptions } from "../types"

export class ConfigManager {
  public static load(options: ShnaOptions): ShnaConfig {
    const defaultConfig: ShnaConfig = {
      auth: {
        provider: "jwt",
        jwt: {
          secret: process.env.JWT_SECRET || "your-secret-key",
          expiresIn: "1h",
          refreshExpiresIn: "7d",
        },
        oauth: {},
        rbac: {
          enabled: false,
          roles: ["user", "admin"],
          permissions: {},
        },
      },
      database: {
        type: "mongodb",
        uri: process.env.DATABASE_URL || "mongodb://localhost:27017/shna",
        options: {},
        ssl: process.env.DATABASE_SSL === "true",
        poolSize: Number.parseInt(process.env.DATABASE_POOL_SIZE || "10"),
      },
      payments: {
        providers: {},
        webhooks: {
          enabled: false,
          endpoints: [],
        },
      },
      messaging: {
        sms: {
          provider: "twilio",
        },
        realtime: {
          provider: "socketio",
          socketio: {
            enabled: true,
            options: {},
          },
        },
      },
      media: {
        provider: "cloudinary",
        upload: {
          maxSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        },
      },
      streaming: {
        enabled: false,
        provider: "local",
        formats: ["hls"],
        qualities: ["720p", "480p", "360p"],
        storage: {
          videosPath: "./uploads/videos",
          chunksPath: "./uploads/chunks",
        },
        transcoding: {
          enabled: true,
          concurrent: 2,
        },
      },
      security: {
        csp: false,
        bruteForce: {
          enabled: true,
          maxAttempts: 5,
          blockDuration: 15, // minutes
        },
        csrf: {
          enabled: true,
          secret: process.env.CSRF_SECRET || "csrf-secret",
        },
      },
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true,
      },
      rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // requests per window
      },
      logging: {
        level: (process.env.LOG_LEVEL as any) || "info",
        format: "json",
        file: process.env.LOG_FILE,
      },
    }

    return this.mergeConfig(defaultConfig, options)
  }

  private static mergeConfig(defaultConfig: ShnaConfig, options: ShnaOptions): ShnaConfig {
    return {
      ...defaultConfig,
      ...options,
      auth: { ...defaultConfig.auth, ...options.auth },
      database: { ...defaultConfig.database, ...options.database },
      payments: { ...defaultConfig.payments, ...options.payments },
      messaging: { ...defaultConfig.messaging, ...options.messaging },
      media: { ...defaultConfig.media, ...options.media },
      streaming: { ...defaultConfig.streaming, ...options.streaming },
      security: { ...defaultConfig.security, ...options.security },
      logging: { ...defaultConfig.logging, ...options.logging },
    }
  }
}
