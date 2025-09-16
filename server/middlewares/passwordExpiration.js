import User from "../models/User.js";
import { isPasswordExpired } from "../utils/passwordUtils.js";

export const checkPasswordExpiration = async (req, res, next) => {
    try {
        if (req.path.includes('/auth/') ||
            req.path.includes('/change-password') ||
            req.path.includes('/logout')) {
                return next()
            } 
            if (req.user) {
                const user = await User.findByPk(req.user.userId)

            if (user && isPasswordExpired(user)) {
                return res.status(403).json({
                    success: false,
                    error: 'Срок действия пароля истек, необходимо изменить пароль.',
                    passwordExpired: true,
                    expiresAt: user.passwordExpiresAt
                })
            }
        }
        next()
    } catch(error) {
        console.error('Ошибка проверки срока действия пароля:', error)
        next()
    }
}