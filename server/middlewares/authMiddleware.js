import jwt from 'jsonwebtoken'
import { User, Role } from '../models/index.js'

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) {
            return res.status(401).json({ message: "Not authorized", code: "NO_TOKEN"})
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findByPk(decoded.userId || decoded.id, {
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'code', 'name', 'permissions'],
                through: { attributes: ['is_primary']}
            }],
            attributes: {
                exclude: ['password', 'resetCode', 'resetCodeExpires']
            }
        })
        if (!user) {
            return res.status(401).json({ message: "User not found", code: 'USER_NOT_FOUND'})
        }
        if (user.is_blocked) {
            return res.status(403).json({
                message: 'Account is blocked',
                code: 'ACCOUNT_BLOCKED',
                reason: user.block_reason
            })
        }
        const permissions = Array.from(new Set(
            user.roles?.flatMap(role => role.permissions || []) || []
        ))
        req.user = {
            id: user.id,
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles?.map(role => ({
                code: role.code,
                name: role.name,
                isPrimary: role.UserRole?.is_primary || false
            })) || [],
            roleCodes: user.roles?.map(role => role.code) || [],
            permissions: permissions,
            primaryRole: user.roles?.find(r => r.UserRole?.is_primary)?.code || user.roles?.[0].code,
            tokenExp: decoded.exp,
            tokenIat: decoded.iat
        }
        req.user.hasRole = (roleCode) => {
            return req.user.roleCodes.includes(roleCode)
        }
        req.user.hasAnyRole = (roleCodes) => {
            return roleCodes.some(roleCode => req.user.roleCodes.includes(roleCode))
        }
        req.user.hasPermission = (permission) => {
            return req.user.permissions.includes('*') || req.user.permissions.includes(permission)
        }
        req.user.hasAllPermissions = (permissions) => {
            if (req.user.permissions.includes('*')) return true
            return permissions.every(p => req.user.permissions.includes(p))
        }
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.error('Token expired at:', error.expiredAt)
            return res.status(401).json({
                message: "Token expired",
                code: "Token Expired",
                expiredAt: error.expiredAt
            })
        }
        if (error.name === 'JsonWebTokenError') {
            console.error('Invalid token:', error.message)
            return res.status(401).json({
                message: 'Invalid Token',
                code: "Invalid token"
            })
        }
        console.error("Auth middleware error:", error)
        return res.status(500).json({message: "Internal Server Error", code: 'INTERNAL_ERROR'})
    }
}
export default authMiddleware