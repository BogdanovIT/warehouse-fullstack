import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js'
import Movement from '../models/Movement.js'
import MovementItem from '../models/MovementItem.js'
import { Op, sequelize } from 'sequelize'

const router = express.Router()
router.use(authMiddleware)

router.post('/', async (req, res) => {
    try {
        const { operationType, department, employeeName, document, qrCodes } = req.body
        if (!operationType || !department || !employeeName || !qrCodes?.length || !document) {
            return res.status(400).json({ message: 'Не все поля заполнены' })
        }
        const issuedBy = `${req.user.firstName} ${req.user.lastName}`
        const movement = await Movement.create({
            operationType,
            department,
            employeeName,
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
                { model: MovementItem, as: 'items', attributes: ['id', 'qrData'] },
            ],
            order: [['createdAt', 'DESC']],
        })
        res.json(movements)
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message })
    }
})

router.get('/seqrch-employees', async (req, res) => {
    try {
        const { query } = req.query
        if (!query || query.length < 2) {
            return res.json([])
        }
        const employees = await Movement.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('employeeName')), 'employeeName']],
            where: {
                employeeName: {
                    [Op.iLike]: `${query}%`
                }
            },
            limit: 5,
            raw: true
        })
        res.json(employees.map(e => e.employeeName).filter(Boolean))
    } catch (error) {
        res.status(500).json({ message: 'Ошибка поиска', error: error.message})
    }
})

export default router