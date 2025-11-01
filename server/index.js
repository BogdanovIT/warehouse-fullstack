import 'dotenv/config'
import express, { text } from 'express'
import cors from 'cors'
import sequelize from './config/db.js'
import userRoutes from './routes/userRoutes.js'
import authRoutes from './routes/authRoutes.js'
import MeRoute from './routes/MeRoute.js'
import jwt from 'jsonwebtoken'
import productRout from './routes/products.js'
import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createTransport } from 'nodemailer'
import restorePass from './routes/restorePass.js'
import multer from 'multer'
import User from './models/User.js'
import VerificationCode from './models/VerificationCode.js'
import { Op } from 'sequelize'
import { cleanupOldRecords } from './utils/authSecurity.js'
import { checkPasswordExpiration } from './middlewares/passwordExpiration.js'
import Course from './models/Courses.js'
import checkBlocked from './middlewares/checkBlocked.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 8081
const transporter = createTransport({
    host: process.env.EMAIL_HOST,
    port: 443,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})
try {
    console.log("Testing SMTP connection...")
    await transporter.verify()
    console.log("SMTP connection successfull")
} catch(error) {
    console.error("SMTP connection failed:", error)
    console.log("Error details:", {
        code: error.code,
        command: error.command,
        response: error.response
    })
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join('/home/abogdanov/Mobile_Storekeeper/temp_uploads')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir)
        }
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})
const upload = multer({ storage })
const sendEmailWithAttachments = async (options) => {
    const {to, subject, text, attachments} = options
    try {
        const recipients = Array.isArray(to) ? to : [to].filter(Boolean)
        if (recipients.length === 0) {
            throw new Error("Нет получателей")
        }
        await transporter.sendMail({
            from: `"Мобильный кладовщик" <${process.env.EMAIL_USER}>`,
            to: recipients.join(', '),
            subject,
            text,
            attachments
        })
        return true
    } catch (error) {
        console.error("Ошибка отправки письма:", error)
        return false
    }
}

async function generateExcelFromTemplate(parsedData) {
    const templatePath =path.join('/home/abogdanov/Mobile_Storekeeper', 'assets/template.xlsx')
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.readFile(templatePath)
        const worksheet = workbook.getWorksheet(1)
        worksheet.getCell('A4').value = parsedData.currentDate
        worksheet.getCell('A33').value = parsedData.numberSSCC
        worksheet.getCell('BD123').value = parsedData.numberSSCC
        worksheet.getCell('BD3').value = parsedData.place
        worksheet.getCell('AV26').value = parsedData.docNumber
        worksheet.getCell('A38').value = [parsedData.inputValuePrefix,parsedData.articleCode].join('')
        worksheet.getCell('X33').value = parsedData.productName
        worksheet.getCell('R51').value = parsedData.comment
        worksheet.getCell('D44').value = parsedData.serialNumber
        worksheet.getCell('A51').value = parsedData.sortValue
        worksheet.getCell('AH11').value = parsedData.docPrefix
        worksheet.getCell('AH11').alignment ={horizontal: 'left'}
        worksheet.getCell('B65').value = parsedData.cell

        return workbook.xlsx.writeBuffer()
}
app.get('/api/test', (req, res) => {
    res.json({ status: 'API работает!' });
  });
app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({extended: true}))
app.use(cors({
    origin: true,
    credentials: true,
    exposedHeaders: ['Authorization']
}))
app.use('/static', express.static('/home/abogdanov/Mobile_Storekeeper/public'))
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

app.post('/api/brakodel/send', upload.array('photos'), async (req, res) => {
    let excelPath = ''
    const files = req.files || []
    const tempFilesToDelete = []

    try {
        if (!req.body.data) {
            return res.status(400).json({ error: "Отсутствуют данные"})
        }
        const { data, recipients } = req.body
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data
        if (parsedData.photoPaths.length > 0) {
            parsedData.photoPaths = parsedData.photoPaths.map(relativePath => {
                const fullPath = path.join('/home/abogdanov/Mobile_Storekeeper', relativePath)
                tempFilesToDelete.push(fullPath)
                return fullPath
            })
        }
        const excelBuffer = await generateExcelFromTemplate(parsedData)
        excelPath = path.join('/home/abogdanov/Mobile_Storekeeper/generated', `defect_${Date.now()}.xlsx`)
        await fs.promises.writeFile(excelPath, excelBuffer)
        tempFilesToDelete.push(excelPath)

        let emails = []        
        
        try {
            emails = Array.isArray(recipients) ? recipients : JSON.parse(recipients || '[]')
            if (!Array.isArray(emails) || emails.length === 0) {
                throw new Error("Нет валидных получателей")
            }
        } catch (error) {
            throw new Error("Нет валидных получателей")
        }
        if (files.length > 0) {
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif']
            for (const file of files) {
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    throw new Error(`Недопустимый тип файла: ${file.originalname}`)
                }
                tempFilesToDelete.push(file.path)
            }
        }        
        
        const generateDir = path.join('/home/abogdanov/Mobile_Storekeeper/generated')
        if (!fs.existsSync(generateDir)) {
            await fs.promises.mkdir(generateDir, {recursive: true})
        }
                
        const attachments = [
            {
                filename: "Акт дефектовки.xlsx",
                path: excelPath
            },
            ...files.map(file => ({
                filename: file.originalname,
                path: file.path,
                contentType: file.mimetype
            }))
        ]
        const emailSent = await sendEmailWithAttachments({
            from: `"Мобильный кладовщик"<${process.env.EMAIL_USER}>`,
            to: emails,
            subject: `Акт дефектовки ${data.docNumber || ''}`,
            text: "Акт дефектовки во вложении",
            attachments
        })
        if (!emailSent) {
            throw new Error("Не удалось отправить письмо")
        }
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
        try {
            await Promise.all (
                tempFilesToDelete.map(filePath =>
                    fs.promises.unlink(filePath).catch(e =>
                        console.error(`Ошибка удаления файла ${filePath}:`, e))
                )
            )
        } catch (cleanupError) {
            console.error("Ошибка при удалении файлов", cleanupError)
        }
    }
})
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
        const emailSent = await sendEmailWithAttachments({
            to: email,
            subject: "Код подтверждения регистрации",
            text: `Ваш код подтверждения: ${code}\nКод действителен в течение 15 минут.`
        })
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                error: "Не удалось отправить код подтверждения"
            })
        }
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

