import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js'
import User from '../models/User.js'
import Role from '../models/Role.js'

const MeRoute = express.Router()
MeRoute.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'code', 'name', 'permissions'],
                through: {attributes: ['is_primary'] }
            }],
            attributes: ['id','firstName', 'lastName', 'email', 'place', 'operators', 'loginLv']
        })
        if (!user) {
            return res.status(404).json({ message: "User not found"})
        }
        const userRoles = user.roles || []

        const permissions = Array.from(new Set(
            userRoles.flatMap(role => role.permissions || [])
        ))
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            place: user.place,
            operators: user.operators,
            loginLv: user.loginLv,
            roles: userRoles.map(role => ({
                code: role.code,
                name: role.name,
                isPrimary: role.UserRole?.is_primary || false
            })),
            permissions: permissions,
            primaryRole: userRoles.find(r => r.UserRole?.is_primary)?.code || userRoles[0]?.code || null
        })

    } catch (e) {
        console.error(e)
        res.status(500).json({ message: "Server error"})
    }
})

export default MeRoute