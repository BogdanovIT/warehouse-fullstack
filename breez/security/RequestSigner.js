import CryptoJS from 'crypto-js'
import { Platform, DeviceInfo } from 'react-native'

class RequestSigner {
    constructor() {
        this.staticSeed = 'breez_warehouse_2025_secure_key_v1_@BogdanovIT!'
        this.requestCounter = 0
    }
    generateDynamicSecret() {
        return CryptoJS.HmacSHA256(this.staticSeed, this.staticSeed).toString()
    }
    async signRequest(method, endpoint, data = {}) {
        this.requestCounter++
        const timestamp = Date.now()
        const nonce = CryptoJS.lib.WordArray.random(16).toString()
        const signData = {
            method: method.toUpperCase(),
            endpoint,
            data,
            timestamp,
            nonce,
            counter: this.requestCounter,
            platform: Platform.OS,
            version: '1.0.0'
        }
        const signString = this.createSignString(signData)
        const signature = CryptoJS.HmacSHA512(signString, this.staticSeed).toString()
        return {
            'X-Signature': signature,
            'X-Timestamp': timestamp,
            'X-Nonce': nonce,
            'X-Counter': this.requestCounter,
            'X-Platform': Platform.OS,
            'Content-Type': 'application/json'
        }
    }
    createSignString(data) {
        return Object.keys(data)
        .sort()
        .map(key => `${key}= ${JSON.stringify(data[key])}`)
        .join('&')
    }
}
export default RequestSigner