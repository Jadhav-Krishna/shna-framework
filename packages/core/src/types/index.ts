export interface ShnaOptions {
  auth?: AuthConfig
  database?: DatabaseConfig
  payments?: PaymentConfig
  messaging?: MessagingConfig
  media?: MediaConfig
  streaming?: StreamingConfig
  security?: SecurityConfig
  cors?: any
  rateLimit?: RateLimitConfig
  logging?: LoggingConfig
}

export interface ShnaConfig extends Required<ShnaOptions> {}

export interface AuthConfig {
  provider: "jwt" | "firebase" | "auth0"
  jwt?: {
    secret: string
    expiresIn?: string
    refreshExpiresIn?: string
  }
  firebase?: {
    projectId: string
    privateKey: string
    clientEmail: string
  }
  auth0?: {
    domain: string
    clientId: string
    clientSecret: string
    audience?: string
  }
  oauth?: {
    google?: {
      clientId: string
      clientSecret: string
    }
    github?: {
      clientId: string
      clientSecret: string
    }
  }
  rbac?: {
    enabled: boolean
    roles?: string[]
    permissions?: Record<string, string[]>
  }
}

export interface DatabaseConfig {
  type: "mongodb" | "postgresql" | "mysql" | "firebase"
  uri: string
  options?: any
  ssl?: boolean
  poolSize?: number
}

export interface PaymentConfig {
  providers?: {
    razorpay?: {
      keyId: string
      keySecret: string
    }
    stripe?: {
      secretKey: string
      publishableKey: string
      webhookSecret: string
    }
    paystack?: {
      secretKey: string
      publicKey: string
    }
    paypal?: {
      clientId: string
      clientSecret: string
      mode: "sandbox" | "live"
    }
  }
  webhooks?: {
    enabled: boolean
    endpoints?: string[]
  }
}

export interface MessagingConfig {
  sms?: {
    provider: "twilio" | "vonage" | "custom"
    twilio?: {
      accountSid: string
      authToken: string
      phoneNumber: string
    }
    vonage?: {
      apiKey: string
      apiSecret: string
      phoneNumber: string
    }
    custom?: {
      endpoint: string
      apiKey: string
    }
  }
  realtime?: {
    provider: "socketio" | "websocket" | "pusher"
    socketio?: {
      enabled: boolean
      options?: any
    }
    pusher?: {
      appId: string
      key: string
      secret: string
      cluster: string
    }
  }
}

export interface MediaConfig {
  provider: "cloudinary" | "aws-s3" | "local"
  cloudinary?: {
    cloudName: string
    apiKey: string
    apiSecret: string
  }
  aws?: {
    accessKeyId: string
    secretAccessKey: string
    region: string
    bucket: string
  }
  local?: {
    uploadPath: string
    publicPath: string
  }
  upload?: {
    maxSize: number
    allowedTypes: string[]
  }
}

export interface StreamingConfig {
  enabled: boolean
  provider: "cloudinary" | "aws" | "local"
  formats?: ("hls" | "dash")[]
  qualities?: ("240p" | "360p" | "480p" | "720p" | "1080p")[]
  storage?: {
    videosPath: string
    chunksPath: string
  }
  transcoding?: {
    enabled: boolean
    concurrent: number
  }
}

export interface SecurityConfig {
  csp?: any
  bruteForce?: {
    enabled: boolean
    maxAttempts: number
    blockDuration: number
  }
  csrf?: {
    enabled: boolean
    secret: string
  }
}

export interface RateLimitConfig {
  enabled: boolean
  windowMs?: number
  max?: number
  redis?: {
    host: string
    port: number
    password?: string
  }
}

export interface LoggingConfig {
  level: "error" | "warn" | "info" | "debug"
  format?: "json" | "simple"
  file?: string
  elasticsearch?: {
    host: string
    index: string
  }
}

export interface User {
  id: string
  email: string
  name?: string
  roles?: string[]
  permissions?: string[]
  provider?: string
  createdAt: Date
  updatedAt: Date
}

export interface Video {
  id: string
  title: string
  description?: string
  userId: string
  filename: string
  originalUrl: string
  streamingUrls?: {
    hls?: string
    dash?: string
  }
  thumbnailUrl?: string
  duration?: number
  size: number
  status: "uploading" | "processing" | "ready" | "error"
  createdAt: Date
  updatedAt: Date
}

export interface JWTPayload {
  userId: string
  email: string
  roles?: string[]
  permissions?: string[]
  iat?: number
  exp?: number
}
