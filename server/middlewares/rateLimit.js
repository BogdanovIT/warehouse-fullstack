import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 10,
    message: {
        error: 'Слишком много попыток входа',
        code: 'TOO_MANY_REQUESTS'
    },
    standardHeaders: true,
    legacyHeaders: false
})
export const apiLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 100,
    message: {
        error: 'Слишком много запросовюПопробуйте позже',
        code: 'RATE_LIMIT_EXCEEDED'
    }
})