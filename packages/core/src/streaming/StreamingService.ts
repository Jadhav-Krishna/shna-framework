import { Router } from "express"
import multer from "multer"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import path from "path"
import fs from "fs-extra"
import { v4 as uuidv4 } from "uuid"
import type { StreamingConfig, MediaConfig, Video } from "../types"
import type { Logger } from "../utils/Logger"

// Set FFmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

export class StreamingService {
  private router: Router
  private config: StreamingConfig
  private mediaConfig: MediaConfig
  private logger: Logger
  private upload: multer.Multer
  private videos: Map<string, Video> = new Map()
  private processingQueue: string[] = []

  constructor(config: StreamingConfig, mediaConfig: MediaConfig, logger: Logger) {
    this.config = config
    this.mediaConfig = mediaConfig
    this.logger = logger
    this.router = Router()

    this.setupMulter()
    this.setupRoutes()
  }

  public async initialize(): Promise<void> {
    // Ensure directories exist
    if (this.config.storage) {
      await fs.ensureDir(this.config.storage.videosPath)
      await fs.ensureDir(this.config.storage.chunksPath)
    }

    this.logger.info("🎬 Streaming service initialized")
  }

  private setupMulter(): void {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.config.storage?.videosPath || "./uploads/videos")
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`
        cb(null, uniqueName)
      },
    })

    this.upload = multer({
      storage,
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          "video/mp4",
          "video/avi",
          "video/mov",
          "video/wmv",
          "video/flv",
          "video/webm",
          "video/mkv",
        ]

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new Error("Invalid video format"))
        }
      },
    })
  }

  private setupRoutes(): void {
    // Upload video
    this.router.post("/upload", this.upload.single("video"), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No video file provided" })
        }

        const { title, description } = req.body
        const userId = req.user?.id || "anonymous"

        const video: Video = {
          id: uuidv4(),
          title: title || req.file.originalname,
          description,
          userId,
          filename: req.file.filename,
          originalUrl: `/streaming/videos/${req.file.filename}`,
          size: req.file.size,
          status: "uploading",
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        this.videos.set(video.id, video)

        // Start processing
        this.processVideo(video.id)

        res.status(201).json({
          success: true,
          video: {
            id: video.id,
            title: video.title,
            status: video.status,
            originalUrl: video.originalUrl,
          },
        })
      } catch (error) {
        this.logger.error("Video upload failed:", error)
        res.status(500).json({ error: "Video upload failed" })
      }
    })

    // Get video info
    this.router.get("/videos/:id", (req, res) => {
      const { id } = req.params
      const video = this.videos.get(id)

      if (!video) {
        return res.status(404).json({ error: "Video not found" })
      }

      res.json({ video })
    })

    // List videos
    this.router.get("/videos", (req, res) => {
      const { userId, status, page = 1, limit = 10 } = req.query

      let videos = Array.from(this.videos.values())

      // Filter by userId
      if (userId) {
        videos = videos.filter((v) => v.userId === userId)
      }

      // Filter by status
      if (status) {
        videos = videos.filter((v) => v.status === status)
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit)
      const endIndex = startIndex + Number(limit)
      const paginatedVideos = videos.slice(startIndex, endIndex)

      res.json({
        videos: paginatedVideos,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: videos.length,
          pages: Math.ceil(videos.length / Number(limit)),
        },
      })
    })

    // Stream video (HLS)
    this.router.get("/stream/:id/playlist.m3u8", (req, res) => {
      const { id } = req.params
      const video = this.videos.get(id)

      if (!video || video.status !== "ready") {
        return res.status(404).json({ error: "Video not ready for streaming" })
      }

      const playlistPath = path.join(this.config.storage?.chunksPath || "./uploads/chunks", id, "playlist.m3u8")

      if (!fs.existsSync(playlistPath)) {
        return res.status(404).json({ error: "Playlist not found" })
      }

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl")
      res.sendFile(path.resolve(playlistPath))
    })

    // Stream video segments
    this.router.get("/stream/:id/:segment", (req, res) => {
      const { id, segment } = req.params
      const video = this.videos.get(id)

      if (!video || video.status !== "ready") {
        return res.status(404).json({ error: "Video not ready for streaming" })
      }

      const segmentPath = path.join(this.config.storage?.chunksPath || "./uploads/chunks", id, segment)

      if (!fs.existsSync(segmentPath)) {
        return res.status(404).json({ error: "Segment not found" })
      }

      res.setHeader("Content-Type", "video/MP2T")
      res.sendFile(path.resolve(segmentPath))
    })

    // Get video thumbnail
    this.router.get("/thumbnails/:id", (req, res) => {
      const { id } = req.params
      const video = this.videos.get(id)

      if (!video) {
        return res.status(404).json({ error: "Video not found" })
      }

      const thumbnailPath = path.join(this.config.storage?.videosPath || "./uploads/videos", `${id}-thumbnail.jpg`)

      if (!fs.existsSync(thumbnailPath)) {
        return res.status(404).json({ error: "Thumbnail not found" })
      }

      res.setHeader("Content-Type", "image/jpeg")
      res.sendFile(path.resolve(thumbnailPath))
    })

    // Delete video
    this.router.delete("/videos/:id", async (req, res) => {
      try {
        const { id } = req.params
        const video = this.videos.get(id)

        if (!video) {
          return res.status(404).json({ error: "Video not found" })
        }

        // Delete files
        await this.deleteVideoFiles(video)

        // Remove from memory
        this.videos.delete(id)

        res.json({ success: true, message: "Video deleted successfully" })
      } catch (error) {
        this.logger.error("Video deletion failed:", error)
        res.status(500).json({ error: "Failed to delete video" })
      }
    })
  }

  private async processVideo(videoId: string): Promise<void> {
    const video = this.videos.get(videoId)
    if (!video) return

    try {
      // Update status
      video.status = "processing"
      video.updatedAt = new Date()
      this.videos.set(videoId, video)

      const inputPath = path.join(this.config.storage?.videosPath || "./uploads/videos", video.filename)

      const outputDir = path.join(this.config.storage?.chunksPath || "./uploads/chunks", videoId)

      await fs.ensureDir(outputDir)

      // Generate thumbnail
      await this.generateThumbnail(inputPath, videoId)

      // Get video metadata
      const metadata = await this.getVideoMetadata(inputPath)
      video.duration = metadata.duration

      // Generate HLS streams
      if (this.config.formats?.includes("hls")) {
        await this.generateHLS(inputPath, outputDir, videoId)
      }

      // Update video status
      video.status = "ready"
      video.streamingUrls = {
        hls: `/streaming/stream/${videoId}/playlist.m3u8`,
      }
      video.thumbnailUrl = `/streaming/thumbnails/${videoId}`
      video.updatedAt = new Date()

      this.videos.set(videoId, video)

      this.logger.info(`Video processing completed: ${videoId}`)
    } catch (error) {
      this.logger.error(`Video processing failed for ${videoId}:`, error)

      // Update status to error
      video.status = "error"
      video.updatedAt = new Date()
      this.videos.set(videoId, video)
    }
  }

  private async generateThumbnail(inputPath: string, videoId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const thumbnailPath = path.join(this.config.storage?.videosPath || "./uploads/videos", `${videoId}-thumbnail.jpg`)

      ffmpeg(inputPath)
        .screenshots({
          timestamps: ["10%"],
          filename: `${videoId}-thumbnail.jpg`,
          folder: this.config.storage?.videosPath || "./uploads/videos",
          size: "320x240",
        })
        .on("end", () => resolve())
        .on("error", reject)
    })
  }

  private async getVideoMetadata(inputPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err)
        else
          resolve({
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitrate: metadata.format.bit_rate,
          })
      })
    })
  }

  private async generateHLS(inputPath: string, outputDir: string, videoId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const qualities = this.config.qualities || ["720p", "480p", "360p"]

      let command = ffmpeg(inputPath).outputOptions([
        "-c:v libx264",
        "-c:a aac",
        "-hls_time 10",
        "-hls_playlist_type vod",
        "-hls_segment_filename",
        path.join(outputDir, "segment_%03d.ts"),
        "-start_number 0",
      ])

      // Add multiple quality outputs
      qualities.forEach((quality, index) => {
        const resolution = this.getResolution(quality)
        const bitrate = this.getBitrate(quality)

        command = command
          .output(path.join(outputDir, `${quality}.m3u8`))
          .outputOptions([`-s ${resolution}`, `-b:v ${bitrate}`, "-f hls"])
      })

      // Generate master playlist
      command
        .output(path.join(outputDir, "playlist.m3u8"))
        .outputOptions(["-f hls", "-hls_segment_type mpegts", "-hls_flags independent_segments"])
        .on("end", () => {
          this.generateMasterPlaylist(outputDir, qualities)
          resolve()
        })
        .on("error", reject)
        .run()
    })
  }

  private getResolution(quality: string): string {
    const resolutions: Record<string, string> = {
      "240p": "426x240",
      "360p": "640x360",
      "480p": "854x480",
      "720p": "1280x720",
      "1080p": "1920x1080",
    }
    return resolutions[quality] || "640x360"
  }

  private getBitrate(quality: string): string {
    const bitrates: Record<string, string> = {
      "240p": "400k",
      "360p": "800k",
      "480p": "1200k",
      "720p": "2500k",
      "1080p": "5000k",
    }
    return bitrates[quality] || "800k"
  }

  private generateMasterPlaylist(outputDir: string, qualities: string[]): void {
    let masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3\n\n"

    qualities.forEach((quality) => {
      const bandwidth = this.getBandwidth(quality)
      const resolution = this.getResolution(quality)

      masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n`
      masterPlaylist += `${quality}.m3u8\n\n`
    })

    fs.writeFileSync(path.join(outputDir, "playlist.m3u8"), masterPlaylist)
  }

  private getBandwidth(quality: string): number {
    const bandwidths: Record<string, number> = {
      "240p": 500000,
      "360p": 1000000,
      "480p": 1500000,
      "720p": 3000000,
      "1080p": 6000000,
    }
    return bandwidths[quality] || 1000000
  }

  private async deleteVideoFiles(video: Video): Promise<void> {
    try {
      // Delete original video
      const originalPath = path.join(this.config.storage?.videosPath || "./uploads/videos", video.filename)
      if (fs.existsSync(originalPath)) {
        await fs.remove(originalPath)
      }

      // Delete thumbnail
      const thumbnailPath = path.join(
        this.config.storage?.videosPath || "./uploads/videos",
        `${video.id}-thumbnail.jpg`,
      )
      if (fs.existsSync(thumbnailPath)) {
        await fs.remove(thumbnailPath)
      }

      // Delete streaming chunks
      const chunksDir = path.join(this.config.storage?.chunksPath || "./uploads/chunks", video.id)
      if (fs.existsSync(chunksDir)) {
        await fs.remove(chunksDir)
      }
    } catch (error) {
      this.logger.error(`Failed to delete video files for ${video.id}:`, error)
    }
  }

  public getRoutes(): Router {
    return this.router
  }
}
