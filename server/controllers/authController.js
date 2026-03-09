import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import User from "../models/User.js";
import dotenv from 'dotenv'
import Role from "../models/Role.js";
import { Op } from "sequelize";


dotenv.config()

if (!process.env.JWT_SECRET) {
    console.error("[authController] FATAL: JWT_SECRET не настроен в .env")
    process.exit(1)
}

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

const prepareUserData = (user) => {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        loginLV: user.loginLV,
        operators: user.operators || [],
        place: user.place,
        emailVerified: user.emailVerified,
        roles: user.roles?.map(role => ({
            code: role.code,
            name: role.name,
            isPrimary: role.UserRole?.is_primary || false
        })) || [],
        permissions: Array.from(new Set(
            user.roles?.flatMap(role => role.permissions || []) || []
        )),
        primaryRole: user.roles?.find(r => r.UserRole?.is_primary)?.code || user.roles?.[0]?.code
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email и пароль обязательны',
                code: 'MISSING_CREDENTIALS'
            })
        }
        if (!process.env.JWT_SECRET) {
            throw new Error ('JWT_SECRET не настроен в .env')
        }
        const user = await User.findOne({
            where: { email },
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'code', 'name', 'permissions'],
                through: {attributes: ['is_primary']}
            }],
            attributes: { exclude:['password']}
        })
        if (!user) {
            console.warn(`[auth] User not found: ${email}`)
            return res.status(401).json({
                error: "Пользователь не найден",
                code: 'INVALID_CREDENTIALS'
            })
        }
        const userWithPassword = await User.findOne({
            where: { email },
            attributes: ['id', 'password']
        })
        const isPasswordValid = bcrypt.compare(password, userWithPassword.password)
        if(!isPasswordValid) {
            console.warn(`[auth] Invalid password for: ${email}`)
            return res.status(401).json({
                error: "Неверный email или пароль",
                code: 'INVALID_CREDENTIALS'
            })
        }
        await user.update({ loginLV: new Date() })
        const token = jwt.sign(
            {
            id: user.id,
            email: user.email,
            roles: user.roles?.map(role => role.code) || []
            },
            process.env.JWT_SECRET,
            { 
                algorithm: 'HS256',
                expiresIn: process.env.JWT_EXPIRES_IN || '7d'
            }
        )

        const userData = prepareUserData(user)
        res.json({ 
            success: true,
            accessToken: token,
            user: userData
        })
        
    } catch (error) {
        res.status(500).json({
            error: "Ошибка сервера",
            code: 'SERVER_ERROR'
        })
    }
}
export const register = async (req, res) => {
    try {
        const {email, password, firstName, lastName, place, loginLV, operators} = req.body
        if (!email || !password || !firstName) {
            return res.status(400).json({
                error: 'Email, пароль и имя обязательны',
                code: 'MISSING_FIELDS'
            })
        }
        const existingUser = await User.findOne({ where: {email} })
        if (existingUser) {
            return res.status(400).json({
                error: 'Пользователь с таким email уже существует',
                code: 'EMAIL_EXISTS'
            })
        }
        const verificationCode = generateVerificationCode()
        const resetCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            place,
            loginLV,
            operators: operators?.filter(op=>op) || [],
            resetCodeExpires,
            resetCode: verificationCode,
            emailVerified: false
        })
        if (typeof user.assignRole === 'function') {
            await user.assignRole('storekeeper', null, true)
        } else {
            console.warn("[auth] Метод assignRole не найден, роль не назначена")
        }
        const userWithRoles = await User.findByPk(user.id, {
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'code', 'name', 'permissions'],
                through: { attributes: ['is_primary'] }
            }],
            attributes: { exclude: ['password', 'resetCode', 'resetCodeExpires'] }
        })
        res.status(201).json({
            success: true,
            message: 'Пользователь успешно зарегистрирован',
            user: prepareUserData(userWithRoles)
        })
    } catch(error) {
        console.error('[auth] Ошибка регистрации', error)
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: 'Ошибка валидации данных',
                details: error.errors.map(e => e.message),
                code: 'VALIDATION_ERROR'
            })
        }
        res.status(500).json({
            error: 'Ошибка сервера при регистрации',
            code: 'SERVER_ERROR'
        })
    }
}
export const verifyEmail = async(req, res) => {
    try {
        const { email, code } = req.body
        const user = await User.findOne({
            where: {
                email,
                resetCode: code,
                resetCodeExpires: { [Op.gt]: new Date() }
            }
        })
        if (!user) {
            return res.status(400).json({
                error: 'Неверный или просроченный код подтверждения',
                code: 'INVALID_VERIFICATION_CODE'
            })
        }
        await user.update({
            emailVerified: true,
            resetCode: null,
            resetCodeExpires: null
        })
        res.json({
            success: true,
            message: 'Email успешно подтвержден'
        })
    } catch(error) {
        console.error('[auth] Ошибка подтверждения email', error)
        res.status(500).json({
            error: 'Ошибка сервера',
            code: 'SERVER_ERROR'
        })
    }
}
export const resentVerifikationCode = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ where: {email} })
        if (!user) {
            return res.status(404).json({
                error: "Пользователь не найден",
                code: "USER_NOT_FOUND"
            })
        }
        if (user.emailVerified) {
            return res.status(400).json({
                error: "Email уже подтвержден",
                code: "ALREADY_VERIFIED"
            })
        }
        const verificationCode = generateVerificationCode()
        const resetCodeExpires =new Date(Date.now() + 24*60*60*1000)
        await user.update({
            resetCode: verificationCode,
            resetCodeExpires
        })
        console.log(`[auth] Новый код для ${email}: ${verificationCode}`)
        res.json({
            success: true,
            message: "Код подтверждения отправлен повторно"
        })
    } catch(error) {
        console.error("[auth] Ошибка при повторной отправке кода:", error)
        res.status(500).json({
            error: "Ошибка сервера",
            code: "SERVER_ERROR"
        })
    }
}
export const getCurrentUser = async(req, res) => {
    try {
        const userId = req.user.id
        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                as:'roles',
                attributes: ['id', 'code', 'name', 'permissions'],
                through: {attributes: ['is_primary']}
            }],
            attributes: {
                exclude: ['password', 'resetCode', 'resetCodeExpires']
            }
        })
        if (!user) {
            return res.status(404).json({
                error: "Пользователь не найден",
                code: 'USER_NOT_FOUND'
            })
        }
        res.json({
            success: true,
            user: prepareUserData(user)
        })
    } catch (error) {
        console.error("[auth] Ошибка получения пользователя:", error)
        res.status(500).json({
            error: 'Ошибка сервера',
            code: 'SERVER_ERROR'
        })
    }
}
export const logout = async (req, res) => {
    try {
        console.log(`[auth] User logged out: ${req.user?.email}`)
        res.json({
            success: true,
            message: 'Успешный выход из системы'
        })
    } catch (error) {
        console.error('[auth] Ошибка при выходе:', error)
        res.status(500).json({
            error: "Ошибка сервера",
            code: "SERVER_ERROR"
        })
    }
}