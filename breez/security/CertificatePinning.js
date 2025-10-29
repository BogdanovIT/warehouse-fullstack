import SslPinning from 'react-native-ssl-pinning'

class CertificateSecurity {
    constructor() {
        this.pins = {
            'literally-fair-lark.cloudpub.ru': {
                certs: ['1d9c3551b9faed7c04bb9c777736dc6763eba59196788533b5cfff5e1f70a248']
            }
        }
    }
    
    async initializePinning() {
        try {
            await SslPinning.initialize(this.pins)
            console.log('SSL Pinning initialized')
            return true
        } catch (error) {
            console.error('Certificate pinning failed:', error)
            return false
        }
    }
}
export default CertificateSecurity