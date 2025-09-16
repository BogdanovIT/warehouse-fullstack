import { createTransport } from 'nodemailer';
import { Request, Response } from 'express';
import multer from 'multer'
import path from 'path';
import fs from 'fs';

const upload = multer({ dest: 'temp/'})
export const sendPhotosDirect = async (req: Request, res: Response) => {
try {
  const files = req.files as Express.Multer.File[]
  const { recipients, operationType, gateNumber } = req.body
  if (!files || !recipients) {
    return res.status(400).json({ error: 'Отсутствуют файлы или получатели'})
  }
  const emailRecipients = JSON.parse(recipients)
  const transporter = createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const attachments = files.map(file => ({
    filename: file.originalname,
    path: file.path
  }));
  const operationTitle = operationType === 'receiving' ? 'приёмка' : 'отгрузка'
  const subject = `Фото ${operationTitle} (Ворота ${gateNumber}) от ${new Date().toLocaleDateString()}`
  await transporter.sendMail({
    from: `"Фотоотчёт" <${process.env.EMAIL_USER}>`,
    to: emailRecipients.join(', '),
    subject,
    text: `'Фотоотчет' ${new Date().toLocaleDateString()}`,
    attachments,
  });
  files.forEach(file => {
    fs.unlink(file.path, err => {
      if (err) console.error('Ошибка удаления файлов', err)
    })
  })
  res.status(200).json({ success: true})
} catch (error) {
  console.error('Ошибка отправки почты', error)
  res.status(500).json({ error: 'Не удалось отправить почту'})
}
}
  

  