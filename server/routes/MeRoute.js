import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js'
import User from '../models/User.js'

const MeRoute = express.Router()
MeRoute.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id','firstName', 'lastName', 'email', 'place', 'operators', 'loginLv']
        })
        if (!user) {
            return res.status(404).json({ message: "User not found"})
        }
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            place: user.place,
            operators: user.operators,
            loginLv: user.loginLv
        })

    } catch (e) {
        console.error(e)
        res.status(500).json({ message: "Server error"})
    }
})

export default MeRoute