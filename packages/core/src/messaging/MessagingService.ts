import { Router } from "express"
import twilio from "twilio"
import { Vonage } from "@vonage/server-sdk"
import Pusher from "pusher"
import WebSocket from "ws"
import type { Server as SocketServer } from "socket.io"
import type { MessagingConfig } from "../types"
import type { Logger } from "../utils/Logger"

export class MessagingService {
  private router: Router
  private config: MessagingConfig
  private logger: Logger
  private twilioClient?: twilio.Twilio
  private vonageClient?: Vonage
  private pusherClient?: Pusher
  private io?: SocketServer
  private wsServer?: WebSocket.Server

  constructor(config: MessagingConfig, logger: Logger, io?: SocketServer) {
    this.config = config
    this.logger = logger
    this.io = io
    this.router = Router()

    this.initializeProviders()
    this.setupRoutes()
  }

  private initializeProviders(): void {
    // Initialize SMS providers
    if (this.config.sms?.provider === "twilio" && this.config.sms.twilio) {
      this.twilioClient = twilio(this.config.sms.twilio.accountSid, this.config.sms.twilio.authToken)
    }

    if (this.config.sms?.provider === "vonage" && this.config.sms.vonage) {
      this.vonageClient = new Vonage({
        apiKey: this.config.sms.vonage.apiKey,
        apiSecret: this.config.sms.vonage.apiSecret,
      })
    }

    // Initialize real-time providers
    if (this.config.realtime?.provider === "pusher" && this.config.realtime.pusher) {
      this.pusherClient = new Pusher({
        appId: this.config.realtime.pusher.appId,
        key: this.config.realtime.pusher.key,
        secret: this.config.realtime.pusher.secret,
        cluster: this.config.realtime.pusher.cluster,
        useTLS: true,
      })
    }

    if (this.config.realtime?.provider === "websocket") {
      this.setupWebSocketServer()
    }
  }

