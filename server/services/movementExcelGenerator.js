import ExcelJS from 'exceljs'
export const generateMovementExcel = async (department, date, movements) => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Движение запчастей')
    sheet.mergeCells('A1:G1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = `Движение запчастей по ${department} за ${date}`
    titleCell.font = {bold: true, size: 14}
    titleCell.alignment = {horizontal: 'center'}
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFD9E1F2' } }

    const headerRow = sheet.addRow([
        '№', "Дата", "Склад", "Получил", "Данные из QR", "Документ", "Статус",
    ])
    headerRow.font = { bold: true, size: 11 }
    headerRow.alignment = {horizontal: 'center', vertical: 'middle'}
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
        cell.border = { top: {style: 'thin'}, bottom: {style: 'thin'}, left: {style: 'thin'}, right: {style: 'thin'} }
    })
    let displayIndex = 1

    movements.forEach((m, index) => {
        const dateStr = new Date(m.createdAt).toLocaleDateString('ru-RU')
        const qrCodes = m.items.map(i => i.qrData)
        let status = ''
        if (m.operationType === 'issued') status = 'Выдано'
        else if (m.operationType === 'returned') status = 'Возвращено'
        else if (m.operationType === 'installed') status = 'Установлено'

        if (qrCodes.length === 0) {
            qrCodes.push('-')
        }
        const bgColor = index % 2 === 0 ? 'FFFFFFF' : 'FFE0E0E0'

        qrCodes.forEach((qr, idx) => {
            const row = sheet.addRow([
                displayIndex,
                dateStr,
                m.department,
                m.employeeName || '-',
                qr,
                m.document || '-',
                status,
            ])
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.alignment = { vertical: 'middle', wrapText: true}
                cell.border = {
                    top: {style: 'thin'},
                    left: {style: 'thin'},
                    right: {style: 'thin'},
                    bottom: {style: 'thin'},
                }
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                }
            })
        })
        displayIndex++
    })
    sheet.columns = [
        { width: 5 },
        { width: 12 },
        { width: 25 },
        { width: 25 },
        { width: 100 },
        { width: 20 },
        { width: 12 },
    ]
    return workbook.xlsx.writeBuffer()
}
