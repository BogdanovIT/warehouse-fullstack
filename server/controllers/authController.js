import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import User from "../models/User.js";
import dotenv from 'dotenv'


dotenv.config()

if (!process.env.JWT_SECRET) {
    console.error("[authController] FATAL: JWT_SECRET не настроен в .env")
    process.exit(1)
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!process.env.JWT_SECRET) {
            throw new Error ('JWT_SECRET не настроен в .env')
        }
        const user = await User.findOne({
            where: { email },
            attributes: ['id', 'email', 'password', ]
        })
        if (!user) {
            console.warn(`[auth] User not found: ${email}`)
            return res.status(401).json({error: "Пользователь не найден"})
        }
        const isPasswordValid = bcrypt.compare(password, user.password)
        if(!isPasswordValid) {
            return res.status(401).json({error: "Неверный пароль"})
        }
        const token = jwt.sign(
            {
            id: user.id,
            email: user.email,
            },
            process.env.JWT_SECRET,
            { 
                algorithm: 'HS256',
                expiresIn: '24h'
            }
        )

        const userData = {
            id: user.id,
            email: user.email
        }
        res.json({ 
            accessToken: token,
            user: userData
        })
        
    } catch (error) {
        res.status(500).json({error: "Ошибка сервера"})
    }
}