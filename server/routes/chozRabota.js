import express from 'express'
import { createRecord } from '../controllers/chozRabotaController.js'
import  authMiddleware  from '../middlewares/authMiddleware.js'
import { requireRole } from '../middlewares/roleMiddleware.js'
import { Op } from 'sequelize'
import chozRabota from '../models/chozRabota.js'
import Employee from '../models/Employee.js'
import { generateExcel } from '../services/excelGenerator.js'
import emailService from '../services/emailService.js'
import { ADMINS } from '../config/department.js'

const router = express.Router()
router.use(authMiddleware)

router.post('/', requireRole('director', 'superuser'), createRecord)

router.get('/export', requireRole('director', 'superuser'), async (req, res) => {
    try {
        const { startDate, endDate, department, employeeId, notifyAdmins, selectedAdmins } = req.query
        const toServerDate = (date) =>{
            console.log('tServerDate input:', date)
            if (!date) return date
            const parts = date.split('.')
            console.log('parts', parts)
            if (parts.length === 3) {
                const result = `${parts[2]}-${parts[1]}-${parts[0]}`
                console.log('toServerDate output', result) 
                return result
            }
            return date
        }
        const isSuperuser = req.user.roleCodes.includes('superuser')

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'укажите начало и окончание периода' })
        }
        const where = {
            workDate: { [Op.between]: [toServerDate(startDate), toServerDate(endDate)] }
        }
        if (!isSuperuser) {
            where.department = req.user.place
        } else if (department) {
            where.department = department
        }
        if (employeeId && employeeId !== '') {
            const parsed = parseInt(employeeId, 10)
            where.employeeId = parsed
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
        if (notifyAdmins === 'true' && selectedAdmins) {
            const adminsToNotify = selectedAdmins.split(',').filter(a => ADMINS.includes(a.trim()))
            for (const admin of adminsToNotify) {
                await emailService.sendEmail(
                    admin.trim(),
                    `Копия: Выгрузка хозработ ${startDate} - ${endDate} (от ${req.user.email})`,
                    `Копия выгрузки за период, запрошенный пользователем ${req.user.email}.`,
                    [{ filename: `Хозработы_выгрузка.xlsx`, content: excel }]
                )
            }
        }
        res.json({ message: 'Отчет отправлен на вашу почту' })
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message })
    }
})

export default router