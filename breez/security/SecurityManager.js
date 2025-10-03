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
            await this.certificateSecurity.initializePinning()
            const isSecure = this.integrityChecker.performSecurityScan() 
            if (!isSecure) {
                throw new Error('Security check failed')
            }
            await this.dataEncryption.initialize()
            this.isInitialized = true
            console.log('Security system initialized successfully')
        } catch(error) {
            console.error('Security initialization failed:', error)
            throw error
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
        await this.verifyResponseSignature(response)
        return response
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