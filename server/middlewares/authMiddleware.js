import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) {
            return res.status(401).json({ message: "Not authorized"})
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findByPk(decoded.userId)
        if (!user) {
            return res.status(401).json({ message: "User not found"})
        }
        req.user = {id: decoded.userId}
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
        return res.status(500).json({message: "Internal Server Error"})
    }
}
export default authMiddleware