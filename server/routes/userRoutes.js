import express from 'express'
import User from '../models/User.js';
const router = express.Router()
import jwt from "jsonwebtoken"
import { Op } from 'sequelize'
import VerificationCode from '../models/VerificationCode.js'
import { addToPasswordHistory, updatePasswordDates } from '../utils/passwordUtils.js';

router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, loginLv, place, operators } = req.body
        if (!email.endsWith('@breez.ru')) {
            return res.status(400).json({
                success: false,
                error: "Допустимы только адреса домена @breez.ru"
            })
        }
        const verifiedCode = await VerificationCode.findOne({
            where: {
                email,
                used: true,
                expiresAt: { [Op.gt]: new Date(Date.now() - 24*60*60*1000) }
            }
        })
        if (!verifiedCode) {
            return res.status(400).json({
                success: false,
                error: "Email не верифицирован. Пожалуйста, подтвердите email перед регистрацией"
            })
        }
        const existingUser = await User.findOne({where: {email}})
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: "Пользователь с таким email уже существует"
            })
        }
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: password,
            loginLv,
            place,
            operators: operators || [],
            emailVerified: true,
            passwordChangedAt: new Date(),
            passwordExpiresAt: new Date(Date.now() + 90*24*60*60*1000)
        })
        await addToPasswordHistory(user.id, password)
        const token = jwt.sign(
            { userId: user.id, email: user.email},
            process.env.JWT_SECRET,
            { expiresIn: '15m'}
        )
        let userOperators = []
        try {
            userOperators = user.operators || '[]'
        } catch(error) {
            console.error('Ошибка парсинга операторов', error)
            userOperators = []
        }
        res.status(201).json({
            success: true,
            message: "Пользователь успешно зарегистрирован",
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                loginLv: user.loginLv,
                place: user.place,
                operators: userOperators
            },
            token
        })
    } catch(error) {
        console.error('Ошибка регистрации:', error)
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        })
    }
})
export default router