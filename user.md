# 🚀 Shna Framework Enhanced - The Ultimate Backend Solution
<p align="center">
  <img src="assets/shna-tk.png" alt="Image 1" width="200"/>
  <img src="assets/shna-tk-b.png" alt="Image 2" width="200"/>
</p>
<div align="center">

![Shna Framework](https://img.shields.io/badge/Shna-Framework-blue?style=for-the-badge&logo=node.js)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)

**Build enterprise-grade backend services in minutes, not months!**

*Zero boilerplate • Production ready • Highly scalable • Developer friendly*

</div>

---

## 🌟 **Why Choose Shna Framework?**

<table>
<tr>
<td width="50%">

### ⚡ **Lightning Fast Setup**
- **3 commands** to production-ready backend
- **50+ templates** for different use cases
- **Zero configuration** required to start

### 🔒 **Enterprise Security**
- Built-in authentication & authorization
- CSRF, XSS, and brute force protection
- Rate limiting and input validation

</td>
<td width="50%">

### 🎯 **Multi-Provider Support**
- **3 auth providers**: JWT, Firebase, Auth0
- **4 databases**: MongoDB, PostgreSQL, MySQL, Firebase
- **5 payment gateways**: Stripe, Razorpay, Paystack, PayPal

### 🎬 **Advanced Features**
- Video streaming with HLS/DASH
- Real-time communication
- File upload & media management

</td>
</tr>
</table>

---

## 🚀 **Quick Start Guide**

### **Step 1: Installation**

\`\`\`bash
# Install the CLI globally
npm install -g shna-cli

# Or use npx (recommended)
npx create-shna-app my-awesome-backend
\`\`\`

### **Step 2: Choose Your Template**

\`\`\`bash
# 🎬 Video Streaming Platform
npx create-shna-app my-streaming --template=video-streaming

# 🛒 E-commerce Backend
npx create-shna-app my-store --template=ecommerce

# 💬 Chat Application
npx create-shna-app my-chat --template=chat-app

# 💳 SaaS Billing Platform
npx create-shna-app my-saas --template=saas-billing

# 🔧 Basic API (Default)
npx create-shna-app my-api --template=basic
\`\`\`

### **Step 3: Configure & Launch**

\`\`\`bash
cd my-awesome-backend

# Copy environment template
cp .env.example .env

# Edit your configuration (see configuration guide below)
nano .env

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

### **🎉 That's it! Your backend is ready!**

\`\`\`
🚀 Shna Enhanced server running on port 3000
📊 Health check: http://localhost:3000/health
🎬 Streaming: Enabled
✅ Authentication: Ready
💳 Payments: Ready
📱 Real-time: Ready
\`\`\`

---

## 📋 **Template Showcase**

<details>
<summary><strong>🎬 Video Streaming Platform</strong></summary>

**Perfect for:** YouTube-like platforms, educational content, live streaming

**Features:**
- ✅ Video upload with automatic transcoding
- ✅ HLS/DASH streaming support
- ✅ Multiple quality options (240p to 4K)
- ✅ Real-time comments and likes
- ✅ Subscription management
- ✅ Analytics dashboard

**Quick Setup:**
\`\`\`bash
npx create-shna-app my-streaming --template=video-streaming
cd my-streaming
npm install && npm run dev
\`\`\`

**API Endpoints:**
- `POST /streaming/upload` - Upload videos
- `GET /streaming/videos/:id` - Get video info
- `GET /streaming/stream/:id/playlist.m3u8` - Stream video (HLS)
- `POST /api/subscriptions/create` - Create subscription

</details>

<details>
<summary><strong>🛒 E-commerce Backend</strong></summary>

**Perfect for:** Online stores, marketplaces, digital products

**Features:**
- ✅ Product catalog management
- ✅ Shopping cart & checkout
- ✅ Multiple payment gateways
- ✅ Order tracking
- ✅ Inventory management
- ✅ Customer reviews

**Quick Setup:**
\`\`\`bash
npx create-shna-app my-store --template=ecommerce
cd my-store
npm install && npm run dev
\`\`\`

</details>

<details>
<summary><strong>💬 Chat Application</strong></summary>

**Perfect for:** Messaging apps, customer support, team collaboration

**Features:**
- ✅ Real-time messaging
- ✅ Group chats & channels
- ✅ File sharing
- ✅ Message encryption
- ✅ Push notifications
- ✅ Online status

</details>

<details>
<summary><strong>💳 SaaS Billing Platform</strong></summary>

**Perfect for:** Subscription services, SaaS products, membership sites

**Features:**
- ✅ Subscription management
- ✅ Usage-based billing
- ✅ Invoice generation
- ✅ Payment retry logic
- ✅ Dunning management
- ✅ Analytics & reporting

</details>

---

## ⚙️ **Easy Configuration Guide**

### **🔧 Basic Configuration**

Create your `.env` file with these essential settings:

\`\`\`env
# 🗄️ Database (Choose one)
DATABASE_URL=mongodb://localhost:27017/myapp
# DATABASE_URL=postgresql://user:pass@localhost:5432/myapp
# DATABASE_URL=mysql://user:pass@localhost:3306/myapp

# 🔐 Authentication
JWT_SECRET=your-super-secret-key-here
AUTH_PROVIDER=jwt

# 🌐 Server
PORT=3000
NODE_ENV=development
\`\`\`

### **🎯 Advanced Configuration**

<details>
<summary><strong>🔐 Authentication Providers</strong></summary>

#### **JWT (Recommended for most apps)**
\`\`\`env
AUTH_PROVIDER=jwt
JWT_SECRET=your-super-secret-jwt-key
\`\`\`

#### **Firebase Auth (Google ecosystem)**
\`\`\`env
AUTH_PROVIDER=firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
\`\`\`

#### **Auth0 (Enterprise SSO)**
\`\`\`env
AUTH_PROVIDER=auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
\`\`\`

</details>

<details>
<summary><strong>💳 Payment Gateways</strong></summary>

#### **Stripe (Global)**
\`\`\`env
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
\`\`\`

#### **Razorpay (India)**
\`\`\`env
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
\`\`\`

#### **Paystack (Africa)**
\`\`\`env
PAYSTACK_SECRET_KEY=sk_test_your-paystack-secret
PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-public
\`\`\`

</details>

<details>
<summary><strong>📱 Real-time Communication</strong></summary>

#### **Socket.IO (Default)**
\`\`\`env
REALTIME_PROVIDER=socketio
\`\`\`

#### **Pusher (Managed service)**
\`\`\`env
REALTIME_PROVIDER=pusher
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=us2
\`\`\`

</details>

---

## 🛠️ **Customization & Extension Guide**

### **🎨 Creating Custom Routes**

\`\`\`javascript
const { Shna } = require('shna');
const app = new Shna();

// ✅ Simple route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Shna!' });
});

// ✅ Protected route
app.get('/api/profile', 
  app.getAuth().authenticate(),
  (req, res) => {
    res.json({ user: req.user });
  }
);

// ✅ Role-based route
app.post('/api/admin/users',
  app.getAuth().authenticate(),
  app.getAuth().authorize(['admin']),
  async (req, res) => {
    // Admin-only logic
  }
);
\`\`\`

### **🔌 Adding Custom Middleware**

\`\`\`javascript
// ✅ Global middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ✅ Route-specific middleware
const validateInput = (req, res, next) => {
  if (!req.body.email) {
    return res.status(400).json({ error: 'Email required' });
  }
  next();
};

app.post('/api/users', validateInput, (req, res) => {
  // Create user logic
});
\`\`\`

### **🗄️ Custom Database Models**

#### **MongoDB with Mongoose**
\`\`\`javascript
const mongoose = require('mongoose');

// Define schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Create model
const User = app.getDatabase().createModel('User', UserSchema);

// Use in routes
app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json({ users });
});
\`\`\`

#### **PostgreSQL/MySQL with Raw Queries**
\`\`\`javascript
// PostgreSQL
app.get('/api/users', async (req, res) => {
  const users = await app.getDatabase().query(
    'SELECT * FROM users WHERE active = $1',
    [true]
  );
  res.json({ users });
});

// MySQL
app.get('/api/users', async (req, res) => {
  const users = await app.getDatabase().query(
    'SELECT * FROM users WHERE active = ?',
    [true]
  );
  res.json({ users });
});
\`\`\`

### **🎬 Custom Video Processing**

\`\`\`javascript
// Custom video processing hook
app.getStreaming().on('video.uploaded', async (video) => {
  console.log('New video uploaded:', video.id);
  
  // Custom processing logic
  await generateCustomThumbnail(video);
  await extractVideoMetadata(video);
  await sendNotificationToSubscribers(video);
});

// Custom streaming quality
const app = new Shna({
  streaming: {
    enabled: true,
    qualities: ['4K', '1080p', '720p', '480p'], // Custom qualities
    formats: ['hls', 'dash'],
    transcoding: {
      enabled: true,
      concurrent: 5, // Process 5 videos simultaneously
      customOptions: {
        videoCodec: 'h264',
        audioCodec: 'aac',
        preset: 'fast'
      }
    }
  }
});
\`\`\`

### **💳 Custom Payment Logic**

\`\`\`javascript
// Handle payment success
app.getPayments().on('payment.success', async (data) => {
  const { provider, paymentData } = data;
  
  // Custom logic for successful payments
  await updateUserSubscription(paymentData.userId);
  await sendConfirmationEmail(paymentData.email);
  await logPaymentAnalytics(paymentData);
});

// Custom payment provider
app.post('/api/payments/custom-gateway', async (req, res) => {
  const { amount, currency, customData } = req.body;
  
  // Integrate with your custom payment gateway
  const result = await yourCustomPaymentGateway.createPayment({
    amount,
    currency,
    metadata: customData
  });
  
  res.json(result);
});
\`\`\`

---

## 🧪 **Development Workflow**

### **📁 Project Structure**

\`\`\`
my-shna-app/
├── 📁 src/
│   ├── 📄 index.ts          # Main application file
│   ├── 📁 routes/           # Custom routes
│   ├── 📁 models/           # Database models
│   ├── 📁 middleware/       # Custom middleware
│   ├── 📁 services/         # Business logic
│   └── 📁 utils/            # Helper functions
├── 📁 uploads/              # File uploads (local)
├── 📁 logs/                 # Application logs
├── 📄 .env                  # Environment variables
├── 📄 .env.example          # Environment template
├── 📄 package.json          # Dependencies
├── 📄 tsconfig.json         # TypeScript config
├── 📄 Dockerfile            # Docker configuration
└── 📄 docker-compose.yml    # Multi-service setup
\`\`\`

### **🔄 Development Commands**

\`\`\`bash
# 🚀 Development
npm run dev          # Start with hot reload
npm run dev:debug    # Start with debugging
npm run dev:watch    # Watch for file changes

# 🏗️ Building
npm run build        # Build for production
npm run build:clean  # Clean build directory first

# 🧪 Testing
npm test             # Run all tests
npm run test:unit    # Unit tests only
npm run test:e2e     # End-to-end tests
npm run test:watch   # Watch mode

# 📊 Code Quality
npm run lint         # Check code style
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier

# 📦 Production
npm start            # Start production server
npm run pm2:start    # Start with PM2
npm run docker:build # Build Docker image
\`\`\`

### **🧪 Testing Your Application**

#### **Unit Testing**
\`\`\`javascript
// tests/auth.test.js
const request = require('supertest');
const { Shna } = require('shna');

describe('Authentication', () => {
  let app;
  
  beforeAll(async () => {
    app = new Shna({
      database: { uri: process.env.TEST_DATABASE_URL }
    });
    await app.start(0); // Random port for testing
  });

  test('should register new user', async () => {
    const response = await request(app.server)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.token).toBeDefined();
  });
});
\`\`\`

#### **Integration Testing**
\`\`\`javascript
// tests/integration/payments.test.js
describe('Payment Integration', () => {
  test('should create Stripe payment', async () => {
    const response = await request(app.server)
      .post('/payments/create-order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 1000,
        currency: 'USD',
        provider: 'stripe'
      });

    expect(response.status).toBe(200);
    expect(response.body.clientSecret).toBeDefined();
  });
});
\`\`\`

### **📊 Performance Monitoring**

\`\`\`javascript
// Add performance monitoring
const app = new Shna({
  logging: {
    level: 'info',
    format: 'json',
    file: './logs/app.log'
  }
});

// Custom performance middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    app.getLogger().info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});
\`\`\`

---

## 🚀 **Deployment Guide**

### **🐳 Docker Deployment (Recommended)**

\`\`\`bash
# Build and run with Docker
docker build -t my-shna-app .
docker run -p 3000:3000 --env-file .env my-shna-app

# Or use Docker Compose
docker-compose up -d
\`\`\`

### **☁️ Cloud Deployment**

<details>
<summary><strong>🔷 Deploy to Heroku</strong></summary>

\`\`\`bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create my-shna-app

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set DATABASE_URL=your-db-url

# Deploy
git push heroku main

# Scale dynos
heroku ps:scale web=2
\`\`\`

</details>

<details>
<summary><strong>🟠 Deploy to AWS</strong></summary>

\`\`\`bash
# Using AWS ECS
aws ecs create-cluster --cluster-name shna-cluster

# Deploy with provided ECS task definition
aws ecs create-service --cli-input-json file://ecs-service.json
\`\`\`

</details>

<details>
<summary><strong>🔵 Deploy to DigitalOcean</strong></summary>

\`\`\`bash
# Using App Platform
doctl apps create --spec .do/app.yaml

# Or use Droplets with Docker
doctl compute droplet create shna-app \
  --image docker-20-04 \
  --size s-2vcpu-2gb \
  --region nyc1
\`\`\`

</details>

<details>
<summary><strong>⚡ Deploy to Vercel</strong></summary>

\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
\`\`\`

</details>

### **🔧 Production Optimization**

\`\`\`javascript
// Production configuration
const app = new Shna({
  // Enable clustering
  cluster: {
    enabled: process.env.NODE_ENV === 'production',
    workers: process.env.CLUSTER_WORKERS || 'auto'
  },
  
  // Database optimization
  database: {
    poolSize: 25,
    ssl: true,
    options: {
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000
    }
  },
  
  // Caching
  cache: {
    enabled: true,
    provider: 'redis',
    ttl: 3600 // 1 hour
  },
  
  // Rate limiting with Redis
  rateLimit: {
    enabled: true,
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    }
  }
});
\`\`\`

---

## 🛠️ **Advanced Customization**

### **🔌 Creating Custom Plugins**

\`\`\`javascript
// plugins/analytics.js
class AnalyticsPlugin {
  constructor(config) {
    this.config = config;
  }

  initialize(app) {
    // Add analytics middleware
    app.use(this.trackRequests.bind(this));
    
    // Add analytics routes
    app.use('/analytics', this.getRoutes());
  }

  trackRequests(req, res, next) {
    // Track request analytics
    this.recordEvent('request', {
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
    next();
  }

  getRoutes() {
    const router = require('express').Router();
    
    router.get('/stats', (req, res) => {
      res.json(this.getStats());
    });
    
    return router;
  }
}

// Use the plugin
const analyticsPlugin = new AnalyticsPlugin({
  trackingId: 'GA-XXXXXXXXX'
});

app.use(analyticsPlugin);
\`\`\`

### **🎨 Custom Themes & UI**

\`\`\`javascript
// Create admin dashboard
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Shna Admin Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #f5f5f5; padding: 20px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <h1>🚀 Shna Dashboard</h1>
      <div class="dashboard">
        <div class="card">
          <h3>📊 Analytics</h3>
          <p>Total Users: <strong id="userCount">Loading...</strong></p>
          <p>Total Videos: <strong id="videoCount">Loading...</strong></p>
        </div>
        <div class="card">
          <h3>💳 Revenue</h3>
          <p>This Month: <strong id="revenue">Loading...</strong></p>
        </div>
      </div>
      
      <script>
        // Load dashboard data
        fetch('/api/admin/stats')
          .then(res => res.json())
          .then(data => {
            document.getElementById('userCount').textContent = data.users;
            document.getElementById('videoCount').textContent = data.videos;
            document.getElementById('revenue').textContent = '$' + data.revenue;
          });
      </script>
    </body>
    </html>
  `);
});
\`\`\`

### **🔄 Custom Workflows**

\`\`\`javascript
// Custom video processing workflow
class VideoWorkflow {
  constructor(app) {
    this.app = app;
    this.setupWorkflow();
  }

  setupWorkflow() {
    // Step 1: Video uploaded
    this.app.getStreaming().on('video.uploaded', this.onVideoUploaded.bind(this));
    
    // Step 2: Processing complete
    this.app.getStreaming().on('video.processed', this.onVideoProcessed.bind(this));
    
    // Step 3: Ready for streaming
    this.app.getStreaming().on('video.ready', this.onVideoReady.bind(this));
  }

  async onVideoUploaded(video) {
    console.log('🎬 Video uploaded:', video.title);
    
    // Send notification to admin
    await this.app.getMessaging().sendEmail({
      to: 'admin@myapp.com',
      subject: 'New Video Uploaded',
      html: `<p>New video "${video.title}" has been uploaded by ${video.userId}</p>`
    });
  }

  async onVideoProcessed(video) {
    console.log('⚙️ Video processed:', video.title);
    
    // Update database
    await this.updateVideoStatus(video.id, 'processed');
  }

  async onVideoReady(video) {
    console.log('✅ Video ready:', video.title);
    
    // Notify subscribers
    await this.notifySubscribers(video);
    
    // Update search index
    await this.updateSearchIndex(video);
  }
}

// Initialize workflow
new VideoWorkflow(app);
\`\`\`

---

## 🔍 **Troubleshooting Guide**

### **❌ Common Issues & Solutions**

<details>
<summary><strong>🔴 Database Connection Failed</strong></summary>

**Problem:** `Database connection failed: MongoNetworkError`

**Solutions:**
\`\`\`bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check connection string
echo $DATABASE_URL

# Test connection manually
mongosh "mongodb://localhost:27017/myapp"

# For Docker users
docker-compose logs mongo
\`\`\`

</details>

<details>
<summary><strong>🟠 Authentication Not Working</strong></summary>

**Problem:** `Invalid JWT token` or `Authentication failed`

**Solutions:**
\`\`\`bash
# Verify JWT secret is set
echo $JWT_SECRET

# Check token format in requests
# Should be: Authorization: Bearer <token>

# For OAuth issues, verify credentials
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
\`\`\`

</details>

<details>
<summary><strong>🟡 Payment Integration Issues</strong></summary>

**Problem:** `Payment verification failed`

**Solutions:**
\`\`\`bash
# Test Stripe credentials
curl -u $STRIPE_SECRET_KEY: https://api.stripe.com/v1/charges

# Check webhook endpoints
curl -X POST http://localhost:3000/payments/webhook/stripe

# Verify webhook secrets match
echo $STRIPE_WEBHOOK_SECRET
\`\`\`

</details>

<details>
<summary><strong>🔵 Video Streaming Not Working</strong></summary>

**Problem:** `FFmpeg not found` or `Video processing failed`

**Solutions:**
\`\`\`bash
# Install FFmpeg
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Check FFmpeg installation
ffmpeg -version

# Verify upload directories exist
ls -la uploads/videos uploads/chunks
\`\`\`

</details>

### **🐛 Debug Mode**

\`\`\`bash
# Enable debug logging
DEBUG=shna:* npm run dev

# Or set in .env
LOG_LEVEL=debug

# Check logs
tail -f logs/app.log
\`\`\`

### **📊 Health Monitoring**

\`\`\`javascript
// Custom health checks
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    services: {
      database: await app.getDatabase().healthCheck(),
      redis: await checkRedisHealth(),
      storage: await checkStorageHealth(),
      external: await checkExternalServices()
    },
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };

  const isHealthy = Object.values(health.services).every(service => service === true);
  
  res.status(isHealthy ? 200 : 503).json(health);
});
\`\`\`

---

## 🎯 **Best Practices**

### **🔒 Security Best Practices**

\`\`\`javascript
// ✅ Input validation
const { z } = require('zod');

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  name: z.string().min(1).max(100)
});

app.post('/api/users', (req, res) => {
  try {
    const userData = CreateUserSchema.parse(req.body);
    // Safe to use userData
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
});

// ✅ Rate limiting per user
const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => req.user?.role === 'premium' ? 1000 : 100,
  keyGenerator: (req) => req.user?.id || req.ip
});

// ✅ Sanitize file uploads
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};
\`\`\`

### **⚡ Performance Best Practices**

\`\`\`javascript
// ✅ Database indexing
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

// ✅ Caching frequently accessed data
const cache = new Map();

app.get('/api/popular-videos', async (req, res) => {
  const cacheKey = 'popular-videos';
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  
  const videos = await getPopularVideos();
  cache.set(cacheKey, videos);
  
  // Cache for 5 minutes
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  
  res.json(videos);
});

// ✅ Pagination for large datasets
app.get('/api/videos', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const skip = (page - 1) * limit;
  
  const videos = await Video.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
    
  const total = await Video.countDocuments();
  
  res.json({
    videos,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
\`\`\`

### **🧪 Testing Best Practices**

\`\`\`javascript
// ✅ Test database setup
beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
  await seedTestData();
});

// ✅ Mock external services
jest.mock('stripe', () => ({
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret'
    })
  }
}));

// ✅ Test error scenarios
test('should handle payment failure', async () => {
  stripe.paymentIntents.create.mockRejectedValue(new Error('Card declined'));
  
  const response = await request(app.server)
    .post('/payments/create-order')
    .send({ amount: 1000 });
    
  expect(response.status).toBe(500);
  expect(response.body.error).toBe('Payment failed');
});
\`\`\`

---

## 🤝 **Contributing to Shna**

### **🎯 How to Contribute**

1. **🍴 Fork the repository**
2. **🌿 Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **💻 Make your changes**
4. **🧪 Add tests**: Ensure your code is well-tested
5. **📝 Update documentation**: Keep docs up to date
6. **🚀 Submit a pull request**

### **📋 Contribution Guidelines**

\`\`\`bash
# Setup development environment
git clone https://github.com/your-username/shna-framework.git
cd shna-framework

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev

# Build and test
npm run build
npm run test:e2e
\`\`\`

### **🐛 Reporting Issues**

When reporting issues, please include:
- **Environment details** (Node.js version, OS, etc.)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Error messages** and stack traces
- **Minimal code example** if possible

---

## 📚 **Resources & Community**

### **📖 Documentation**
- [📘 API Reference](https://shna.dev/docs/api)
- [🎥 Video Tutorials](https://shna.dev/tutorials)
- [📝 Blog & Updates](https://shna.dev/blog)
- [🔧 Migration Guide](https://shna.dev/docs/migration)

### **💬 Community**
- [💬 Discord Server](https://discord.gg/shna) - Real-time chat
- [📱 GitHub Discussions](https://github.com/shna-framework/shna/discussions) - Q&A
- [🐦 Twitter](https://twitter.com/shnaframework) - Updates & news
- [📺 YouTube Channel](https://youtube.com/shnaframework) - Tutorials

### **🆘 Support**
- [❓ Stack Overflow](https://stackoverflow.com/questions/tagged/shna-framework) - Technical questions
- [🐛 GitHub Issues](https://github.com/shna-framework/shna/issues) - Bug reports
- [📧 Email Support](mailto:support@shna.dev) - Direct support

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by the Shna (Krishna)**

[⭐ Star us on GitHub](https://github.com/shna-framework/shna) • [💬 Whatsapp](https://wa.me/8989655811)

</div>
