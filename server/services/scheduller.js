import cron from 'node-cron'
import { generateAndSendReports } from './reportService.js'
import { generateAndSendMovementReports } from './movementReportService.js'

cron.schedule('30 16 * * *', async () => {
    console.log('[Планировщик] Запуск по расписанию...')
    try {
        await generateAndSendReports()
    } catch (error) {
        console.error('[Планировщик] Критическая ошибка', error)
    }
})
cron.schedule('30 16 * * *', async () => {
    console.log('[Планировщик] Запуск отчета по движению запчастей...')
    try {
        await generateAndSendMovementReports()
    } catch (error) {
        console.error('[Планировщик] Ошибка отчета движения', error)
    }
})
console.log('[Планировщик] Настроен: Хозработы на 16:30 МСК ежедневно, Движение запчастей на 16:30 МСК ежедневно')