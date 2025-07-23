module.exports = {
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: "1h",
    },
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    },
  },
  database: {
    type: "mongodb",
    uri: process.env.DATABASE_URL,
  },
  payments: {
    providers: {
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
      },
    },
    webhooks: {
      enabled: true,
    },
  },
  messaging: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
  },
  media: {
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
  },
  security: {
    bruteForce: {
      enabled: true,
      maxAttempts: 5,
      blockDuration: 15,
    },
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  logging: {
    level: "info",
    file: "./logs/app.log",
  },
}
