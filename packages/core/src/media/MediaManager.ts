import { Router } from "express"
import multer from "multer"
import { v2 as cloudinary } from "cloudinary"
import AWS from "aws-sdk"
import path from "path"
import fs from "fs-extra"
import type { MediaConfig } from "../types"
import type { Logger } from "../utils/Logger"
import type { Express } from "express"

export class MediaManager {
  private router: Router
  private config: MediaConfig
  private logger: Logger
  private upload: multer.Multer
  private s3?: AWS.S3

  constructor(config: MediaConfig, logger: Logger) {
    this.config = config
    this.logger = logger
    this.router = Router()

    this.initializeProviders()
    this.setupMulter()
    this.setupRoutes()
  }

  private initializeProviders(): void {
    switch (this.config.provider) {
      case "cloudinary":
        if (this.config.cloudinary) {
          cloudinary.config({
            cloud_name: this.config.cloudinary.cloudName,
            api_key: this.config.cloudinary.apiKey,
            api_secret: this.config.cloudinary.apiSecret,
          })
        }
        break

      case "aws-s3":
        if (this.config.aws) {
          AWS.config.update({
            accessKeyId: this.config.aws.accessKeyId,
            secretAccessKey: this.config.aws.secretAccessKey,
            region: this.config.aws.region,
          })
          this.s3 = new AWS.S3()
        }
        break

      case "local":
        if (this.config.local) {
          // Ensure upload directory exists
          fs.ensureDirSync(this.config.local.uploadPath)
        }
        break
    }
  }

  private setupMulter(): void {
    let storage: multer.StorageEngine

    if (this.config.provider === "local" && this.config.local) {
      storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.config.local!.uploadPath)
        },
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
          cb(null, uniqueName)
        },
      })
    } else {
      storage = multer.memoryStorage()
    }

    this.upload = multer({
      storage,
      limits: {
        fileSize: this.config.upload?.maxSize || 10 * 1024 * 1024, // 10MB default
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = this.config.upload?.allowedTypes || [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "video/mp4",
          "video/avi",
          "video/mov",
          "application/pdf",
          "text/plain",
        ]

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new Error("File type not allowed"))
        }
      },
    })
  }

  private setupRoutes(): void {
    // Upload single file
    this.router.post("/upload", this.upload.single("file"), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" })
        }

        let result: any

        switch (this.config.provider) {
          case "cloudinary":
            result = await this.uploadToCloudinary(req.file)
            break
          case "aws-s3":
            result = await this.uploadToS3(req.file)
            break
          case "local":
            result = await this.uploadToLocal(req.file)
            break
          default:
            throw new Error(`Unsupported provider: ${this.config.provider}`)
        }

        res.json({
          success: true,
          file: result,
        })
      } catch (error) {
        this.logger.error("File upload failed:", error)
        res.status(500).json({ error: "File upload failed" })
      }
    })

    // Upload multiple files
    this.router.post("/upload-multiple", this.upload.array("files", 10), async (req, res) => {
      try {
        const files = req.files as Express.Multer.File[]

        if (!files || files.length === 0) {
          return res.status(400).json({ error: "No files provided" })
        }

        const uploadPromises = files.map((file) => {
          switch (this.config.provider) {
            case "cloudinary":
              return this.uploadToCloudinary(file)
            case "aws-s3":
              return this.uploadToS3(file)
            case "local":
              return this.uploadToLocal(file)
            default:
              throw new Error(`Unsupported provider: ${this.config.provider}`)
          }
        })

        const results = await Promise.all(uploadPromises)

        res.json({
          success: true,
          files: results,
        })
      } catch (error) {
        this.logger.error("Multiple file upload failed:", error)
        res.status(500).json({ error: "File upload failed" })
      }
    })

    // Delete file
    this.router.delete("/delete/:id", async (req, res) => {
      try {
        const { id } = req.params

        switch (this.config.provider) {
          case "cloudinary":
            await cloudinary.uploader.destroy(id)
            break
          case "aws-s3":
            if (this.s3 && this.config.aws) {
              await this.s3
                .deleteObject({
                  Bucket: this.config.aws.bucket,
                  Key: id,
                })
                .promise()
            }
            break
          case "local":
            if (this.config.local) {
              const filePath = path.join(this.config.local.uploadPath, id)
              if (fs.existsSync(filePath)) {
                await fs.remove(filePath)
              }
            }
            break
        }

        res.json({
          success: true,
          message: "File deleted successfully",
        })
      } catch (error) {
        this.logger.error("File deletion failed:", error)
        res.status(500).json({ error: "File deletion failed" })
      }
    })

    // Get signed upload URL (for direct uploads)
    this.router.post("/signed-url", async (req, res) => {
      try {
        const { filename, contentType } = req.body

        let result: any

        switch (this.config.provider) {
          case "cloudinary":
            const timestamp = Math.round(new Date().getTime() / 1000)
            const signature = cloudinary.utils.api_sign_request(
              { timestamp, folder: "shna-uploads" },
              this.config.cloudinary!.apiSecret,
            )

            result = {
              signature,
              timestamp,
              cloudName: this.config.cloudinary!.cloudName,
              apiKey: this.config.cloudinary!.apiKey,
              folder: "shna-uploads",
            }
            break

          case "aws-s3":
            if (this.s3 && this.config.aws) {
              const key = `uploads/${Date.now()}-${filename}`
              const signedUrl = this.s3.getSignedUrl("putObject", {
                Bucket: this.config.aws.bucket,
                Key: key,
                ContentType: contentType,
                Expires: 3600, // 1 hour
              })

              result = {
                signedUrl,
                key,
                bucket: this.config.aws.bucket,
              }
            }
            break

          default:
            throw new Error(`Signed URLs not supported for ${this.config.provider}`)
        }

        res.json(result)
      } catch (error) {
        this.logger.error("Signed URL generation failed:", error)
        res.status(500).json({ error: "Failed to generate signed URL" })
      }
    })

    // Serve local files
    if (this.config.provider === "local" && this.config.local) {
      this.router.get("/files/:filename", (req, res) => {
        const { filename } = req.params
        const filePath = path.join(this.config.local!.uploadPath, filename)

        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: "File not found" })
        }

        res.sendFile(path.resolve(filePath))
      })
    }
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<any> {
    if (!this.config.cloudinary) {
      throw new Error("Cloudinary not configured")
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: "shna-uploads",
            transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
          },
          (error, result) => {
            if (error) reject(error)
            else
              resolve({
                id: result!.public_id,
                url: result!.secure_url,
                format: result!.format,
                size: result!.bytes,
                width: result!.width,
                height: result!.height,
                provider: "cloudinary",
              })
          },
        )
        .end(file.buffer)
    })
  }

  private async uploadToS3(file: Express.Multer.File): Promise<any> {
    if (!this.s3 || !this.config.aws) {
      throw new Error("AWS S3 not configured")
    }

    const key = `uploads/${Date.now()}-${file.originalname}`

    const result = await this.s3
      .upload({
        Bucket: this.config.aws.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      })
      .promise()

    return {
      id: key,
      url: result.Location,
      size: file.size,
      provider: "aws-s3",
    }
  }

  private async uploadToLocal(file: Express.Multer.File): Promise<any> {
    if (!this.config.local) {
      throw new Error("Local storage not configured")
    }

    // File is already saved by multer diskStorage
    const filename = (file as any).filename
    const url = `${this.config.local.publicPath}/${filename}`

    return {
      id: filename,
      url,
      size: file.size,
      provider: "local",
    }
  }

  public getRoutes(): Router {
    return this.router
  }
}
