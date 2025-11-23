import 'dotenv/config'
import express, { text } from 'express'
import cors from 'cors'
import sequelize from './config/db.js'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

import emailService from './services/emailService.js'
import templateService from './services/templateService.js'
import fileService from './services/fileService.js'

import userRoutes from './routes/userRoutes.js'
import authRoutes from './routes/authRoutes.js'
import MeRoute from './routes/MeRoute.js'
import productRout from './routes/products.js'
import restorePass from './routes/restorePass.js'

import User from './models/User.js'
import VerificationCode from './models/VerificationCode.js'
import Course from './models/Courses.js'
import { Op } from 'sequelize'
import { cleanupOldRecords } from './utils/authSecurity.js'
import { checkPasswordExpiration } from './middlewares/passwordExpiration.js'
import checkBlocked from './middlewares/checkBlocked.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 8081

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = '/home/abogdanov/Mobile_Storekeeper/temp_uploads'
        fileService.ensureDirectoryExists(uploadDir)
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})
const upload = multer({ storage })

app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({extended: true}))
app.use(cors({
    origin: true,
    credentials: true,
    exposedHeaders: ['Authorization']
}))
app.use('/static', express.static('/home/abogdanov/Mobile_Storekeeper/public'))

const validateEmails = (emails) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const addresses = Array.isArray(emails) ? emails :  String(emails).split(',')
    return addresses.every(addr => emailRegex.test(addr.trim()))
}

const generateVerificationCode = (length = 6) => {
    return Math.random().toString().substring(2, 2 + length)
}

app.use('/api/users', userRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', MeRoute)
app.use('/api/products', productRout)
app.get('/api/verify-test', (req,res) => {
    const token = jwt.sign({ test: true}, process.env.JWT_SECRET)
    const valid = jwt.verify(token, process.env.JWT_SECRET)
    res.json({generated: token, verified: valid})
})
app.use('/api/auth', restorePass)
app.use(checkPasswordExpiration)
app.use(checkBlocked)

app.post('/api/users/send-verification', async (req,res) => {
    try {
        const email = req.body.email
        if ( !email || !email.endsWith('@breez.ru')) {
            return res.status(400).json({
                success: false,
                error: 'Только email домена @breez.ru допускаются для регистрации'
            })
        }
        const existingUser = await User.findOne({where: {email}})
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: "Пользователь с таким email уже существует"
            })
        }
        const code = generateVerificationCode()
        const expiresAt = new Date(Date.now()+15*60*1000)
        await VerificationCode.destroy({
            where: {email}
        })
        await VerificationCode.create({
            email,
            code,
            expiresAt
        })
        await emailService.sendConfirmationCode(email, code)
        res.json({
            success: true,
            message: "Код подтверждения отправлен на указанный email"
        })
    } catch(error) {
        console.error('Ошибка отправки кода верификации:', error)
        res.status(500).json({
            success: false,
            error: "Внутренняя ошибка сервера"
        })
    }
})

app.post('/api/users/verify-code', async (req, res) => {
    try {
        const {email, code} = req.body
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                error: 'Email и код обязательны'
            })
        }
        const verificationCode = await VerificationCode.findOne({
            where: {
                email,
                code,
                used: false,
                expiresAt: { [Op.gt]: new Date() }
            }
        })
        if (!verificationCode) {
            return res.status(400).json({
                success: false,
                error: "Неверный или просроченный код"
            })
        }
        await verificationCode.update({used: true})
        res.json({
            success: true,
            message: 'Email успешно подтвержден'
        })
    } catch(error) {
        console.error('Ошибка проверки кода:', error)
        res.status(500).json({
            success: false,
            error: "Внутренняя ошибка сервера"
        })
    }
})

