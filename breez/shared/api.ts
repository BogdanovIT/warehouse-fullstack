import dotenv from 'dotenv'
dotenv.config()

export const PREFIX = process.env.HOME_URL

export const FILE_API = {
    uploadImage: `${PREFIX}/files/upload-image?folder=demo`
}