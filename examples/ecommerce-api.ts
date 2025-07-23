import { Shna } from "shna"
import { z } from "zod"

const app = new Shna({
  auth: {
    jwt: { secret: process.env.JWT_SECRET! },
    rbac: { enabled: true, roles: ["customer", "admin"] },
  },
  database: {
    type: "mongodb",
    uri: process.env.DATABASE_URL!,
  },
  payments: {
    providers: {
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID!,
        keySecret: process.env.RAZORPAY_KEY_SECRET!,
      },
    },
  },
})

// Product schema
const ProductSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  category: z.string(),
  stock: z.number().int().min(0),
})

// Products API
app.get("/api/products", async (req, res) => {
  try {
    // Get products from database
    res.json({ products: [] })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" })
  }
})

app.post("/api/products", app.getAuth().authenticate(), app.getAuth().authorize(["admin"]), async (req, res) => {
  try {
    const product = ProductSchema.parse(req.body)
    // Save product to database
    res.status(201).json({ product })
  } catch (error) {
    res.status(400).json({ error: "Invalid product data" })
  }
})

// Orders API
app.post("/api/orders", app.getAuth().authenticate(), async (req, res) => {
  try {
    const { items, totalAmount } = req.body

    // Create payment order
    const paymentOrder = await app.getPayments().createOrder({
      amount: totalAmount,
      currency: "INR",
    })

    res.json({
      orderId: paymentOrder.orderId,
      amount: paymentOrder.amount,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" })
  }
})

app.start(3000)
