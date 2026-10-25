import { Op } from "sequelize";
import Movement from "../models/Movement.js";
import MovementItem from "../models/MovementItem.js";
import Employee from "../models/Employee.js";
import { generateMovementExcel } from "./movementExcelGenerator.js";
import emailService from "./emailService.js";
import { MOVEMENT_REPORT_EMAILS } from "../config/department.js";
export const generateAndSendMovementReports = async () => {
    const today = new Date().toISOString().split('T')[0]
    const prettyDate = new Date().toLocaleDateString('ru-RU')
    console.log(`[Движение] Запуск отчета за ${prettyDate}`)
    const movements = await Movement.findAll({
        where: {
            createdAt: {
                [Op.gte]: new Date(`${today}T00:00:00`),
                [Op.lt]: new Date(`${today}T23:59:59`)
            },
        },
        include: [
            { model: Employee, attributes: ['fullName'] },
            { model: MovementItem, as: 'items', attributes: ['qrData'] },            
        ],
        order: [['createdAt', 'ASC']],
    })
    const grouped = {}
    for (const m of movements) {
        const dept = m.department || 'Не указано'
        if (!grouped[dept]) grouped[dept] = []
        grouped[dept].push(m)
    }
    const departments = Object.keys(grouped)
    if (departments.length === 0) {
        console.log('[Движение] Движений за день нет')
        return
    }
    for (const dept of departments) {
        const excel = await generateMovementExcel(dept, prettyDate, grouped[dept])
        try {
            await emailService.sendEmail(
                MOVEMENT_REPORT_EMAILS.join(', '),
                `Движение запчастей по ${dept} за ${prettyDate}`,
                `Отчет по движению запчастей за ${prettyDate}.`,
                [{ filename: `Движение_${dept}_${today}.xlsx`, content: excel }]
            )
            console.log(`[Движение] Отчет отправлен: ${dept}`)
        } catch (error) {
            console.error(`[Движение] Ошибка отправки (${dept}):`, error.message)
        }
    }
    console.log(`[Движение] Завершено. Подразделений: ${departments.length}`)
}