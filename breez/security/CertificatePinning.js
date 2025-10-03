import { certPinner } from 'react-native-cert-pinner'
import SslPinning from 'react-native-ssl-pinning'

class CertificateSecurity {
    constructor() {
        this.pins = {
            'literally-fair-lark.cloudpub.ru': [
                'SHA256/1d9c3551b9faed7c04bb9c777736dc6763eba59196788533b5cfff5e1f70a248',
                'SHA256/762538439509c411c437d3c567563e1378671281fc4a1464add031870843676e'
            ]
        }
    }
    async initializePinning() {
        try {
            await certPinner.setPins(this.pins)
            await SslPinning.initialize({
                'literally-fair-lark.cloudpub.ru': {
                    certs: ['1d9c3551b9faed7c04bb9c777736dc6763eba59196788533b5cfff5e1f70a248']
                }
            })
        } catch (error) {
            console.error('Certificate pinning failed:', error)
            throw new Error('Security initialization failed')
        }
    }
}