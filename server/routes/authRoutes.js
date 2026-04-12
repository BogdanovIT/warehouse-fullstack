import {Router} from 'express'
import { login } from '../controllers/authController.js'
import { getBlockInfo, addLoginAttempt, checkLoginBlock } from '../utils/authSecurity.js'
import User from '../models/User.js'
import Role from '../models/Role.js'
import jwt from 'jsonwebtoken'
import { isPasswordHistory, addToPasswordHistory, updatePasswordDates } from '../utils/passwordUtils.js'
import bcrypt from 'bcryptjs'
import authMiddleware from '../middlewares/authMiddleware.js'


const router = Router()

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for']
    if (forwarded) {
        return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]
    }
    return req.socket?.remoteAddress || 'unknown'
}
const prepareUserData = (user) => {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        loginLv: user.loginLv,
        place: user.place,
        operators: Array.isArray(user.operators) ? user.operators : [],
        roles: user.roles?.map(role => ({
            code: role.code,
            name: role.name,
            isPrimary: role.UserRole?.is_primary || false
        })) || [],
        permissions: Array.from(new Set(
            user.roles?.flatMap(role => role.permissions || []) || []
        )),
        primaryRole: user.roles?.find(r => r.UserRole?.is_primary)?.code || user.roles?.[0]?.code || null
    }
}

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const ipAddress = getClientIp(req)
        const userAgent = req.get('User-Agent')

        const blockInfo = await checkLoginBlock(email, ipAddress)
        if (blockInfo.blocked) {
            return res.status(429).json({
                success: false,
                error: `Слишком много неудачных попыток. Попробуйте через ${Math.ceil((blockInfo.expiresAt - new Date()) / 1000 / 60)} минут`,
                blocked: true,
                expiresAt: blockInfo.expiresAt
            })
        }
        const user = await User.findOne({
            where: {email},
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'code', 'name', 'permissions'],
                through: { attributes: ['is_primary'] }
            }],
        attributes: ['id', 'email', 'password', 'firstName', 'lastName', 'loginLv', 'place', 'operators', 'is_blocked', 'block_reason', 'emailVerified']})
        if (!user) {
            await addLoginAttempt(email, ipAddress, false, userAgent)
            return res.status(401).json({
                success: false,
                error: 'Неверный email или пароль',
                blocked: true                
            })
        }
        
        if (user.is_blocked) {
            return res.status(403).json({
                success: false,
                error: "Аккаунт заблокирован",
                reason: user.block_reason || "Причина не указана",
                blocked: true,
                code: "ACCOUNT_BLOCKED"
            })
        }
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                error: 'Email не подтвержден. Проверьте почту для получения кода',
                code: 'EMAIL_NOT_VERIFIED',
                email: user.email
            })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        
        if (!isPasswordValid) {
            await addLoginAttempt(email, ipAddress, false, userAgent)
            return res.status(401).json({
                success: false,
                error: 'Неверный email или пароль'
            })
        }
        await addLoginAttempt(email, ipAddress, true, userAgent)
        let userOperators = []
        try {
            userOperators = Array.isArray(user.operators) ? user.operators : '[]'
        } catch(error) {
            console.error('Ошибка парсинга операторов:', error)
            userOperators = []
        }
        const token = jwt.sign(
            { userId: user.id, email: user.email, roles: user.roles?.map(role => role.code) || []},
            process.env.JWT_SECRET,
            {expiresIn: '24h'}
        )
        const userData = prepareUserData(user)
        res.json({
            success: true,
            message: 'Вход выполнен успешно',
            accessToken: token,
            user: userData
        })
    } catch(error) {
        console.error('Ошибка входа:', error)
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        })
    }
})

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId
        const user = await User.findByPk(userId, {
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
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден',
                code: 'USER_NOT_FOUND'
            })
        }
        const userData = prepareUserData(user)
        res.json({
            success: true,
            user: userData
        })
    } catch (error) {
        console.error('Ошибка получения данных пользователя', error)
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        })
    }
})

router.get('/permissions', authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId
        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['permissions'],
                through: {attributes: [] }
            }]
        })
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            })
        }
        const permissions = Array.from(new Set(
            user.roles?.flatMap(role => role.permissions || []) || []
        ))
        res.json({
            success: true,
            permissions,
            roles: user.roles?.map(role => role.code)
        })
    } catch (error) {
        console.error('Ошибка получения разрешений:', error)
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        })
    }
})

router.post('/check-user-status', async (req, res) => {
    try {
        const {email} = req.body
        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Email обязателен"
            })
        }
        const user = await User.findOne({
            where: {email},
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['code', 'name'],
                through: { attributes: ['is_primary'] }
            }],
            attributes: ['id', 'email','is_blocked', 'block_reason', 'emailVerified', 'firstName', 'lastName']
        })
        if (!user) { 
            return res.json({
                success: true,
                exists: false,
                blocked: false
            })
        }
        return res.json({
            success: true,
            exists: true,
            blocked: user.is_blocked,
            blockReason: user.block_reason || "Причина не указана",
            emailVerified: user.emailVerified,
            name: `${user.firstName} ${user.lastName || ''}`.trim(),
            roles: user.roles?.map(role => ({
                code: role.code,
                name: role.name,
                isPrimary: role.UserRole?.is_primary
            })) || []
        })
    } catch(error) {
        console.error("Ошибка проверки статуса пользователя:", error)
        res.status(500).json({
            success: false,
            error: "Внутренняя ошибка сервера"
        })
    }
})

router.post('/check-block-status', async (req, res) => {
    try {
        const {email} = req.body
        const ipAddress = getClientIp(req)
        const blockInfo = await getBlockInfo(email, ipAddress)
        res.json({
            success: true,
            blocked: blockInfo.blocked,
            message: blockInfo.message,
            expiresAt: blockInfo.expiresAt
        })
    } catch(error){
        console.error('Ошибка проверки блокировки:', error)
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        })
    }
})
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword} = req.body
        const userId = req.user.userId
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Пароли не совпадают'
            })
        }
        const user = await User.findByPk(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            })
        }
        const isCurrentValid = await bcrypt.compare(currentPassword, user.password)
        if (!isCurrentValid) {
            return res.status(400).json ({
                success: false,
                error: 'Текущий пароль неверен'
            })
        }
        const isUsed = await isPasswordHistory(userId, newPassword)
        if (isUsed) {
            return res.status(400).json({
                success: false,
                error: 'Нельзя использовать один из трех последних паролей'
            })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        await user.save()
        await updatePasswordDates(user)
        await addToPasswordHistory(userId, hashedPassword)
        res.json({
            success: true,
            message: 'Пароль успешно изменен',
            nextExpiration: user.passwordExpiresAt
        })
    } catch(error) {
        console.error('Ошибка смены пароля:', error)
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        })
    }
})
router.get('/password-status', authMiddleware , async (req, res) => {
    try {
        const userId= req.user.userId
        const user = await User.findByPk(userId)
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Пользователь не найден'
            })
        }
        const now = new Date()
        const expiresAt = new Date(user.passwordExpiresAt)
        const daysLeft = Math.ceil((expiresAt - now) / (1000*60*60*24))
        res.json({
            success: true,
            passwordExpired: now > expiresAt,
            expiresAt: user.passwordExpiresAt,
            daysLeft: Math.max(0, daysLeft),
            warning: daysLeft <= 7
        })
    } catch(error) {
        console.error('Ошибка проверки статуса пароля:', error)
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        })
    }
})
export default router