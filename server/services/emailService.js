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
            console.log('Testing SMTP Connection...')
            await this.transporter.verify()
            console.log('SMTP Connection Successful')
        } catch(error) {
            console.error('SMTP Connection failed', error.message)
        }
    }
    async sendEmail(to, subject, htmlBody, attachments) {
        console.log("Функция вызвана, проверьте почту")
        try {
            console.log(`sending email to ${to} via SMTP...` )
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
            console.log(`email to ${to} sent successfully via SMTP`)
            return true
        } catch(error) {
            console.error('SMTP Email Sending Failed:', error)
            throw new Error(`failed to send email: ${error.message}`)
        }
    }
    async sendConfirmationCode(email, code) {
        const subject = 'Код подтверждения'
        const htmlBody = `
        <h3>Добро пожаловать в Мобильный Кладовщик</h3>
        <p>Ваш код подтверждения: <strong>${code}</strong></p>
        <p>Введите этот код в форму регистрации приложения</p>
        <p><em>Код действителен 15 минут</em></p>
        `
        return await this.sendEmail(email, subject, htmlBody)
    }
    async sendReceivingReport(recipients, gateNumber, processPhotos, defectivePhotos) {
        console.log("Функция вызвана, приняты данные: ", {
            recipients: recipients,
            gateNumber: gateNumber,
            processPhotos: processPhotos?.length,
            defectivePhotos: defectivePhotos?.length
        })
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
        console.log("Сформировано письмо с параметрами:", {
            htmlBody: htmlBody,
            attachments: allAttachments?.length
        })
        console.log('Send Mail!!!')
        return await this.sendEmail(recipients.join(', '), subject, htmlBody, allAttachments)
    }
    async sendShipmentReport(recipients, gateNumber, attachments) {
        console.log('5. sendShipmentReport called')
        console.log('6. Recipients: ', recipients)
        console.log('7. Attachments count: ', attachments.length)
        const subject = `Отгрузка, ворота №${gateNumber}`
        const htmlBody = `
        <h3>Фотоотчет по отгрузке</h3>
        <p><strong>Ворота:</strong>${gateNumber}</p>
        <p><strong>Фотографий процесса:</strong>${attachments.length}</p>
        <p><em>Отчет создан автоматически</em></p>`
        console.log('8. Calling sendEmail')
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
        const attachments = [defectData, photos]
        return await this.sendEmail(recipients.join(', '), subject, htmlBody, attachments)
    }
}
export default new EmailService
