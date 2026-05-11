import { User, Role } from "../models/index.js";
import chozRabota from "../models/chozRabota.js";
import { ADMINS } from "../config/department.js";
import { generateExcel } from "./excelGenerator.js";
import emailService from "./emailService.js";

const getDirectorEmail = async (department) => {
    const director = await User.findOne({
        include: [{
            model: Role,
            as:'roles',
            where: {code: ['director', 'superuser']},
            through: { attributes: [] }
        }],
        where: {place: department},
        attributes: ['email'],
    })
    return director?.email || null
}
export const generateAndSendReports = async () => {
    const today = new Date().toISOString().split('T')[0]
    const prettyDate = new Date().toLocaleDateString('ru-RU')
    console.log(`[Отчет] Запуск формирования отчетов за ${prettyDate}`)
    const allRecords = await chozRabota.findAll({
        where: { workDate: today},
        order: [['department', 'ASC'], ['createdAt', 'ASC']],
    })
    const grouped = {}
    for (const record of allRecords) {
        const dept = record.department || 'Не указано'
        if (!grouped[dept]) grouped[dept] = []
        grouped[dept].push(record)
    }
    const departments = Object.keys(grouped)
    if (departments.length === 0) {
        const emptyExcel = await generateExcel(`Хозработы - ${prettyDate}`, [])
        for (const admin of ADMINS) {
            try {
                await emailService.sendEmail(
                    admin,
                    `Хозработы за ${prettyDate} не производились`,
                    `${prettyDate} хозяйственных работ по складам не заявлено`,
                    []
                )
                console.log(`Нулевой отчет отправлен администратору ${admin}`)
            } catch (error) {
                console.error(`Ошибка отправки отчета администратору ${admin}:`, error.message)
            }
        }
        console.log(`[Отчет] Завершено. Записей за день нет`)
        return
    }
    for (const department of departments) {
        const directorEmail = await getDirectorEmail(department)
        const records = grouped[department]
        try {
            const excel = await generateExcel(
                `Хозработы по ${department} - ${prettyDate}`,
                records
            )
            if (directorEmail) {
                await emailService.sendEmail(
                    directorEmail,
                    `Хозработы по ${department} - ${prettyDate}`,
                    `Отчет по хозяйственным работам по ${department} за ${prettyDate}`,
                    [{ filename: `Хозработы_${department}_${today}.xlsx`, content: excel }],
                )
                console.log(`[Отчет] Отправлено руководителю ${department}: ${directorEmail}`)
            } else {
                console.warn(`[Отчет] Руководитель ${department} не найден. Отчет не был отправлен`)
            }
        } catch (error) {
            console.error(`[Отчет] Ошибка при обработке ${department}`, error.message)
        }
    }
    try {
        const summaryExcel = await generateExcel(
            `Хозработы, сводный отчет за ${prettyDate}`,
            allRecords
        )
        
            try {
                await emailService.sendEmail(
                    ADMINS.join(', '),
                    `Хозработы, сводный отчет за ${prettyDate}`,
                    `Сводный отчет по хозработам по всем подразделениям за ${prettyDate}.`,
                    [{ filename: `Хозработы_сводный_${today}.xlsx`, content: summaryExcel }],
                )
                console.log(`Сводный отчет отправлен администраторам`)
            } catch (error) {
                console.error(`Ошибка отправки отчета администраторам:`, error.message)
            }
        }
     catch (error) {
        console.error('Ошибка при создании сводного отчета', error.message)
    }
    console.log(`[Отчет] Завершено. Обработано подразделений: ${departments.length}`)
}