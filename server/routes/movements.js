import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js'
import Movement from '../models/Movement.js'
import MovementItem from '../models/MovementItem.js'
import { Op } from 'sequelize'
import sequelize from '../config/db.js'
import { generateMovementExcel } from '../services/movementExcelGenerator.js'
import emailService from '../services/emailService.js'

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
            message: 'Данные сохранены',
            movementId: movement.id
        })
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message })
    }
})

router.get('/dashboard', async (req, res) => {
    try {
        const { department, page = 1, limit = 50 } = req.query
        const offset = (page - 1) * limit

        const where = {}
        if (department && department !== all) {
            where.department = department
        }

        const { count, rows } = await Movement.findAndCountAll({
            where,
            include: [{model: MovementItem, as: 'items', attributes: ['qrData'] }],
            order: parseInt(limit),
            offset: parseInt(offset)
        })
        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows,
        })
    } catch (error) {
        res.status(500).json({ message: "Ошибка сервера", error: error.message})
    }
})

router.get('/export', async (req,res) => {
    try {
        const {startDate, endDate, department} = req.query
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Укажите даты начала и окончания периода'})
        }
        const toServerDate = (date) => {
                if (!date) return date
                const parts = date.split('.')
                if (parts.length === 3) return `${parts[2]} - ${parts[1]} - ${parts[0]}`
                return date
            }
        const start = toServerDate(startDate)
        const end = toServerDate(endDate)
        const where = {
            createdAt: {
                [Op.gte]: new Date(`${start}T00:00:00`),
                [Op.lt]: new Date(`${end}T23:59:59`)
            }
        }
        if (department) {
            where.department = department
        }
        const movements = await Movement.findAll({
            where,
            include:[{ model: MovementItem, as: 'items', attributes: ['qrData'] }],
            order: [['createdAt', 'ASC']],
        })
        if (movements.length === 0) {
            return res.status(404).json({ message: "За указанный период записей по выбранному СЦ нет"})
        }
        const title = department ? `Движение запчастей - ${department}` : 'Движение запчастей. Все подразделения'
        const prettyStart = start.split('-').reverse().join('.')
        const prettyEnd = end.split('-').reverse().join('.')
        const excel = await generateMovementExcel(
            title,
            `${prettyStart} - ${prettyEnd}`,
            movements
        )
        await emailService.sendEmail(
            req.user.email,
            `Выгрузка движения запчастей за ${prettyStart} - ${prettyEnd}`,
            `Запрошенная выгрузка движения запчастей. `,
            [{ filename: `Движение_выгрузка_${start}_${end}.xlsx`, content: excel }]
        )
        res.json({ message: 'Отчет отправлен на вашу почту'})
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