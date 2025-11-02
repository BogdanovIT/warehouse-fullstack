import fs from 'fs/promises'
import path from 'path'

class FileService {
    constructor() {
        this.tempDir = '/home/abogdanov/Mobile_Storekeeper/temp_uploads'
        this.generateDir = '/home/abogdanov/Mobile_Storekeeper/generated'
    }
    async ensureDirectoryExists(dirPath) {
        try {
            await fs.access(dirPath)
        } catch {
            await fs.mkdir(dirPath, {recursive: true})
        }
    }
    async saveTempFile(fileBuffer, filename) {
        await this.ensureDirectoryExists(this.tempDir)
        const filePath = path.join(this.tempDir, filename)
        await fs.writeFile(filePath, fileBuffer)
        return filePath
    }
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath)
        } catch(error) {
            console.error(`Error deleting file ${filePath}:`, error)
        }
    }
    async cleanupOldFiles(maxAgeHours = 24) {
        const dirs = [this.tempDir, this.generateDir]
        const now = Date.now()
        const maxAge = maxAgeHours *60*60*1000
        for (const dir of dirs) {
            try {
                const files = await fs.readdir(dir)
                for (const file of files) {
                    const filePath = path.join(dir, file)
                    const stats = await fs.stat(filePath)
                    if (now - stats.mtimeMs > maxAge) {
                        await this.deleteFile(filePath)
                    }
                }
            } catch(error) {
                console.error(`Error cleaning up directory ${dir}:`, error)
            }
        }
    }
    async readFile(filePath) {
        try {
            return await fs.readFile(filePath)
        } catch(error) {
            console.error(`Error reading file ${filePath}`, error)
            throw error
        }
    }
    async fileExists(filePath) {
        try {
            await fs.access(filePath)
            return true
        } catch {
            return false
        }
    }
    async moveFile(oldPath, newPath) {
        try {
            await this.ensureDirectoryExists(path.dirname(newPath))
            await fs.rename(oldPath, newPath)
        } catch(error) {
            console.error(`Error moving file from ${oldPath} to ${newPath}:`, error)
            throw error
        }
    }
    async copyFile(sourcePath, destPath) {
        try {
            await this.ensureDirectoryExists(path.dirname(destPath))
            await fs.copyFile(sourcePath, destPath)
        } catch(error) {
            console.error(`Error copying file from ${sourcePath} to ${destPath}:`, error)
            throw error
        }
    }
    async getFileStats(filePath) {
        try {
            return await fs.stat(filePath)
        } catch(error) {
            console.error(`Error getting stats for file ${filePath}:`, error)
            throw error
        }
    }
}
export default new FileService()