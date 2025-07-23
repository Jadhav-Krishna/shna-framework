import { Shna } from "shna"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Create Shna app instance with video streaming
const app = new Shna({
  auth: {
    provider: "jwt",
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: "24h", // Longer sessions for video viewing
    },
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    rbac: {
      enabled: true,
      roles: ["viewer", "creator", "admin"],
      permissions: {
        "video:upload": ["creator", "admin"],
        "video:delete": ["creator", "admin"],
        "video:view": ["viewer", "creator", "admin"],
        "admin:manage": ["admin"],
      },
    },
  },
  database: {
    type: "mongodb",
    uri: process.env.DATABASE_URL!,
    poolSize: 20, // Higher pool for video streaming
  },
  payments: {
    providers: {
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY!,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      },
    },
    webhooks: {
      enabled: true,
    },
  },
  messaging: {
    realtime: {
      provider: "socketio",
      socketio: {
        enabled: true,
        options: {
          cors: { origin: "*" },
        },
      },
    },
  },
  media: {
    provider: "cloudinary",
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      apiSecret: process.env.CLOUDINARY_API_SECRET!,
    },
    upload: {
      maxSize: 500 * 1024 * 1024, // 500MB for videos
      allowedTypes: ["video/mp4", "video/avi", "video/mov", "video/wmv", "image/jpeg", "image/png", "image/gif"],
    },
  },
  streaming: {
    enabled: true,
    provider: "cloudinary",
    formats: ["hls", "dash"],
    qualities: ["1080p", "720p", "480p", "360p"],
    storage: {
      videosPath: "./uploads/videos",
      chunksPath: "./uploads/chunks",
    },
    transcoding: {
      enabled: true,
      concurrent: 3,
    },
  },
  security: {
    bruteForce: {
      enabled: true,
      maxAttempts: 10, // More lenient for video platform
      blockDuration: 5,
    },
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000,
    max: 200, // Higher limit for video streaming
  },
})

// Video-specific routes
app.get("/api/videos/trending", async (req, res) => {
  try {
    // Get trending videos logic
    res.json({ videos: [] })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trending videos" })
  }
})

app.get("/api/videos/search", async (req, res) => {
  try {
    const { q, category, duration } = req.query
    // Search videos logic
    res.json({ videos: [], query: q })
  } catch (error) {
    res.status(500).json({ error: "Search failed" })
  }
})

// Subscription management
app.post("/api/subscriptions/create", app.getAuth().authenticate(), async (req, res) => {
  try {
    const { planId } = req.body
    const userId = req.user.id

    // Create subscription logic
    res.json({ success: true, subscriptionId: "sub_123" })
  } catch (error) {
    res.status(500).json({ error: "Failed to create subscription" })
  }
})

// Video analytics
app.post("/api/videos/:id/view", async (req, res) => {
  try {
    const { id } = req.params
    // Record view logic
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Failed to record view" })
  }
})

// Real-time features
const io = app.getIO()
if (io) {
  io.on("connection", (socket) => {
    console.log("User connected for streaming:", socket.id)

    socket.on("join-video", (videoId) => {
      socket.join(`video-${videoId}`)
      socket.to(`video-${videoId}`).emit("viewer-joined", {
        socketId: socket.id,
        timestamp: new Date(),
      })
    })

    socket.on("video-comment", (data) => {
      socket.to(`video-${data.videoId}`).emit("new-comment", {
        comment: data.comment,
        user: data.user,
        timestamp: new Date(),
      })
    })

    socket.on("video-like", (data) => {
      socket.to(`video-${data.videoId}`).emit("video-liked", {
        userId: data.userId,
        timestamp: new Date(),
      })
    })
  })
}

// Payment webhooks for subscriptions
app.getPayments().on("payment.success", (data) => {
  console.log("Subscription payment successful:", data)
  // Update user subscription status
})

// Start the server
const PORT = process.env.PORT || 3000
app.start(PORT)

console.log(`🎬 Video Streaming Platform ready!`)
console.log(`📺 Upload videos: http://localhost:${PORT}/streaming/upload`)
console.log(`🎥 Stream videos: http://localhost:${PORT}/streaming/videos`)
