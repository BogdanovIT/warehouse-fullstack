import { jwtDecode } from 'jwt-decode'

export const isTokenExpired = ( token: string | null): boolean => {
    if (!token) return true
    try {
        const decoded: any = jwtDecode(token)
        const currentTime = Date.now() / 1000
        return decoded.exp < currentTime
    } catch {
        return true
    }
}