import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js'
import { requireRole } from '../middlewares/roleMiddleware.js'
import Attendance from '../models/Attendance.js'
import Employee from '../models/Employee.js'
import { Op, where } from 'sequelize'

const router = express.Router()
router.use(authMiddleware)

router.get('/:date', async (req, res) => {
    try {
        const { date } = req.params
        const department = req.user.place
        const employees = await Employee.findAll({
            where: { department, isActive: true},
            order: [[ 'fullName', 'ASC' ]],
        })
        const existing = await Attendance.findAll({
            where: { department, date },
            include: [{ model: Employee, attributes: ['id', 'fullName'] }],
        })
        const attendanceMap = {}
        existing.forEach(a => { attendanceMap[a.employeeId] = a })
        const result = employees.map(emp => {
            const att = attendanceMap[emp.id]
            return att ? {
                id: att.id,
                employeeId: emp.id,
                fullName: emp.fullName,
                shortName: emp.shortName,
                position: emp.position,
                status: att.status,
                standartHours: att.standartHours,
                overtimeHours: att.overtimeHours,
                businessTripHours: att.businessTripHours,
                comment: att.comment
            } : {
                id: undefined,
                employeeId: emp.id,
                fullName: emp.fullName,
                shortName: emp.shortName,
                position: emp.position,
                status: 'present',
                standartHours: 8.0,
                overtimeHours: 0,
                businessTripHours: 0,
                comment: ''
            }
        })
        res.json(result)
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message})
    }
})
router.post('/:date', requireRole('director', 'superuser'), async (req, res) => {
    try {
        const { date } = req.params
        const { records } = req.body
        const department = req.user.place
        const createdBy = req.user.email
        const saved = []
        for (const rec of records) {
            const existing = await Attendance.findOne({
                where: {
                    employeeId: rec.employeeId,
                    date,
                }
            })
            if (existing) {
                await existing.update({
                    status: rec.status,
                    standartHours: rec.standartHours,
                    overtimeHours: rec.overtimeHours,
                    businessTripHours: rec.businessTripHours || 0,
                    comment: rec.comment || '',
                    createdBy,
                })
                saved.push(existing)
            } else {
                const created = await Attendance.create({
                    employeeId: rec.employeeId,
                    department,
                    date,
                    status: rec.status,
                    standartHours: rec.standartHours,
                    overtimeHours: rec.overtimeHours,
                    businessTripHours: rec.businessTripHours || 0,
                    comment: rec.comment || '',
                    createdBy,
                })
                saved.push(created)
            }
            
        }
        res.status(201).json({ message: 'Табель сохранен', count: saved.length })
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message})
    }
})

export default router