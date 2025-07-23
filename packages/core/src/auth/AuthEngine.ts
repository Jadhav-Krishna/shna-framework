import { Router } from "express"
import passport from "passport"
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { Strategy as GitHubStrategy } from "passport-github2"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { z } from "zod"
import admin from "firebase-admin"
import { AuthenticationClient, ManagementClient } from "auth0"
import type { AuthConfig, User, JWTPayload } from "../types"
import type { Logger } from "../utils/Logger"

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
})

export class AuthEngine {
  private router: Router
  private config: AuthConfig
  private logger: Logger
  private users: Map<string, User> = new Map()
  private firebaseApp?: admin.app.App
  private auth0Client?: AuthenticationClient
  private auth0Management?: ManagementClient

  constructor(config: AuthConfig, logger: Logger) {
    this.config = config
    this.logger = logger
    this.router = Router()

    this.initializeProviders()
    this.setupStrategies()
    this.setupRoutes()
  }

  private initializeProviders(): void {
    // Initialize Firebase Admin if configured
    if (this.config.provider === "firebase" && this.config.firebase) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.config.firebase.projectId,
          privateKey: this.config.firebase.privateKey.replace(/\\n/g, "\n"),
          clientEmail: this.config.firebase.clientEmail,
        }),
      })
    }

    // Initialize Auth0 if configured
    if (this.config.provider === "auth0" && this.config.auth0) {
      this.auth0Client = new AuthenticationClient({
        domain: this.config.auth0.domain,
        clientId: this.config.auth0.clientId,
        clientSecret: this.config.auth0.clientSecret,
      })

      this.auth0Management = new ManagementClient({
        domain: this.config.auth0.domain,
        clientId: this.config.auth0.clientId,
        clientSecret: this.config.auth0.clientSecret,
      })
    }
  }

  private setupStrategies(): void {
    // JWT Strategy
    if (this.config.provider === "jwt" && this.config.jwt) {
      passport.use(
        new JwtStrategy(
          {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: this.config.jwt.secret,
          },
          async (payload: JWTPayload, done) => {
            try {
              const user = this.users.get(payload.userId)
              if (user) {
                return done(null, user)
              }
              return done(null, false)
            } catch (error) {
              return done(error, false)
            }
          },
        ),
      )
    }

    // Firebase Strategy
    if (this.config.provider === "firebase") {
      passport.use("firebase", {
        authenticate: async (req: any, options: any) => {
          try {
            const token = req.headers.authorization?.replace("Bearer ", "")
            if (!token) return options.fail("No token provided")

            const decodedToken = await admin.auth().verifyIdToken(token)
            const user: User = {
              id: decodedToken.uid,
              email: decodedToken.email || "",
              name: decodedToken.name,
              provider: "firebase",
              roles: decodedToken.roles || ["user"],
              createdAt: new Date(),
              updatedAt: new Date(),
            }

            return options.success(user)
          } catch (error) {
            return options.fail("Invalid Firebase token")
          }
        },
      } as any)
    }

    // OAuth Strategies
    if (this.config.oauth?.google) {
      passport.use(
        new GoogleStrategy(
          {
            clientID: this.config.oauth.google.clientId,
            clientSecret: this.config.oauth.google.clientSecret,
            callbackURL: "/auth/google/callback",
          },
          async (accessToken, refreshToken, profile, done) => {
            try {
              const user: User = {
                id: profile.id,
                email: profile.emails?.[0]?.value || "",
                name: profile.displayName,
                provider: "google",
                roles: ["user"],
                createdAt: new Date(),
                updatedAt: new Date(),
              }

              this.users.set(user.id, user)
              return done(null, user)
            } catch (error) {
              return done(error, null)
            }
          },
        ),
      )
    }

    if (this.config.oauth?.github) {
      passport.use(
        new GitHubStrategy(
          {
            clientID: this.config.oauth.github.clientId,
            clientSecret: this.config.oauth.github.clientSecret,
            callbackURL: "/auth/github/callback",
          },
          async (accessToken, refreshToken, profile, done) => {
            try {
              const user: User = {
                id: profile.id,
                email: profile.emails?.[0]?.value || "",
                name: profile.displayName || profile.username,
                provider: "github",
                roles: ["user"],
                createdAt: new Date(),
                updatedAt: new Date(),
              }

              this.users.set(user.id, user)
              return done(null, user)
            } catch (error) {
              return done(error, null)
            }
          },
        ),
      )
    }
  }

  private setupRoutes(): void {
    // Local authentication (JWT only)
    if (this.config.provider === "jwt") {
      this.router.post("/register", async (req, res) => {
        try {
          const { email, password, name } = RegisterSchema.parse(req.body)

          const existingUser = Array.from(this.users.values()).find((u) => u.email === email)
          if (existingUser) {
            return res.status(400).json({ error: "User already exists" })
          }

          const hashedPassword = await bcrypt.hash(password, 12)

          const user: User = {
            id: Date.now().toString(),
            email,
            name,
            roles: ["user"],
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          this.users.set(user.id, { ...user, password: hashedPassword } as any)

          const token = this.generateToken(user)

          res.status(201).json({
            user: { ...user },
            token,
            refreshToken: this.generateRefreshToken(user),
          })
        } catch (error) {
          this.logger.error("Registration error:", error)
          res.status(400).json({ error: "Invalid registration data" })
        }
      })

      this.router.post("/login", async (req, res) => {
        try {
          const { email, password } = LoginSchema.parse(req.body)

          const user = Array.from(this.users.values()).find((u) => u.email === email) as any
          if (!user || !user.password) {
            return res.status(401).json({ error: "Invalid credentials" })
          }

          const isValid = await bcrypt.compare(password, user.password)
          if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" })
          }

          const token = this.generateToken(user)
          const refreshToken = this.generateRefreshToken(user)

          res.json({
            user: { ...user, password: undefined },
            token,
            refreshToken,
          })
        } catch (error) {
          this.logger.error("Login error:", error)
          res.status(400).json({ error: "Invalid login data" })
        }
      })
    }

    // Auth0 routes
    if (this.config.provider === "auth0") {
      this.router.post("/auth0/login", async (req, res) => {
        try {
          const { email, password } = req.body

          if (!this.auth0Client) {
            return res.status(500).json({ error: "Auth0 not configured" })
          }

          const result = await this.auth0Client.passwordGrant({
            username: email,
            password,
            audience: this.config.auth0!.audience,
          })

          res.json({
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            expiresIn: result.expires_in,
          })
        } catch (error) {
          this.logger.error("Auth0 login error:", error)
          res.status(401).json({ error: "Authentication failed" })
        }
      })
    }

    // Token refresh
    this.router.post("/refresh", (req, res) => {
      try {
        const { refreshToken } = req.body
        if (!refreshToken) {
          return res.status(401).json({ error: "Refresh token required" })
        }

        if (this.config.provider === "jwt" && this.config.jwt) {
          const decoded = jwt.verify(refreshToken, this.config.jwt.secret) as JWTPayload
          const user = this.users.get(decoded.userId)

          if (!user) {
            return res.status(401).json({ error: "Invalid refresh token" })
          }

          const newToken = this.generateToken(user)
          res.json({ token: newToken })
        }
      } catch (error) {
        res.status(401).json({ error: "Invalid refresh token" })
      }
    })

    // OAuth routes
    if (this.config.oauth?.google) {
      this.router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
      this.router.get("/google/callback", passport.authenticate("google", { session: false }), (req, res) => {
        const user = req.user as User
        const token = this.generateToken(user)
        res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}?token=${token}`)
      })
    }

    if (this.config.oauth?.github) {
      this.router.get("/github", passport.authenticate("github", { scope: ["user:email"] }))
      this.router.get("/github/callback", passport.authenticate("github", { session: false }), (req, res) => {
        const user = req.user as User
        const token = this.generateToken(user)
        res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}?token=${token}`)
      })
    }

    // Protected route
    this.router.get("/me", this.authenticate(), (req, res) => {
      res.json({ user: req.user })
    })
  }

  private generateToken(user: User): string {
    if (this.config.provider !== "jwt" || !this.config.jwt) {
      throw new Error("JWT not configured")
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    }

    return jwt.sign(payload, this.config.jwt.secret, {
      expiresIn: this.config.jwt.expiresIn || "1h",
    })
  }

  private generateRefreshToken(user: User): string {
    if (this.config.provider !== "jwt" || !this.config.jwt) {
      throw new Error("JWT not configured")
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
    }

    return jwt.sign(payload, this.config.jwt.secret, {
      expiresIn: this.config.jwt.refreshExpiresIn || "7d",
    })
  }

  public authenticate() {
    switch (this.config.provider) {
      case "jwt":
        return passport.authenticate("jwt", { session: false })
      case "firebase":
        return passport.authenticate("firebase", { session: false })
      case "auth0":
        return (req: any, res: any, next: any) => {
          // Auth0 token verification logic
          next()
        }
      default:
        throw new Error(`Unsupported auth provider: ${this.config.provider}`)
    }
  }

  public authorize(roles: string[] = [], permissions: string[] = []) {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" })
      }

      // Check roles
      if (roles.length > 0 && !roles.some((role) => req.user.roles?.includes(role))) {
        return res.status(403).json({ error: "Insufficient role permissions" })
      }

      // Check permissions
      if (permissions.length > 0 && !permissions.some((perm) => req.user.permissions?.includes(perm))) {
        return res.status(403).json({ error: "Insufficient permissions" })
      }

      next()
    }
  }

  public initialize() {
    return passport.initialize()
  }

  public healthCheck(): boolean {
    return true
  }

  public getRoutes(): Router {
    return this.router
  }
}
