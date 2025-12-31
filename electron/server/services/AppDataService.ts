import * as path from 'path'
import * as fs from 'fs'
import { logger } from '../../logger'

/**
 * Service responsible for managing application data directories and initialization.
 * Handles first-run setup, directory creation, and environment validation.
 */
export class AppDataService {
  private appDataDir: string
  private firstRun: boolean

  constructor(userDataPath: string) {
    this.appDataDir = path.join(userDataPath, 'server-data')
    this.firstRun = !fs.existsSync(this.appDataDir)
  }

  /**
   * Get the application data directory path.
   */
  getAppDataDir(): string {
    return this.appDataDir
  }

  /**
   * Check if this is the first run of the application.
   */
  isFirstRun(): boolean {
    return this.firstRun
  }

  /**
   * Initialize the application data directory.
   * Creates the directory if it doesn't exist.
   */
  initialize(): void {
    if (!fs.existsSync(this.appDataDir)) {
      try {
        fs.mkdirSync(this.appDataDir, { recursive: true })
        logger.info(`Created app data directory: ${this.appDataDir}`)
      } catch (error) {
        logger.error('Failed to create app data directory:', error)
        throw new Error(`Failed to create app data directory at ${this.appDataDir}: ${error}`)
      }
    }
  }

  /**
   * Perform first-run initialization by copying required files and creating directories.
   */
  initializeFirstRun(serverDir: string): void {
    logger.info('Performing first-run initialization...')

    try {
      // Check for required files in the server directory before proceeding
      const requiredServerFiles = ['alembic.ini', 'logging_config.ini', '.env']
      for (const file of requiredServerFiles) {
        const filePath = path.join(serverDir, file)
        if (!fs.existsSync(filePath)) {
          throw new Error(`Required server file not found: ${filePath}`)
        }
      }

      // Check for required directories in the server directory
      const requiredServerDirs = ['alembic']
      for (const dir of requiredServerDirs) {
        const dirPath = path.join(serverDir, dir)
        if (!fs.existsSync(dirPath)) {
          throw new Error(`Required server directory not found: ${dirPath}`)
        }
      }

      // Create the app data directory if it doesn't exist
      if (!fs.existsSync(this.appDataDir)) {
        fs.mkdirSync(this.appDataDir, { recursive: true })
      }

      // Create required subdirectories in the app data directory
      const requiredDataDirs = ['db', 'logs', 'download']
      for (const dir of requiredDataDirs) {
        const dirPath = path.join(this.appDataDir, dir)
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true })
          logger.info(`Created directory: ${dirPath}`)
        }
      }

      // Copy .env file on first run (but don't update it later)
      const envFileSrc = path.join(serverDir, '.env')
      const envFileDest = path.join(this.appDataDir, '.env')
      fs.copyFileSync(envFileSrc, envFileDest)
      logger.info(`Copied .env file to: ${envFileDest}`)

      // Copy download directory if it exists in the server directory
      const downloadSrcDir = path.join(serverDir, 'download')
      const downloadDestDir = path.join(this.appDataDir, 'download')
      if (fs.existsSync(downloadSrcDir)) {
        try {
          this.copyDirectory(downloadSrcDir, downloadDestDir)
          logger.info(`Copied download directory contents to: ${downloadDestDir}`)
        } catch (copyError) {
          logger.warn(`Warning: Failed to copy download directory contents: ${copyError}`)
        }
      }

      logger.info('First-run initialization completed successfully')
    } catch (error) {
      logger.error('Error during first-run initialization:', error)
      throw new Error(`Failed to initialize app data: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Validate that all required files and directories exist.
   * Returns an array of error messages for any missing items.
   */
  validateEnvironment(serverDir: string, serverPath: string): string[] {
    const errors: string[] = []

    if (!fs.existsSync(serverPath)) {
      errors.push(`Server executable not found at: ${serverPath}`)
    }

    const requiredServerFiles = ['alembic.ini', 'logging_config.ini']
    for (const file of requiredServerFiles) {
      const filePath = path.join(serverDir, file)
      if (!fs.existsSync(filePath)) {
        errors.push(`Required server file not found: ${filePath}`)
      }
    }

    const requiredServerDirs = ['alembic']
    for (const dir of requiredServerDirs) {
      const dirPath = path.join(serverDir, dir)
      if (!fs.existsSync(dirPath)) {
        errors.push(`Required server directory not found: ${dirPath}`)
      }
    }

    const requiredDataDirs = ['logs', 'db', 'download']
    for (const dir of requiredDataDirs) {
      const dirPath = path.join(this.appDataDir, dir)
      if (!fs.existsSync(dirPath)) {
        errors.push(`Required data directory not found: ${dirPath}`)
      }
    }

    const envFilePath = path.join(this.appDataDir, '.env')
    if (!fs.existsSync(envFilePath)) {
      errors.push(`Required config file not found: ${envFilePath}`)
    }

    return errors
  }

  /**
   * Recursively copy a directory.
   */
  copyDirectory(sourceDir: string, destDir: string): void {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true })
    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name)
      const destPath = path.join(destDir, entry.name)
      if (entry.isDirectory()) {
        this.copyDirectory(sourcePath, destPath)
      } else {
        fs.copyFileSync(sourcePath, destPath)
      }
    }
  }
}
