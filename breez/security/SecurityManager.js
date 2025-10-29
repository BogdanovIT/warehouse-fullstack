import CertificateSecurity from './CertificatePinning'
import RequestSigner from './DataEncryption'
import IntegrityChecker from './IntegrityCheck'
import DataEncryption from './DataEncryption'
import AsyncStorage from '@react-native-async-storage/async-storage'

class SecurityManager {
    constructor() {
        this.certificateSecurity = new CertificateSecurity()
        this.requestSigner = new RequestSigner()
        this.integrityChecker = new IntegrityChecker()
        this.dataEncryption = new DataEncryption()
        this.isInitialized = false
    }
    async initialize() {
        if (this.isInitialized) return
        try { 
            const pinningSuccess = await this.certificateSecurity.initializePinning()
            if (!pinningSuccess) {
                console.warn('SSL Pinning failed')
            }
            try {
                const isSecure = await this.integrityChecker.performSecurityScan()
                console.log('Integrity Check Result:', isSecure)
            } catch(error) {
                console.warn('Integrity Check failed', error)
            }
            try {
                await this.dataEncryption.initialize()
                console.log('Data Encryption initialized')
            } catch(error) {
                console.warn('Data Encryption failed', error)
            }
            this.isInitialized = true
            console.log('Security System Initialized')
        } catch(error) {
            console.error('Security initialization failed:', error)
            this.isInitialized = true
        }
    }
    async makeSecureRequest(method, url, data) {
        if (!this.isInitialized) {
            await this.initialize()
        }
        const headers = await this.requestSigner.signRequest(method, url, data)
        const response = await fetch(url, {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined
        })
    }
    async secureStorageSet(key, value) {
        const encrypted = this.dataEncryption.encryptData(value)
        await AsyncStorage.setItem(key, encrypted)
    }
    async secureStorageGet(key) {
        const encrypted = await AsyncStorage.getItem(key)
        return encrypted ? this.dataEncryption.decryptData(encrypted) : null
    }
}
export default SecurityManager