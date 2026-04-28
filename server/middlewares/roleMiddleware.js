import jwt from 'jsonwebtoken'
import { User, Role } from '../models'

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (!token) {
            return res.status(401).json({
                error: 'Токен не предоставлен',
                code: 'NO_TOKEN'
            })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findByPk(decoded.id, {
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'code', 'name', 'permissions'],
                through: { attributes: ['is_primary'] }
            }],
            attributes: {
                exclude: ['password', 'resetCode', 'resetCodeExpires']
            }
        })
        if (!user) {
            return res.status(401).json({
                error: 'Пользователь не найден',
                code: 'USER_NOT_FOUND'
            })
        }
        if (user.is_blocked) {
            return res.status(403).json({
                error: 'Аккаунт заблокирован',
                reason: user.block_reason,
                code: 'ACCOUNT_BLOCKED'
            })
        }
        req.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles.map(role => role.code),
            permissions: Array.from(new Set(
                user.roles.flatMap(role => role.permissions)
            )),
            primaryRole: user.roles.find(r => r.UserRole.is_primary)?.code || user.roles[0]?.code
        }
        next()
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                error: 'Неверный токен',
                code: "INVALID_TOKEN"
            })
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                error: 'Токен истек',
                code: 'TOKEN_EXPIRED'
            })
        }
        console.error('Ошибка аутентификации:', error)
        return res.status(500).json({
            error: 'Требуется аутентификация',
            code: 'AUTH_REQUIRED'
        })
    }
}
export const requireRole = (...requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Требуется аутентификация',
                code: 'AUTH_REQUIRED'
            })
        }
        const hasRequiredRole = requiredRoles.some(role =>
            req.user.roleCodes.includes(role)
        )
        if (!hasRequiredRole) {
            return res.status(403).json({
                error: 'Недостаточно прав. Требуемые роли: ' + requiredRoles.join(', '),
                userRoles: req.user.roleCodes,
                code: 'INSUFFICIENT_ROLE'
            })
        }
        next()
    }
}
export const requirePermission = (...requiredPermissions) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Требуется аутентификация',
                code: 'AUTH_REQUIRED'
            })
        }
        if (req.user.roles.includes('superuser')) {
            return next()
        }
        const hasPermission = requiredPermissions.some(permission => {
            return req.user.permissions.includes('*') || 
            req.user.permissions.includes(permission)
        })
        if (!hasPermission) {
            return res.status(403).json({
                error: 'Недостаточно прав. Требуемые разрешения: '+ requiredPermissions.json(', '),
                userPermissions: req.user.permissions,
                code: 'INSUFFICIENT_PERMISSION'
            })
        }
        next()
    }
}
export const requireRoleAndPermission = (roles=[], permissions=[]) => {
    return [
        requireRole(...roles),
        requirePermission(...permissions)
    ]
}
export const requireOwnershipOrRole = (resourceUserIdField = 'userId', allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется аутентификация' })
        }
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField]
        const isOwner = resourceUserId && parseInt(resourceUserId) === req.user.id
        const hasAllowedRole = allowedRoles.some(role => req.user.roles.includes(role))

        if (isOwner || hasAllowedRole || req.user.roles.includes('superuser')) {
            return next()
        }
        return res.status(403).json({
            error: 'Нет доступа к этому ресурсу',
            code: 'ACCESS_DENIED'
        })
    }
}
export const logAdminAction = (action) => {
    return (req, res, next) => {
        if (req.user && ['director', 'superuser'].some(role => req.user.roles.includes(role))) {
            console.log(`[ADMIN ACTION] ${action} выполнен пользователем ${req.user.email} (${req.user.id})`)
        }
        next()
    }
}