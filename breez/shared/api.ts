import { Config } from '@/config'

export const PREFIX = Config.HOME_URL

export const FILE_API = {
    uploadImage: `${PREFIX}/files/upload-image?folder=demo`
}