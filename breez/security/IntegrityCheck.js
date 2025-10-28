import { JailMonkey } from 'jail-monkey'
import { Alert, BackHandler, Platform } from 'react-native'

class IntegrityChecker {
    constructor() {
        this.securityLevel = 'high' 
    }

    async performSecurityScan() {
        try {
            const checks = {
                isJailbroken: this.securityLevel === 'high' ? JailMonkey.jailBroken() : false,
                canMockLocation: JailMonkey.canMockLocation(),
                // isOnExternalStorage: JailMonkey.isOnExternalStorage(),
                // isDebugMode: await this.checkDebugMode(),
                // hasHooks: this.securityLevel === 'high' ? await this.detectHookingFrameworks() : false
            }

            console.log('Security scan results:', checks)

            // const criticalThreats = this.evaluateThreats(checks)
            
            // if (criticalThreats.length > 0) {
            //     this.handleSecurityBreach(checks, criticalThreats)
            //     return false
            // }

            if (checks.isJailbroken) {
                this.handleSecurityBreach(checks)
                return false
            }

            return true
        } catch (error) {
            console.error('Security scan error:', error)
            return true
        }
    }

    evaluateThreats(checks) {
        const threats = []

        if (checks.isJailbroken) threats.push('Устройство с root-доступом')
        if (checks.hasHooks) threats.push('Обнаружены фреймворки для взлома')

        if (checks.canMockLocation) console.warn('Возможно подменное местоположение')
        if (checks.isOnExternalStorage) console.warn('Приложение на внешнем хранилище')
        if (checks.isDebugMode) console.warn('Режим отладки')

        return threats
    }

    async checkDebugMode() {
        if (_DEV_) {
            return true
        }
        
        try {
            return global.DebugSettings && global.DebugSettings.isDebuggingRemotely
        } catch (error) {
            return false
        }
    }

    async detectHookingFrameworks() {
        try {
            const suspiciousProps = [
                'frida', 'xposed', 'cydiasubstrate', 'substrate',
                'libfrida', 'libxposed'
            ]
            
            for (const prop of suspiciousProps) {
                if (global[prop] || window[prop]) {
                    return true
                }
            }
            
            return false
        } catch (error) {
            return false
        }
    }

    handleSecurityBreach(checks, threats) {
        console.error('SECURITY_BREACH:', { checks, threats })
        
        if (this.securityLevel === 'high') {
            Alert.alert(
                'Обнаружена угроза безопасности',
                `Приложение не может быть запущено:\n- ${threats.join('\n- ')}`,
                [{ text: 'OK', onPress: () => BackHandler.exitApp() }]
            )
        } else {
            console.warn('Security threats detected but app continues:', threats)
        }
    }

    setSecurityLevel(level) {
        this.securityLevel = level
    }
}

export default IntegrityChecker