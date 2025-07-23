import { Router } from "express"
import Razorpay from "razorpay"
import Stripe from "stripe"
import crypto from "crypto"
import type { PaymentConfig } from "../types"
import type { Logger } from "../utils/Logger"

// Paystack interface (simplified)
interface PaystackClient {
  transaction: {
    initialize: (data: any) => Promise<any>
    verify: (reference: string) => Promise<any>
  }
}

export class PaymentGateway {
  private router: Router
  private config: PaymentConfig
  private logger: Logger
  private razorpay?: Razorpay
  private stripe?: Stripe
  private paystack?: PaystackClient

  constructor(config: PaymentConfig, logger: Logger) {
    this.config = config
    this.logger = logger
    this.router = Router()

    this.initializeProviders()
    this.setupRoutes()
  }

  private initializeProviders(): void {
    // Initialize Razorpay
    if (this.config.providers?.razorpay) {
      this.razorpay = new Razorpay({
        key_id: this.config.providers.razorpay.keyId,
        key_secret: this.config.providers.razorpay.keySecret,
      })
    }

    // Initialize Stripe
    if (this.config.providers?.stripe) {
      this.stripe = new Stripe(this.config.providers.stripe.secretKey, {
        apiVersion: "2023-10-16",
      })
    }

    // Initialize Paystack
    if (this.config.providers?.paystack) {
      const PayStack = require("paystack")(this.config.providers.paystack.secretKey)
      this.paystack = PayStack
    }
  }

