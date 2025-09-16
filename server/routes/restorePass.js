import express from 'express'
import { sendResetEmail } from '../services/passService.js'
import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import { isPasswordHistory, addToPasswordHistory } from '../utils/passwordUtils.js'

const router = express.Router()

function generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0')
}

router.post('/restore-password', async (req, res) => {
    try {
        const {email} = req.body
        const code = generateResetCode()
        const [affectedRows] = await User.update( {resetCode:code}, {where: {email}})
        await sendResetEmail(email, code)
        res.json({success: true})
                
    } catch (error) {
        res.status(500).json({error: "Ошибка отправки кода"})
    }
})

router.post('/reset-password', async (req, res) => {
    try {
        const {email, code, newPassword} = req.body
        const user = await User.findOne({ where: {email, resetCode: code}})
        if (!user) {
            return res.status(400).json({error: "Неверный код"})
        }
        const isUsedBefore = await isPasswordHistory(user.id, newPassword)
        if (isUsedBefore) {
            return res.status(400).json({error: "Этот пароль использовался в одном из трех последних вариантов. Придумайте новый пароль"})
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        user.resetCode = null
        await user.save()
        await addToPasswordHistory(user.id, newPassword)
        res.json({ success: true})
    } catch (error) {
        res.status(400).json({ error: error.message})
    }
})

export default router