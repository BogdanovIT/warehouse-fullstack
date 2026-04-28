import cron from 'node-cron'
import { generateAndSendReports } from './reportService.js'
cron.schedule('0 17 * * *', async () => {
    console.log('[Планировщик] Запуск по расписанию...')
    try {
        await generateAndSendReports()
    } catch (error) {
        console.error('[Планировщик] Критическая ошибка', error)
    }
}, {
    timezone: 'Europe/Moscow',
})
console.log('[Планировщик] Настроен на 20:00 МСК ежедневно')