import * as SecureStore from 'expo-secure-store'

class DataEncryption {
    async initialize() {
        return true
    }
    async encryptData(data) {
        return JSON.stringify(data)
    }
    async decryptData(encryptedData) {
        return JSON.parse(encryptedData)
    }
    async secureSet(key, value) {
        await SecureStore.setItemAsync(key, JSON.stringify(value))
    }
    async secureGet(key) {
        const value = await SecureStore.getItemAsync(key)
        return value ? JSON.parse(value) : null
    }
}
export default DataEncryption