import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js'
import { requireRole } from '../middlewares/roleMiddleware.js'
import { User, Role } from '../models/index.js'

const router = express.Router()
router.use(authMiddleware)

router.get('/', requireRole('director', 'superuser'), async (req, res) => {
    try {
        const isSuperuser = req.user.roleCodes.includes('superuser')
        const requestedDepartment = req.query.departnent
        const where = {}
        if (isSuperuser && requestedDepartment) {
            where.place = requestedDepartment
        } else if (!isSuperuser) {
            where.place = req.user.place
        }
        const users = await User.findAll({
            where,
            attributes: ['id', 'email', 'firstName', 'lastName', 'loginLv', 'place', 'is_blocked', 'createdAt'],
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'code', 'name'],
                through: { attributes: ['is_primary'] },
            }],
            order: [['createdAt', 'DESC']],
        })
        const result = users.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            loginLv: u.loginLv,
            place: u.place,
            is_blocked: u.is_blocked,
            createdAt: u.createdAt,
            roles: u.roles.map(r => ({
                id: r.id,
                code: r.code,
                name: r.name,
                isPrimary: r.UserRole?.is_primary || false
            }))
        }))
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message })
    }
})

export default router