import bcrypt from "bcryptjs";
import PasswordHistory from "../models/PasswordHistory.js";

const PASSWORD_HISTORY_LIMIT = 3
const PASSWORD_EXPIRATION_DAYS = 90

export const isPasswordHistory = async (userId, newPassword) => {
    try {
        const history = await PasswordHistory.findAll({
            where: { userId },
            order: [['changedAt', 'DESC']],
            limit: PASSWORD_HISTORY_LIMIT
        })
        for (const record of history) {
            const isMatch = await bcrypt.compare(newPassword, record.password)
            if (isMatch) {
                return true
            }
        }
        return false
    } catch(error) {
        console.error('Ошибка проверки истории паролей:', error)
        return false
    }
}
export const addToPasswordHistory = async (userId, password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        const history = await PasswordHistory.findAll({
        where: {userId},
        order: [['changedAt', 'DESC']]
    })
    if (history.length >= PASSWORD_HISTORY_LIMIT) {
        const recordToDelete = history.slice(PASSWORD_HISTORY_LIMIT - 1)
        for (const record of recordToDelete) {
            await record.destroy()
        }
    }
    await PasswordHistory.create({
        userId,
        password: hashedPassword
    })
    } catch(error) { 
        console.error('Ошибка добавления пароля в историю:', error)
    }
}
export const isPasswordExpired = (user) => {
    if (!user.passwordExpiresAt) return false
    return new Date() > new Date(user.passwordExpiresAt)
}
export const calculateNextExpiration = () => {
    return new Date(Date.now() + PASSWORD_EXPIRATION_DAYS *24*60*60*1000)
}
export const updatePasswordDates = async (user) => {
    try {
        user.passwordChangedAt = new Date()
        user.passwordExpiresAt = calculateNextExpiration()
        await user.save()
    } catch(error) {
        console.error('Ошибка обновления дат пароля:', error)
    }
}