  private setupRoutes(): void {
    // Create payment order/intent
    this.router.post("/create-order", async (req, res) => {
      try {
        const { amount, currency = "INR", provider = "razorpay", metadata = {} } = req.body

        switch (provider) {
          case "razorpay":
            if (!this.razorpay) {
              return res.status(400).json({ error: "Razorpay not configured" })
            }

            const razorpayOrder = await this.razorpay.orders.create({
              amount: amount * 100, // Convert to paise
              currency,
              receipt: `order_${Date.now()}`,
              notes: metadata,
            })

            res.json({
              orderId: razorpayOrder.id,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
              provider: "razorpay",
            })
            break

          case "stripe":
            if (!this.stripe) {
              return res.status(400).json({ error: "Stripe not configured" })
            }

            const paymentIntent = await this.stripe.paymentIntents.create({
              amount: amount * 100, // Convert to cents
              currency: currency.toLowerCase(),
              metadata: { orderId: `order_${Date.now()}`, ...metadata },
            })

            res.json({
              clientSecret: paymentIntent.client_secret,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              provider: "stripe",
            })
            break

          case "paystack":
            if (!this.paystack) {
              return res.status(400).json({ error: "Paystack not configured" })
            }

            const paystackResponse = await this.paystack.transaction.initialize({
              amount: amount * 100, // Convert to kobo
              currency,
              email: req.body.email,
              reference: `order_${Date.now()}`,
              metadata,
            })

            res.json({
              authorizationUrl: paystackResponse.data.authorization_url,
              accessCode: paystackResponse.data.access_code,
              reference: paystackResponse.data.reference,
              provider: "paystack",
            })
            break

          default:
            res.status(400).json({ error: "Unsupported payment provider" })
        }
      } catch (error) {
        this.logger.error("Payment order creation failed:", error)
        res.status(500).json({ error: "Failed to create payment order" })
      }
    })

    // Verify payment
    this.router.post("/verify", async (req, res) => {
      try {
        const { provider = "razorpay" } = req.body

        switch (provider) {
          case "razorpay":
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

            const sign = razorpay_order_id + "|" + razorpay_payment_id
            const expectedSign = crypto
              .createHmac("sha256", this.config.providers!.razorpay!.keySecret)
              .update(sign.toString())
              .digest("hex")

            if (razorpay_signature === expectedSign) {
              res.json({ success: true, message: "Payment verified successfully" })
            } else {
              res.status(400).json({ success: false, message: "Invalid signature" })
            }
            break

          case "stripe":
            const { payment_intent_id } = req.body

            if (this.stripe) {
              const paymentIntent = await this.stripe.paymentIntents.retrieve(payment_intent_id)

              if (paymentIntent.status === "succeeded") {
                res.json({ success: true, message: "Payment verified successfully" })
              } else {
                res.status(400).json({ success: false, message: "Payment not completed" })
              }
            }
            break

          case "paystack":
            const { reference } = req.body

            if (this.paystack) {
              const verification = await this.paystack.transaction.verify(reference)

              if (verification.data.status === "success") {
                res.json({ success: true, message: "Payment verified successfully" })
              } else {
                res.status(400).json({ success: false, message: "Payment verification failed" })
              }
            }
            break

          default:
            res.status(400).json({ error: "Unsupported payment provider" })
        }
      } catch (error) {
        this.logger.error("Payment verification failed:", error)
        res.status(500).json({ error: "Payment verification failed" })
      }
    })

    // Subscription management
    this.router.post("/create-subscription", async (req, res) => {
      try {
        const { provider, planId, customerId } = req.body

        switch (provider) {
          case "stripe":
            if (!this.stripe) {
              return res.status(400).json({ error: "Stripe not configured" })
            }

            const subscription = await this.stripe.subscriptions.create({
              customer: customerId,
              items: [{ price: planId }],
              payment_behavior: "default_incomplete",
              payment_settings: { save_default_payment_method: "on_subscription" },
              expand: ["latest_invoice.payment_intent"],
            })

            res.json({
              subscriptionId: subscription.id,
              clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
            })
            break

          default:
            res.status(400).json({ error: "Subscription not supported for this provider" })
        }
      } catch (error) {
        this.logger.error("Subscription creation failed:", error)
        res.status(500).json({ error: "Failed to create subscription" })
      }
    })

    // Webhook handlers
    if (this.config.webhooks?.enabled) {
      this.router.post("/webhook/razorpay", (req, res) => {
        try {
          const signature = req.headers["x-razorpay-signature"] as string
          const body = JSON.stringify(req.body)

          const expectedSignature = crypto
            .createHmac("sha256", this.config.providers!.razorpay!.keySecret)
            .update(body)
            .digest("hex")

          if (signature === expectedSignature) {
            this.logger.info("Razorpay webhook received:", req.body)
            this.handleWebhookEvent("razorpay", req.body)
            res.status(200).send("OK")
          } else {
            res.status(400).send("Invalid signature")
          }
        } catch (error) {
          this.logger.error("Razorpay webhook error:", error)
          res.status(500).send("Webhook error")
        }
      })

      this.router.post("/webhook/stripe", (req, res) => {
        try {
          const signature = req.headers["stripe-signature"] as string

          if (this.stripe && this.config.providers?.stripe?.webhookSecret) {
            const event = this.stripe.webhooks.constructEvent(
              req.body,
              signature,
              this.config.providers.stripe.webhookSecret,
            )

            this.logger.info("Stripe webhook received:", event.type)
            this.handleWebhookEvent("stripe", event)
            res.status(200).send("OK")
          }
        } catch (error) {
          this.logger.error("Stripe webhook error:", error)
          res.status(400).send("Webhook error")
        }
      })

      this.router.post("/webhook/paystack", (req, res) => {
        try {
          const hash = crypto
            .createHmac("sha512", this.config.providers!.paystack!.secretKey)
            .update(JSON.stringify(req.body))
            .digest("hex")

          if (hash === req.headers["x-paystack-signature"]) {
            this.logger.info("Paystack webhook received:", req.body)
            this.handleWebhookEvent("paystack", req.body)
            res.status(200).send("OK")
          } else {
            res.status(400).send("Invalid signature")
          }
        } catch (error) {
          this.logger.error("Paystack webhook error:", error)
          res.status(500).send("Webhook error")
        }
      })
    }
  }

  private handleWebhookEvent(provider: string, event: any): void {
    // Emit events for application to handle
    switch (provider) {
      case "razorpay":
        if (event.event === "payment.captured") {
          this.emit("payment.success", { provider, data: event })
        } else if (event.event === "payment.failed") {
          this.emit("payment.failed", { provider, data: event })
        }
        break

      case "stripe":
        if (event.type === "payment_intent.succeeded") {
          this.emit("payment.success", { provider, data: event })
        } else if (event.type === "payment_intent.payment_failed") {
          this.emit("payment.failed", { provider, data: event })
        }
        break

      case "paystack":
        if (event.event === "charge.success") {
          this.emit("payment.success", { provider, data: event })
        }
        break
    }
  }

  private eventHandlers: Map<string, Function[]> = new Map()

  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  public healthCheck(): boolean {
    return true
  }

  public getRoutes(): Router {
    return this.router
  }
}