app.post('/api/brakodel/send', upload.array('photos'), async (req, res) => {
    const tempFilesToDelete = []

    try {
        if (!req.body.data) {
            return res.status(400).json({ error: "Отсутствуют данные"})
        }
        const { data, recipients } = req.body
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data
        
        const excelBuffer = await templateService.generateDefectExcel(parsedData)
        
        const attachments = [{
            filename: "Акт дефектовки.xlsx",
            content: excelBuffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }]

        if (req.files && req.files.length >0) {
            for (const file of req.files) {
                const fileBuffer = await fileService.readFile(file.path)
                attachments.push({
                    filename: file.originalname,
                    content: fileBuffer,
                    contentType: file.mimetype
                })
                tempFilesToDelete.push(file.path)
            }
        }
        let emails = []
        try {
            emails = Array.isArray(recipients) ? recipients : JSON.parse(recipients || '[]')
            if (!Array.isArray(emails) || emails.length === 0) {
                throw new Error ("Нет валидных получателей")
            }
        } catch(error) {
            throw new Error ("Нет валидных получателей")
        }
        await emailService.sendDefectAkt(emails, parsedData, attachments)
        res.json({
            success: true,
            message: "Письмо отправлено"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || "Внутренняя ошибка сервера"
        })
    } finally {
            await Promise.all (
                tempFilesToDelete.map(filePath =>
                    fs.promises.unlink(filePath).catch(e =>
                        console.error(`Ошибка удаления файла ${filePath}:`, e))
                )
            )
    }
})
app.post('/api/shipment/send', async (req, res) => {
    try {
        console.log('Shipment send called with:', {
            gateNumber: req.body.gateNumber,
            recipients: req.body.recipients,
            processPhotosCount: req.body.processPhotos?.length,
            defectivePhotosCount: req.body.defectivePhotos?.length
        })
        const { photoPaths, gateNumber, recipients} = req.body
        if (!photoPaths?.length) {
            return res.status(400).json({error: "Нет фотографий для отправки"})
        }
        const attachments = []
        for (const relativePath of photoPaths) {
            const fullPath = path.join('/home/abogdanov/Mobile_Storekeeper', relativePath)
            if(!fs.existsSync(fullPath)) {
                console.warn(`Файл не найден:, ${fullPath}`)
                continue
            }
            const fileBuffer = await fileService.readFile(fullPath)
            attachments.push({
                filename: `Отгрузка_${path.basename(relativePath)}`,
                content: fileBuffer,
                contentType: 'image/jpeg'
            })
        }
        if (attachments.length === 0) {
            return res.status(400).json({error: 'Нет доступных файлов для отправки'})
        }
        await emailService.sendShipmentReport(recipients, gateNumber, attachments)
        for (const relativePath of photoPaths) {
            const fullPath = path.join('/home/abogdanov/Mobile_Storekeeper', relativePath)
            await fileService.deleteFile(fullPath)
        }
            res.json({success: true})
    } catch (error) {
        res.status(500).json({ error: error.message})
    }
})
app.post('/api/receiving/send', async (req, res) => {    
    try {
        console.log('Receiving send called with:', {
            gateNumber: req.body.gateNumber,
            recipients: req.body.recipients,
            processPhotosCount: req.body.processPhotos?.length,
            defectivePhotosCount: req.body.defectivePhotos?.length
        })
        const { gateNumber, recipients, processPhotos, defectivePhotos } = req.body
        const processAttachments = []
        const defectiveAttachments = []
        
        for (const relativePath of processPhotos || []) {
            const fullPath = path.join('/home/abogdanov/Mobile_Storekeeper', relativePath)
            if(await fileService.fileExists(fullPath)) {
                const fileBuffer = await fileService.readFile(fullPath)
                processAttachments.push({
                    filename: `Приемка процесс ${path.basename(relativePath)}`,
                    content: fileBuffer,
                    contentType: 'image/jpeg'
                })
            }
        }
        for (const relativePath of defectivePhotos || []) {
            const fullPath = path.join('/home/abogdanov/Mobile_Storekeeper', relativePath)
            if(await fileService.fileExists(fullPath)) {
                const fileBuffer = await fileService.readFile(fullPath)
                defectiveAttachments.push({
                    filename: `Приемка брак ${path.basename(relativePath)}`,
                    content: fileBuffer,
                    contentType: 'image/jpeg'
                })
            }
        }
        if (processAttachments.length === 0 && defectiveAttachments.length === 0) {
            return res.status(400).json({error: 'Нет доступных файлов для отправки'})
        }
        await emailService.sendReceivingReport(recipients, gateNumber, processAttachments, defectiveAttachments)
        const allPhotos = [...processPhotos, ...defectivePhotos]
        for (const relativePath of allPhotos) {
            const fullPath = path.join('/home/abogdanov/Mobile_Storekeeper', relativePath)
            await fileService.deleteFile(fullPath)
        }
        res.json({success: true, emailSent: true})
    } catch (error) {
        res.status(500).json({ error: error.message})
    }
})
app.get('/api/test-email', async (req, res) => {
    try {
        console.log('TEST EMAIL CALLED - это должно быть в логах!');
        await emailService.sendEmail(
            'test@example.com', 
            'Test Subject', 
            '<h1>Test</h1>'
        );
        res.json({ success: true });
    } catch (error) {
        console.error('EMAIL ERROR:', error);
        res.json({ error: error.message });
    }
});

