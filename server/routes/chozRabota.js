import express from 'express'
import { createRecord } from '../controllers/chozRabotaController.js'
import  authMiddleware  from '../middlewares/authMiddleware.js'
import { requireRole } from '../middlewares/roleMiddleware.js'
import { Op } from 'sequelize'
import chozRabota from '../models/chozRabota.js'
import Employee from '../models/Employee.js'
import { generateExcel } from '../services/excelGenerator.js'
import emailService from '../services/emailService.js'

const router = express.Router()
router.use(authMiddleware)

router.post('/', requireRole('director', 'superuser'), createRecord)

router.get('/export', requireRole('director', 'superuser'), async (req, res) => {
    try {
        const { startDate, endDate, department, employeeId } = req.query
        const isSuperuser = req.user.roleCodes.includes('superuser')

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'укажите начало и окончание периода' })
        }
        const where = {
            workDate: { [Op.between]: [startDate, endDate] }
        }
        if (!isSuperuser) {
            where.department = req.user.place
        } else if (department) {
            where.department = department
        }
        if (employeeId) {
            where.employeeId = parseInt(employeeId)
        }
        const records = await chozRabota.findAll({
            where,
            order: [['workDate', 'ASC'], ['employeeName', 'ASC']],
            include: [{ model: Employee, attributes: ['fullName'] }],
        })
        const title = !isSuperuser
            ? `Хозработы - ${req.user.place}`
            : (department ? `Хозработы - ${department}` : "Все хозработы по подразделению")
        const excel = await generateExcel(
            `${title} - ${startDate} / ${endDate}`,
            records
        )
        await emailService.sendEmail(
            req.user.email,
            `Выгрузка хозработ ${startDate} - ${endDate}`,
            `Запрошенная выгрузка за период`,
            [{ filename: `Хозработы_выгрузка.xlsx`, content: excel }]
        )
        res.json({ message: 'Отчет отправлен на вашу почту' })
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message })
    }
})

export default router