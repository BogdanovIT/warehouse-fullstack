import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { Platform } from 'react-native'

interface Credentials {
    username: string
    password: string
}
export const isBiometricAvailable = async (): Promise<boolean> => {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync()
        if (!hasHardware) return false
        const isEnrolled = await LocalAuthentication.isEnrolledAsync()
        return isEnrolled
    } catch(error) {
        console.error('Ошибка проверки биометрии', error)
        return false
    }
}
export const getBiometryType = async (): Promise<string> => {
    try {
        const result = await LocalAuthentication.supportedAuthenticationTypesAsync()
        if (result.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return 'face_id'
        } else if (result.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return 'fingerprint'
        } else {
            return 'none'
        }
    } catch(error) {
        console.error("Ошибка получения типа биометрии", error)
        return 'none'
    }
}
export const saveCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
        await SecureStore.setItemAsync('user_email', email)
        await SecureStore.setItemAsync('user_password', password)
        return true
    } catch(error) {
        console.error("Ошибка сохранения учетных данных:", error)
        return false
    }
}
export const getCredentials = async (): Promise<Credentials | null> => {
    try {
        const email = await SecureStore.getItemAsync('user_email')
        const password = await SecureStore.getItemAsync('user_password')
        if (email && password) {
            return {username: email, password}
        }
        return null
    } catch(error) {
        console.error("Ошибка получения учетных данных:", error)
        return null
    }
}
export const removeCredentials = async (): Promise<boolean> => {
    try {
        await SecureStore.deleteItemAsync('user_email')
        await SecureStore.deleteItemAsync('user_password')
        return true
    } catch(error) {
        console.error("Ошибка удаления учетных данных", error)
        return false
    }
}
export const authenticateWithBiometry = async (): Promise<boolean> => {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Аутентификация',
            cancelLabel: 'Отмена',
            disableDeviceFallback: false,
            fallbackLabel: 'Использовать пароль'
        })
        return result.success
    } catch(error) {
        console.error('Ошибка аутентификации по биометрии:', error)
        return false
    }
}
export const tryAutoLogin = async (): Promise<Credentials | null> => {
    try {
        const isAvailable = await isBiometricAvailable()
        if (!isAvailable) return null
        const credentials = await getCredentials()
        if (!credentials) return null
        const isAuthenticated = await authenticateWithBiometry()
        if (isAuthenticated) {
            return credentials
        }
        return null
    } catch(error) {
        console.error("Ошибка автоматического входа:", error)
        return null
    }
}