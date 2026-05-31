import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js'
import { requireRole } from '../middlewares/roleMiddleware.js'
import { User, Role } from '../models/index.js'

const router = express.Router()
router.use(authMiddleware)

router.get('/', requireRole('director', 'superuser'), async (req, res) => {
    try {
        const isSuperuser = req.user.roleCodes.includes('superuser')
        const requestedDepartment = req.query.department
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
        res.json(result)
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message })
    }
})

router.put('/:id/roles', requireRole('superuser'), async (req, res) => {
    try {
        const { id } = req.params
        const roleIds = req.body.roleIds.map(id => parseInt(id))
        console.log('roeIds после parseInt:', roleIds)
        console.log('Смена ролей. userId:', id, 'roleIds', roleIds)
        const user = await User.findByPk(id)
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }
        console.log('Пользователь найден:', user.email)
        console.log('Методы пользователя:', Object.keys(user.__proto__))
        await user.setRoles(roleIds)
        const updatedUser = await User.findByPk(id, {
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'code', 'name'],
                through: { attributes: ['is_primary'] },
            }]
        })
        res.json({
            id: updatedUser.id,
            roles: updatedUser.roles.map(r => ({
                id: r.id,
                code: r.code,
                name: r.name
            }))
        })
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message })
    }
})

router.put('/:id/block', requireRole('superuser'), async (req, res) => {
    try {
        const { id } = req.params
        const { is_blocked } = req.body
        const user = await User.findByPk(id)
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }
        await user.update({ is_blocked })
        res.json({ id: user.id, is_blocked })
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message })
    }
})

router.get('/roles', requireRole('superuser'), async (req, res) => {
    try {
        const roles = await Role.findAll({
            attributes: ['id', 'code', 'name'],
            order: [['level', 'ASC']],
        })
        res.json(roles)
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message })
    }
})
export default router