import cron from 'node-cron'
import { generateAndSendReports } from './reportService.js'
cron.schedule('30 16 * * *', async () => {
    console.log('[Планировщик] Запуск по расписанию...')
    try {
        await generateAndSendReports()
    } catch (error) {
        console.error('[Планировщик] Критическая ошибка', error)
    }
})
console.log('[Планировщик] Настроен на 16:30 МСК ежедневно')