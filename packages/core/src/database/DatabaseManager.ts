import mongoose from "mongoose"
import { Pool as PgPool } from "pg"
import mysql from "mysql2/promise"
import type { DatabaseConfig } from "../types"
import type { Logger } from "../utils/Logger"

export class DatabaseManager {
  private config: DatabaseConfig
  private logger: Logger
  private connection: any
  private pgPool?: PgPool
  private mysqlPool?: mysql.Pool

  constructor(config: DatabaseConfig, logger: Logger) {
    this.config = config
    this.logger = logger
  }

  public async connect(): Promise<void> {
    try {
      switch (this.config.type) {
        case "mongodb":
          await this.connectMongoDB()
          break
        case "postgresql":
          await this.connectPostgreSQL()
          break
        case "mysql":
          await this.connectMySQL()
          break
        case "firebase":
          await this.connectFirebase()
          break
        default:
          throw new Error(`Unsupported database type: ${this.config.type}`)
      }

      this.logger.info(`✅ Database connected: ${this.config.type}`)
    } catch (error) {
      this.logger.error("Database connection failed:", error)
      throw error
    }
  }

  private async connectMongoDB(): Promise<void> {
    const options = {
      maxPoolSize: this.config.poolSize || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      ssl: this.config.ssl,
      ...this.config.options,
    }

    this.connection = await mongoose.connect(this.config.uri, options)

    mongoose.connection.on("error", (error) => {
      this.logger.error("MongoDB connection error:", error)
    })

    mongoose.connection.on("disconnected", () => {
      this.logger.warn("MongoDB disconnected")
    })
  }

  private async connectPostgreSQL(): Promise<void> {
    this.pgPool = new PgPool({
      connectionString: this.config.uri,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: this.config.poolSize || 10,
      ...this.config.options,
    })

    // Test connection
    const client = await this.pgPool.connect()
    await client.query("SELECT NOW()")
    client.release()

    this.connection = this.pgPool
  }

  private async connectMySQL(): Promise<void> {
    this.mysqlPool = mysql.createPool({
      uri: this.config.uri,
      ssl: this.config.ssl ? {} : false,
      connectionLimit: this.config.poolSize || 10,
      ...this.config.options,
    })

    // Test connection
    const connection = await this.mysqlPool.getConnection()
    await connection.execute("SELECT 1")
    connection.release()

    this.connection = this.mysqlPool
  }

  private async connectFirebase(): Promise<void> {
    // Firebase connection is handled in AuthEngine
    this.logger.info("Firebase Firestore initialized")
  }

  public async disconnect(): Promise<void> {
    try {
      switch (this.config.type) {
        case "mongodb":
          if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect()
          }
          break
        case "postgresql":
          if (this.pgPool) {
            await this.pgPool.end()
          }
          break
        case "mysql":
          if (this.mysqlPool) {
            await this.mysqlPool.end()
          }
          break
        case "firebase":
          // Firebase doesn't need explicit disconnection
          break
      }
      this.logger.info("Database disconnected")
    } catch (error) {
      this.logger.error("Database disconnection error:", error)
    }
  }

  public getConnection(): any {
    return this.connection
  }

  // Query methods for different databases
  public async query(sql: string, params: any[] = []): Promise<any> {
    switch (this.config.type) {
      case "postgresql":
        if (!this.pgPool) throw new Error("PostgreSQL not connected")
        const pgResult = await this.pgPool.query(sql, params)
        return pgResult.rows

      case "mysql":
        if (!this.mysqlPool) throw new Error("MySQL not connected")
        const [mysqlRows] = await this.mysqlPool.execute(sql, params)
        return mysqlRows

      default:
        throw new Error(`Query method not supported for ${this.config.type}`)
    }
  }

  // MongoDB specific methods
  public createModel(name: string, schema: any): any {
    if (this.config.type !== "mongodb") {
      throw new Error("Models only supported for MongoDB")
    }
    return mongoose.model(name, schema)
  }

  public async transaction(callback: (session: any) => Promise<any>): Promise<any> {
    switch (this.config.type) {
      case "mongodb":
        const session = await mongoose.startSession()
        try {
          return await session.withTransaction(callback)
        } finally {
          await session.endSession()
        }

      case "postgresql":
        if (!this.pgPool) throw new Error("PostgreSQL not connected")
        const client = await this.pgPool.connect()
        try {
          await client.query("BEGIN")
          const result = await callback(client)
          await client.query("COMMIT")
          return result
        } catch (error) {
          await client.query("ROLLBACK")
          throw error
        } finally {
          client.release()
        }

      case "mysql":
        if (!this.mysqlPool) throw new Error("MySQL not connected")
        const connection = await this.mysqlPool.getConnection()
        try {
          await connection.beginTransaction()
          const result = await callback(connection)
          await connection.commit()
          return result
        } catch (error) {
          await connection.rollback()
          throw error
        } finally {
          connection.release()
        }

      default:
        throw new Error(`Transactions not supported for ${this.config.type}`)
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      switch (this.config.type) {
        case "mongodb":
          return mongoose.connection.readyState === 1
        case "postgresql":
          if (!this.pgPool) return false
          const client = await this.pgPool.connect()
          await client.query("SELECT 1")
          client.release()
          return true
        case "mysql":
          if (!this.mysqlPool) return false
          const connection = await this.mysqlPool.getConnection()
          await connection.execute("SELECT 1")
          connection.release()
          return true
        case "firebase":
          return true
        default:
          return false
      }
    } catch (error) {
      this.logger.error("Database health check failed:", error)
      return false
    }
  }
}
