import { createTransport } from 'nodemailer'

export async function sendResetEmail(email, resetCode) {
    const transporter = createTransport({
        host: process.env.EMAIL_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })
    await transporter.sendMail({
        from: `"Сброс пароля" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Восстановление пароля",
        html: `
        <p>Ваш код для восстановления пароля:</p>
        <a>${resetCode}</a>
        <p>Введите код в приложении. Код действителен 10 минут</p>
        <p>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо</p>`
    })
}