import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js'
import Movement from '../models/Movement.js'
import MovementItem from '../models/MovementItem.js'
import Employee from '../models/Employee.js'
import { Op } from 'sequelize'

const router = express.Router()
router.use(authMiddleware)

router.post('/', async (req, res) => {
    try {
        const { operationType, department, employeeId, document, qrCodes } = req.body
        if (!operationType || !department || !employeeId || !qrCodes?.length) {
            return res.status(400).json({ message: 'Не все поля заполнены' })
        }
        const employee = await Employee.findByPk(employeeId)
        if (!employee) {
            return res.status(404).json({ message: 'Сотрудник не найден' })
        }
        const issuedBy = `${req.user.firstName} ${req.user.lastName}`
        const movement = await Movement.create({
            operationType,
            department,
            employeeId,
            issuedBy,
            document: document || null,
        })
        await MovementItem.bulkCreate(
            qrCodes.map(code => ({ movementId: movement.id, qrData: code }))
        )
        res.status(201).json({
            success: true,
            message: operationType === 'issued' ? 'Выдача сохранена' : 'Возврат сохранен',
            movementId: movement.id
        })
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message })
    }
})

router.get('/', async (req, res) => {
    try {
        const { date, department } = req.query
        const targetDate = date || new Date().toISOString().split('T')[0]
        const where = {
            createdAt: {
                [Op.gte]: new Date(`${targetDate}T00:00:00`),
                [Op.lt]: new Date(`${targetDate}T23:59:59`),
            },
        }
        if (department) where.department = department
        const movements = await Movement.findAll({
            where,
            include: [
                { model: Employee, attributes: ['id', 'fullName'] },
                { model: MovementItem, as: 'items', attributes: ['id', 'qrData'] },
            ],
            order: [['createdAt', 'DESC']],
        })
        res.json(movements)
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message })
    }
})

export default router