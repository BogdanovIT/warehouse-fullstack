import { MD5, SHA256 } from 'crypto-js'
import { readFile } from 'react-native-fs'
import { JailMonkey } from 'jail-monkey'
import { checkForUpdate, fetchUpdate } from 'expo-updates'
import { Alert, BackHandler } from 'react-native'

class IntegrityChecker {
    constructor() {
        this.expectedHashes = {
            'main.bundle': 'ОЖИДАЕМЫЙ_HASH_ГЛАВНОГО_БАНДЛА',
            'assets': 'ОЖИДАЕМЫЙ_HASH_РЕСУРСОВ'
        }
    }
    async performSecurityScan() {
        const checks = {
            isJailbroken: JailMonkey.isJailbroken(),
            isDebugMode: await this.checkDebugMode(),
            isTampered: await this.checkAppTampering(),
            isEmulator: JailMonkey.isOnExternalStorage(),
            hasHooks: await this.detectHookingFrameworks()
        }
        const threats = Object.values(checks).filter(Boolean).length
        if (threats > 0) {
            this.handleSecurityBreach(checks)
            return false
        }
        return true
    }
    async checkAppTampering() {
        try {
            const bundleHash = await this.calculateFileHash('main.bundle')
            const assetsHash = await this.calculateAssetsHash()
            return bundleHash !== this.expectedHashes['main.bundle'] ||
            assetsHash !== this.expectedHashes['assets']
        } catch(error) {
            return true
        }
    }
    async checkDebugMode() {
        return new Promise((resolve) => {
            const start = performance.now()
            debugger
            const end = performance.now()
            resolve((end - start) > 100)
        })
    }
    async detectHookingFrameworks() {
        try {
            const modules = await this.getLoadedModules()
            return modules.some(module =>
                module.includes('frida') ||
                module.includes('xposed') ||
                module.includes('cydiasubtrate')
            )
        } catch(error) {
            return false
        }
    }
    handleSecurityBreach(checks) {
        this.logSecurityEvent('SECURITY_BREACH', checks)
        Alert.alert(
            'Обнаружена угроза безопасности',
            'Приложение не может быть запущено в небезопасной среде.',
            [{ text: 'OK', onPress: () => BackHandler.exitApp() }]
        )
    }
}