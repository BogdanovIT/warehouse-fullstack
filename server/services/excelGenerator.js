import ExcelJS from 'exceljs'

const formatMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}:${minutes.toString().padStart(2, '0')}`
}

export const generateExcel = async (title, records) => {
    const workBook = new ExcelJS.Workbook()
    const sheet = workBook.addWorksheet('ХОЗРАБОТЫ')
    sheet.mergeCells('A1:I1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = title
    titleCell.font = { bold: true, size: 14}
    titleCell.alignment = { horizontal: 'center'}
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {argb: 'FFD9E1F2'}
    }
    const headerRow = sheet.addRow([
        '№', 'Дата' ,'Сотрудник', 'Вид работ', 'Начало', 'Окончание', 'Обед', 'Итого (Ч:М)', 'Комментарии'
    ])
    headerRow.font = { bold: true, size: 11}
    headerRow.eachCell (cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2'} }
        cell.border = { top: {style: 'thin'}, bottom: {style: 'thin'}, left: {style: 'thin'}, right: {style: 'thin'} }
        cell.alignment = { horizontal: 'center' }
    })

    if (records.length === 0) {
        sheet.mergeCells('A3:H3')
        const emptyCell = sheet.getCell('A3')
        emptyCell.value = 'Хозяйственные работы не производились'
        emptyCell.alignment = { horizontal: 'center' }
        emptyCell.font = {italic: true, color: {argb: 'FF999999'} }
    } else {
        records.forEach((record, index) => {
            const row = sheet.addRow([
                index + 1,
                record.workDate,
                record.employeeName,
                record.workType,
                record.startTime?.substring(0, 5) || '',
                record.endTime?.substring(0, 5) || '',
                record.hadLunch ? 'Да' : 'Нет',
                formatMinutes(record.totalMinutes),
                record.comment || ''
            ])
            row.eachCell(cell => {
                cell.border = { top: {style: 'thin'}, bottom: {style: 'thin'}, left: {style: 'thin'}, right: {style: 'thin'} }
            })
        })
        const totalMinutes = records.reduce((sum, r) => sum + r.totalMinutes, 0)
        const totalRow = sheet.addRow([ '', '', '', '', '', 'ВСЕГО:', '', formatMinutes(totalMinutes), '' ])
        totalRow.font = { bold: true, size: 11}
        totalRow.eachCell(cell => {
            cell.border = { top: {style: 'thin'}, bottom: {style: 'thin'}, left: {style: 'thin'}, right: {style: 'thin'} }
        })
    }
    sheet.columns = [
        { width: 6 },
        { width: 12 },
        { width: 35 },
        { width: 28 },
        { width: 10 },
        { width: 12 },
        { width: 8 },
        { width: 12 },
        { width: 75 },
    ]
    return workBook.xlsx.writeBuffer()
}


