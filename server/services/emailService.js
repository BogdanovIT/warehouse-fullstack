import nodemailer from 'nodemailer'

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.mail.ru',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        })
        this.testConnection()
    }
    async testConnection() {
        try {
            await this.transporter.verify()
        } catch(error) {
            console.error('SMTP Connection failed', error.message)
        }
    }
    async sendEmail(to, subject, htmlBody, attachments) {
        try {
            const mailOptions = {
                from: "Мобильный кладовщик <aktnabrak@mail.ru>",
                to: to,
                subject: subject,
                html: htmlBody,
                attachments: attachments.map(attachment => ({
                    filename: attachment.filename,
                    content: attachment.content,
                    contentType: attachment.contentType
                }))
            } 
            await this.transporter.sendMail(mailOptions)
            return true
        } catch(error) {
            console.error('SMTP Email Sending Failed:', error)
            throw new Error(`failed to send email: ${error.message}`)
        }
    }
    async sendConfirmationCode(email, code) {
        console.log("Code for", email, code)
        const subject = 'Код подтверждения'
        const htmlBody = `
        <h3>Добро пожаловать в Мобильный Кладовщик</h3>
        <p>Ваш код подтверждения: <strong>${code}</strong></p>
        <p>Введите этот код в форму регистрации приложения</p>
        <p><em>Код действителен 15 минут</em></p>
        `
        return await this.sendEmail(email, subject, htmlBody, [])
    }
    async sendReceivingReport(recipients, gateNumber, processPhotos, defectivePhotos) {
        const subject = `Приемка, ворота №${gateNumber} ${defectivePhotos.length >0 ? 'Обнаружены дефекты при выгрузке' : ''}`
        const hasDefects = defectivePhotos.length >0
        const htmlBody = `
        <h3>Фотоотчет по приемке</h3>
        <p><strong>Ворота:</strong>${gateNumber}</p>
        <p><strong>Статус:</strong>${hasDefects ? 'Внимание, обнаружены дефекты' : 'Дефекты при выгрузке не обнаружены'}</p>
        <p><strong>Фотографий процесса:</strong>${processPhotos.length}</p>
        ${hasDefects ?`<p><strong>Фотографий брака</strong>${defectivePhotos.length}</p>` : ''}
        <p><em>Отчет создан автоматически</em></p>`
        const allAttachments = [...processPhotos, ...defectivePhotos]
        return await this.sendEmail(recipients.join(', '), subject, htmlBody, allAttachments)
    }
    async sendShipmentReport(recipients, gateNumber, attachments) {
        const subject = `Отгрузка, ворота №${gateNumber}`
        const htmlBody = `
        <h3>Фотоотчет по отгрузке</h3>
        <p><strong>Ворота:</strong>${gateNumber}</p>
        <p><strong>Фотографий процесса:</strong>${attachments.length}</p>
        <p><em>Отчет создан автоматически</em></p>`
        return await this.sendEmail(recipients.join(', '), subject, htmlBody, attachments)
    }
    async sendDefectAkt(recipients, defectData, photos) {
        const subject = 'Акт отбраковки'
        const htmlBody = `
        <h3>Акт отбраковки товара</h3>
        <p><em>Отчет создан автоматически</em></p>`
        // const attachments = [
        //     {
        //         filename: "Акт дефектовки.xlsx",
        //         content: defectData.excelBuffer,
        //         contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        //     },
        //     ...photos
        // ]
        return await this.sendEmail(recipients.join(', '), subject, htmlBody, photos)
    }
}
export default new EmailService