app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: {
                type: 'course',
                is_active: true
            },
            order: [['order_index', 'ASC']],
            raw: true
        })
        res.json(courses)
    } catch(error) {
        console.error('Database error', error)
        res.status(500).json({error: "Internal server error"})
    }
})
app.get('/api/tests', async (req, res) => {
    try {
        const tests = await Course.findAll({
            where: {
                type: 'test',
                is_active: true
            },
            order: [['order_index', 'ASC']],
            raw: true
        })
        res.json(tests)
    } catch(error) {
        console.error('Database error', error)
        res.status(500).json({error: "Internal server error"})
    }
})

const cleanOldFiles = async () => {
    const dir = path.join('/home/abogdanov/Mobile_Storekeeper/generated')
    if (!fs.existsSync(dir)) return
    const files = await fs.promises.readdir(dir)
    const now = Date.now()
    const maxAge = 24*60*60*1000
    for (const file of files) {
        const filePath = path.join(dir, file)
        const stats = await fs.promises.stat(filePath)
        if (now - stats.mtimeMs > maxAge) {
            await fs.promises.unlink(filePath)
        }
    }
}

app.get('/api/debug/token', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        res.json({ valid: true, decoded})
    } catch (e) {
        res.json({
            valid: false,
            error: e.message,
            secret: process.env.JWT_SECRET ? 'exists' : 'missing'
        })
    }
})

app.get('/api/user/operators', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Требуется авторизация'
            })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                success: false,
                error: "Неправильный токен"
            })
        }
        const user = await User.findByPk(decoded.userId, {
            attributes: ['id', 'operators' ],
            raw: true
        })
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "Пользователь не найден"
            })
        }
        let operators = []
        try {
            operators = typeof user.operators === 'string'
            ? JSON.parse(user.operators)
            : user.operators || []
        } catch(err) {
            console.error('Ошибка поиска операторов', err)
            operators = []
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const validOperators = operators.filter(op => emailRegex.test(op))
        if (validOperators.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Не найдено валидных email операторов в профиле"
            })
        }
        res.json({
            success: true,
            operators: validOperators
        })
    } catch (error) {
        console.error("Ошибка получения операторов:", error)
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: "Неверный токен"
            })
        }
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
    }
})

app.post('/api/upload-temp-photos', upload.array('photos'), async (req,res) => {
    console.log('Upload temp photos called, files:', req.files?.length)
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: " No files uploaded"})
        }
        const savedPaths = []

        for (const file of req.files) {
            const filename = `Photo_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`
            const newPath = path.join('/home/abogdanov/Mobile_Storekeeper/temp_uploads', filename)
            await fileService.moveFile(file.path, newPath)
            savedPaths.push(`/temp_uploads/${filename}`)
        }
        res.json({success: true, savedPaths})
    } catch (error) {
        console.error("Ошибка загрузки:", error)
        res.status(500).json({success: false, message: "Ошибка загрузки файла"})
    }
})

const cleanExpiredVerificationCodes = async () => {
    try {
        const deletedCount = await VerificationCode.destroy({
            where: {
                expiresAt: { [Op.lt]: new Date() }
            }
        })
        console.log(`Удалено ${deletedCount} просроченных кодов верификации`)
    } catch(error) {
        console.error('Ошибка очистки кодов верификации', error)
    }
}
setInterval(cleanExpiredVerificationCodes, 60*60*1000)
setInterval(cleanupOldRecords, 24*60*60*1000)     
setInterval(cleanOldFiles, 24*60*60*1000)     

async function checkTables() {
    const tables = ['users', 'products']
    for (const table of tables) {
        try {
            const [result] = await sequelize.query(`SELECT 1 FROM ${table} LIMIT 1;`)
        } catch (e) {
            console.error(`Error check table ${table}:`, e.message)
        }
    }
}

async function initialize() {
    try {
        await sequelize.authenticate()

        await sequelize.sync()

        await checkTables()

        app.listen(PORT, '0.0.0.0',() => {
            console.log(`Server started at port ${PORT}`)
        }).on('error', (err) => {
            throw new Error(`Server's error: ${err.message}`)
        })
    } catch (error) {
        console.error('Fatality error', error)
        process.exit(1)
    }
}
initialize()