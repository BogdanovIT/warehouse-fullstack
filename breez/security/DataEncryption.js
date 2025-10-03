import CryptoJS from 'crypto-js'
import Keychain from 'react-native-keychain'

class DataEncryption {
    constructor() {
        this.encryptionKey = null
    }
    async initialize() {
        const credentials = await Keychain.getGenericPassword()

        if (credentials) {
            this.encryptionKey = credentials.password
        } else {
            this.encryptionKey = this.generateEncryptionKey()
            await Keychain.setGenericPassword('app_encryption_key', this.encryptionKey)
        }
    }
    generateEncryptionKey() {
        return CryptoJS.lib.WordArray.random(256/8).toString()
    }
    encryptData(data) {
        const encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(data),
            this.encryptionKey
        ).toString()
        return encrypted
    }
    decryptData(encryptData) {
        try {
            const decrypted = CryptoJS.AES.decrypt(
                encryptData,
                this.encryptionKey
            )
            return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
        } catch(error) {
            throw new Error('Failed to decrypt data')
        }
    }
}