app.post('/api/generate-excel', async (req, res) => {
    let filePath = ''
    try {
        const { data, email } = req.body
        if (!email || !validateEmails(email)) {
            throw new Error("Не указаны или не валидны адреса получателей")
        }
        const recipients = Array.isArray(email) ? email.join(', ') : email
        
        const fileName = `defect_${Date.now()}.xlsx`
        const filePath = path.join('/home/abogdanov/Mobile_Storekeeper/generated', fileName)
        if (!fs.existsSync(path.join('/home/abogdanov/Mobile_Storekeeper/generated'))) {
            fs.mkdirSync(path.join('/home/abogdanov/Mobile_Storekeeper/generated'))
        }
        await fs.promises.writeFile(filePath, buffer)
        await transporter.sendMail({
            from: `"Мобильный кладовщик"<${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Акт дефектовки",
            text: "Это письмо создано автоматически. Если вы не запрашивали его создание, или оно попало к вам случайно, просто удалите его",
            attachments: [{
                filename: "Акт дефектовки.xlsx",
                path: filePath
            }]
        })
        await fs.promises.unlink(filePath)
        res.json({
            success: true,
            message: "Файл отправлен"
        })
    } catch (error) {
        if (filePath && fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath).catch(console.error)
        }
        console.error('[Index.js 73] Error', error)
        res.status(500).send('Generation failed')
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
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: " No files uploaded"})
        }
        const savedPaths = []
        const tempDir = path.join('/home/abogdanov/Mobile_Storekeeper/temp_uploads')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, {recursive: true})
        }
        req.files.forEach((file, index) => {
            const formatDate = (d) => [
                'Photo_',
                d.getDate().toString().padStart(2, '0'), '.',
                (d.getMonth()+1).toString().padStart(2, '0'), '.',
                d.getFullYear(), '_',
                d.getHours().toString().padStart(2, '0'), '-',
                d.getMinutes().toString().padStart(2, '0'), '-',
                d.getSeconds().toString().padStart(2, '0'),
                `_${index.toString().padStart(3, '0')}`,
                path.extname(file.originalname).toLowerCase()
            ].join('')
            const filename = formatDate(new Date())
            const filePath = path.join(tempDir, filename)
            fs.promises.rename(file.path, filePath)
            savedPaths.push(`/temp_uploads/${filename}`)
        })
        res.json({success: true, savedPaths})
    } catch (error) {
        console.error("Ошибка загрузки:", error)
        res.status(500).json({success: false, message: "Ошибка загрузки файла"})
    }
})

app.post('/api/shipment/send', async (req, res) => {
    try {
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
            attachments.push({
                filename: `Отгрузка_${path.basename(relativePath)}`,
                path: fullPath
            })
        }
        if (attachments.length === 0) {
            return res.status(400).json({error: 'Нет доступных файлов для отправки'})
        }
        const emailSent = await sendEmailWithAttachments({
            to: recipients,
            subject: `Фотоотчет отгрузка - Ворота ${gateNumber}`,
            text: "Фотоотчет во вложении",
            attachments
        })
        if (!emailSent) throw new Error("Не удалось отправить письмо")
        
        for (const attachment of attachments) {
            try {
                await fs.promises.unlink(attachment.path)
            } catch(cleanupError) {
                console.error(`Ошибка удаления файла ${attachment.path}:`, cleanupError)
            }
        }
            res.json({success: true})
    } catch (error) {
        res.status(500).json({ error: error.message})
    }
})

app.post('/api/receiving/send', async (req, res) => {    
    try {
        const { gateNumber, recipients, processPhotos, defectivePhotos } = req.body
        const allPhotoPaths = [...(processPhotos || []), ...(defectivePhotos || [])]
        const attachments = []
        for (const relativePath of allPhotoPaths) {
            const fullPath = path.join('/home/abogdanov/Mobile_Storekeeper', relativePath)
            if(!fs.existsSync(fullPath)) {
                console.warn(`Файл не найден:, ${fullPath}`)
                continue
            }
            attachments.push({
                filename: `Приемка_${path.basename(relativePath)}`,
                path: fullPath
            })
        }
        if (attachments.length === 0) {
            return res.status(400).json({error: 'Нет доступных файлов для отправки'})
        }
        const emailText = `Фотоотчет по приемке (Ворота ${gateNumber})\n\n` +
        (defectivePhotos.length > 0
            ? 'ВНИМАНИЕ! Выявлен брак'
            : 'Брак не обнаружен')

        
        const emailSent = await sendEmailWithAttachments({
            to: recipients,
            subject: `Приемка, ворота ${gateNumber} ${defectivePhotos.length > 0 ? 'БРАК' : ''} `,
            text: emailText,
            attachments
        })
        if (!emailSent) throw new Error("Ошибка отправки письма сервер")
        for (const attachment of attachments) {
            try {
                await fs.promises.unlink(attachment.path)
            } catch(cleanupError) {
                console.error(`Ошибка удаления файла ${attachment.path}:`, cleanupError)
            }
        }
        res.json({success: true, emailSent: true})
    } catch (error) {
        res.status(500).json({ error: error.message})
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