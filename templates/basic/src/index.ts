import { Shna } from "shna"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Create Shna app instance
const app = new Shna({
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || "your-secret-key",
      expiresIn: "1h",
    },
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  },
  database: {
    type: "mongodb",
    uri: process.env.DATABASE_URL || "mongodb://localhost:27017/shna-app",
  },
  payments: {
    providers: {
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID!,
        keySecret: process.env.RAZORPAY_KEY_SECRET!,
      },
    },
  },
  messaging: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID!,
      authToken: process.env.TWILIO_AUTH_TOKEN!,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
    },
  },
  media: {
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      apiSecret: process.env.CLOUDINARY_API_SECRET!,
    },
  },
})

// Add custom routes
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Shna!" })
})

// Protected route example
app.get("/api/profile", app.getAuth().authenticate(), (req, res) => {
  res.json({ user: req.user })
})

// Start the server
const PORT = process.env.PORT || 3000
app.start(PORT)