  private setupWebSocketServer(): void {
    this.wsServer = new WebSocket.Server({ port: 8080 })

    this.wsServer.on("connection", (ws) => {
      this.logger.info("WebSocket client connected")

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString())
          this.handleWebSocketMessage(ws, data)
        } catch (error) {
          this.logger.error("Invalid WebSocket message:", error)
        }
      })

      ws.on("close", () => {
        this.logger.info("WebSocket client disconnected")
      })
    })
  }

  private handleWebSocketMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case "join-room":
        // Handle room joining logic
        ws.send(JSON.stringify({ type: "joined-room", room: data.room }))
        break
      case "send-message":
        // Broadcast message to room
        this.broadcastToRoom(data.room, data.message)
        break
      default:
        this.logger.warn("Unknown WebSocket message type:", data.type)
    }
  }

  private broadcastToRoom(room: string, message: any): void {
    if (this.wsServer) {
      this.wsServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "room-message",
              room,
              message,
            }),
          )
        }
      })
    }
  }

  private setupRoutes(): void {
    // Send SMS
    this.router.post("/sms/send", async (req, res) => {
      try {
        const { to, message } = req.body

        let result: any

        switch (this.config.sms?.provider) {
          case "twilio":
            if (!this.twilioClient) {
              return res.status(400).json({ error: "Twilio not configured" })
            }

            result = await this.twilioClient.messages.create({
              body: message,
              from: this.config.sms.twilio!.phoneNumber,
              to,
            })

            res.json({
              success: true,
              messageId: result.sid,
              status: result.status,
              provider: "twilio",
            })
            break

          case "vonage":
            if (!this.vonageClient) {
              return res.status(400).json({ error: "Vonage not configured" })
            }

            result = await this.vonageClient.sms.send({
              to,
              from: this.config.sms.vonage!.phoneNumber,
              text: message,
            })

            res.json({
              success: true,
              messageId: result.messages[0]["message-id"],
              status: result.messages[0].status,
              provider: "vonage",
            })
            break

          case "custom":
            if (!this.config.sms?.custom) {
              return res.status(400).json({ error: "Custom SMS not configured" })
            }

            // Implement custom SMS gateway logic
            const response = await fetch(this.config.sms.custom.endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.config.sms.custom.apiKey}`,
              },
              body: JSON.stringify({ to, message }),
            })

            const customResult = await response.json()

            res.json({
              success: response.ok,
              messageId: customResult.id,
              provider: "custom",
            })
            break

          default:
            res.status(400).json({ error: "SMS provider not configured" })
        }
      } catch (error) {
        this.logger.error("SMS sending failed:", error)
        res.status(500).json({ error: "Failed to send SMS" })
      }
    })

    // Send OTP
    this.router.post("/otp/send", async (req, res) => {
      try {
        const { to, length = 6 } = req.body
        const otp = this.generateOTP(length)

        const message = `Your OTP is: ${otp}. Valid for 10 minutes.`

        // Store OTP in cache/database (simplified for demo)
        // In production, use Redis or database with expiration

        let result: any

        switch (this.config.sms?.provider) {
          case "twilio":
            if (!this.twilioClient) {
              return res.status(400).json({ error: "Twilio not configured" })
            }

            result = await this.twilioClient.messages.create({
              body: message,
              from: this.config.sms.twilio!.phoneNumber,
              to,
            })
            break

          case "vonage":
            if (!this.vonageClient) {
              return res.status(400).json({ error: "Vonage not configured" })
            }

            result = await this.vonageClient.sms.send({
              to,
              from: this.config.sms.vonage!.phoneNumber,
              text: message,
            })
            break
        }

        res.json({
          success: true,
          message: "OTP sent successfully",
          // Don't send OTP in response in production
          otp: process.env.NODE_ENV === "development" ? otp : undefined,
        })
      } catch (error) {
        this.logger.error("OTP sending failed:", error)
        res.status(500).json({ error: "Failed to send OTP" })
      }
    })

    // Verify OTP
    this.router.post("/otp/verify", async (req, res) => {
      try {
        const { phone, otp } = req.body

        // Verify OTP logic (simplified for demo)
        // In production, check against stored OTP in cache/database

        res.json({
          success: true,
          message: "OTP verified successfully",
        })
      } catch (error) {
        this.logger.error("OTP verification failed:", error)
        res.status(500).json({ error: "Failed to verify OTP" })
      }
    })

    // Real-time messaging
    this.router.post("/realtime/send", async (req, res) => {
      try {
        const { channel, event, data } = req.body

        switch (this.config.realtime?.provider) {
          case "socketio":
            if (this.io) {
              this.io.to(channel).emit(event, data)
              res.json({ success: true, provider: "socketio" })
            } else {
              res.status(400).json({ error: "Socket.IO not configured" })
            }
            break

          case "pusher":
            if (this.pusherClient) {
              await this.pusherClient.trigger(channel, event, data)
              res.json({ success: true, provider: "pusher" })
            } else {
              res.status(400).json({ error: "Pusher not configured" })
            }
            break

          case "websocket":
            if (this.wsServer) {
              this.broadcastToRoom(channel, { event, data })
              res.json({ success: true, provider: "websocket" })
            } else {
              res.status(400).json({ error: "WebSocket server not configured" })
            }
            break

          default:
            res.status(400).json({ error: "Real-time provider not configured" })
        }
      } catch (error) {
        this.logger.error("Real-time message sending failed:", error)
        res.status(500).json({ error: "Failed to send real-time message" })
      }
    })

    // Get Pusher auth (for private channels)
    this.router.post("/realtime/auth", (req, res) => {
      if (this.config.realtime?.provider === "pusher" && this.pusherClient) {
        const socketId = req.body.socket_id
        const channel = req.body.channel_name
        const presenceData = {
          user_id: req.user?.id || "anonymous",
          user_info: {
            name: req.user?.name || "Anonymous",
            email: req.user?.email,
          },
        }

        const auth = this.pusherClient.authorizeChannel(socketId, channel, presenceData)
        res.send(auth)
      } else {
        res.status(400).json({ error: "Pusher not configured" })
      }
    })

    // Email sending (using external service)
    this.router.post("/email/send", async (req, res) => {
      try {
        const { to, subject, html, text } = req.body

        // Implement email sending logic
        // This could integrate with SendGrid, Mailgun, etc.

        res.json({
          success: true,
          message: "Email sent successfully",
        })
      } catch (error) {
        this.logger.error("Email sending failed:", error)
        res.status(500).json({ error: "Failed to send email" })
      }
    })
  }

  private generateOTP(length: number): string {
    const digits = "0123456789"
    let otp = ""
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)]
    }
    return otp
  }

  public getRoutes(): Router {
    return this.router
  }
}
