import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = express.Router()
router.use(authMiddleware)

import Employee from "../models/Employee.js";
router.get('/', async (req, res) => {
    try {
        const department = req.user.place
        const employees = await Employee.findAll({
            where: {department, isActive: true},
            order: [['fullName', 'ASC']]
        })
        res.json(employees)
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message})
    }
})
router.post('/', requireRole('director', 'superuser'), async (req, res) => {
    try {
        const { fullName, shortName, loginLv, position, isHourly} = req.body
        const employee = await Employee.create({
            fullname,
            shortName: shortName || null,
            loginLv: loginLv || null,
            position: position || null,
            department: req.user.place,
            isHourly: isHourly !== undefined ? isHourly : true
        })
        res.status(201).json(employee)
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message})
    }
})
router.put('/:id', requireRole('director', 'superuser'), async (req, res) => {
    try {
        const { id } = req.params
        const { fullName, shortName, loginLv, position, isHourly, isActive } = req.body
        const employee = await Employee.findByPk(id)
        if (!employee) {
            return res.status(404).json({message: 'Сотрудник не найден'})
        }
        await employee.update({
            fullName: fullName || employee.fullName,
            shortName: shortName !== undefined ? shortName : employee.shortName,
            loginLv: loginLv !== undefined ? loginLv : employee.loginLv,
            position: position !== undefined ? position : employee.position,
            isHourly: isHourly !== undefined ? isHourly : employee.isHourly,
            isActive: isActive !== undefined ? isActive : employee.isActive
        })
        res.json(employee)
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message})
    }
})

export default router