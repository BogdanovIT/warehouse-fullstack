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
    } catch (e) {
        console.error(e)
        return res.status(401).json({ message: "Not authorized"})
    }
}
export default authMiddleware