import chozRabota from "../models/chozRabota.js";
const calcTotalMinutes = (startTime, endTime, hadLunch) => {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    let minutes = (eh * 60 + em) - (sh * 60 + sm)
    if (hadLunch) minutes -= 60
    return minutes
}
export const createRecord = async (req, res) => {
    try {
        const {
            employeeName,
            department,
            workType,
            startTime,
            endTime,
            hadLunch,
            comment,
            workDate,
        } = req.body
        const createdBy = req.user.firstName + ' ' + req.user.lastName
        const totalMinutes = calcTotalMinutes(startTime, endTime, hadLunch)
        if (totalMinutes <= 0) {
            return res.status(400).json({
                message: 'Время окончания должно быть позже времени начала'
            })
        }
        const record = await chozRabota.create({
            createdBy,
            employeeName,
            department,
            workType,
            startTime,
            endTime,
            hadLunch,
            totalMinutes,
            comment,
            workDate: workDate || new Date(),
        })
        res.status(201).json(record)
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка сервера', error: error.message
        })
    }
}