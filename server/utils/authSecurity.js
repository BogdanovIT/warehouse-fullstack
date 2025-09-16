import LoginAttempt from "../models/LoginAttempt.js";
import LoginBlock from "../models/LoginBlock.js";
import { Op } from 'sequelize'

const BLOCK_CONFIG = {
    LEVEL_1: {
        attempts: 5,
        duration: 15*60*1000,
        type: '15min'
    },
    LEVEL_2: {
        attempts: 7,
        duration: 60*60*1000,
        type: '1hour'
    },
    LEVEL_3: {
        attempts: 10,
        duration: 24*60*60*1000,
        type: '24hours'
    }
}



export const checkLoginBlock = async (email, ipAddress) => {
    try {
        const now = new Date()
        const activeBlock = await LoginBlock.findOne({
            where: {
                [Op.or]: [{ email }, { ipAddress }],
                expiresAt: { [Op.gt]: now }
            },
            order: [['expiresAt', 'DESC']]
        })
        if (activeBlock) {
            return {
                blocked: true,
                blockType: activeBlock.blockType,
                expiresAt: activeBlock.expiresAt,
                attempts: activeBlock.attemptsCount
            }
        }
        return {blocked: false}
    } catch(error) {
        console.error('ошибка проверки блокировки:', error)
        return { blocked: false }
    }
}
export const addLoginAttempt = async (email, ipAddress, successful = false, userAgent = null) => {
    try {
        await LoginAttempt.create({
            email,
            ipAddress,
            successful,
            userAgent
        })
        if (!successful) {
            await checkAndApplyBlock(email, ipAddress)
        }
    } catch(error) {
        console.error('Ошибка добавления попытки входа:', error)
    }
}
const checkAndApplyBlock = async (email, ipAddress) => {
    try {
        const now = new Date()
        const attempts15min = await LoginAttempt.count({
            where: {
                [Op.or]: [{ email }, { ipAddress}],
                successful: false,
                createdAt: { [Op.gte]: new Date(now.getTime() - 15*60*1000) }
            }
        })
        const attempts1hour = await LoginAttempt.count({
            where: {
                [Op.or]: [{ email }, { ipAddress}],
                successful: false,
                createdAt: { [Op.gte]: new Date(now.getTime() - 60*60*1000) }
            }
        })
        const attempts24hour = await LoginAttempt.count({
            where: {
                [Op.or]: [{ email }, { ipAddress}],
                successful: false,
                createdAt: { [Op.gte]: new Date(now.getTime() - 24*60*60*1000) }
            }
        })
        let blockConfig = null
        if (attempts24hour >= BLOCK_CONFIG.LEVEL_3.attempts) {
            blockConfig = BLOCK_CONFIG.LEVEL_3
        } else if (attempts1hour >= BLOCK_CONFIG.LEVEL_2.attempts){
            blockConfig = BLOCK_CONFIG.LEVEL_2
        } else if (attempts15min >= BLOCK_CONFIG.LEVEL_1.attempts){
            blockConfig = BLOCK_CONFIG.LEVEL_1
        }
        if (blockConfig) {
            const existingBlock = await LoginBlock.findOne({
                where: {
                    [Op.or]: [{ email }, { ipAddress }],
                    expiresAt: { [Op.gt]:now }
                }
            })
            if (!existingBlock) {
                const expiresAt = new Date(now.getTime() + blockConfig.duration)
                await LoginBlock.create({
                    email,
                    ipAddress,
                    blockType: blockConfig.type,
                    attemptsCount: Math.max(attempts15min, attempts1hour, attempts24hour),
                    expiresAt
                })
                console.log(`Блокировка применена для ${email}: ${blockConfig.type} до ${expiresAt}`)
            }
        }
    } catch(error) {
        console.error("Ошибка применения блокировки:", error)
    }
}
export const cleanupOldRecords = async () => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000)
        const deletedBlock = await LoginBlock.destroy({
            where: {
                expiresAt: { [Op.lt]: new Date() }
            }
        })
        console.log('Очистка старых записей безопасности выполнена')
    } catch(error) {
        console.error('Ошибка очистки записей безопасности:', error)
    }
}
setInterval(cleanupOldRecords, 48*60*60*1000)
export const getBlockInfo = async (email, ipAddress) => {
    try {const blockInfo = await checkLoginBlock(email, ipAddress)

    if (blockInfo.blocked) {
        const now = new Date()
        const timeLeftMs = blockInfo.expiresAt - now
        const timeLeftMins = Math.ceil(timeLeftMs/1000/60)
        let timeLeftText
        if (timeLeftMins > 60*24) {
            timeLeftText = `${Math.ceil(timeLeftMins / 60 / 24)} дней`
        } else if (timeLeftMins > 60) {
            timeLeftText = `${Math.ceil(timeLeftMins / 60)} часов`
        } else { timeLeftText = `${timeLeftMins} минут`}
        return {
            blocked: true,
            message: `Слишком много неудачных попыток входа. Попробуйте через ${timeLeftText}`,
            expiresAt: blockInfo.expiresAt,
            attempts: blockInfo.attempts
        }
    }
    return { blocked: false }
    }catch(error) {
        console.error("Ошибка получения информации о блокировке", error)
        return { blocked: false }
    }
}