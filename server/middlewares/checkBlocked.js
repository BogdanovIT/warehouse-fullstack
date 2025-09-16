import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const checkBlocked = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next()
        }
        const access_token = req.headers.authorization.split(' ')[1]
        if (!access_token) return next()
            const decoded = jwt.verify(access_token, process.env.JWT_SECRET)
            const user = await User.findByPk(decoded.userId)

            if(user && user.is_blocked) {
                return res.status(403).json({
                    success: false,
                    error: "Аккаунт заблокирован",
                    reason: user.block_reason || "Причина не указана",
                })
            }
            next()
    } catch(error) {
        next()
    }
}
export default checkBlocked