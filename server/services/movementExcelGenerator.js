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
        '№', "Дата", "Выдал", "Получил", "Данные из QR", "Документ", "Статус",
    ])
    headerRow.font = { bold: true }
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
        cell.border = { top: {style: 'thin'}, bottom: {style: 'thin'}, left: {style: 'thin'}, right: {style: 'thin'} }
        cell.alignment = { horizontal: 'center' }
    })
    movements.forEach((m, index) => {
        const dateStr = new Date(m.createdAt).toLocaleDateString('ru-RU')
        const qrData = m.items.map(i => i.qrData).join(', ')
        const status = m.operationType === 'issued' ? 'Выдано' : 'Возвращено'

        const row = sheet.addRow([
            index + 1,
            dateStr,
            m.issuedBy,
            m.Employee?.fullName || '-',
            qrData,
            m.document || '-',
            status,
        ])
        row.eachCell(cell => {
            cell.border = { top: {style: 'thin'}, bottom: {style: 'thin'}, left: {style: 'thin'}, right: {style: 'thin'} }
        })
    })
    sheet.columns = [
        { width: 5 },
        { width: 12 },
        { width: 25 },
        { width: 25 },
        { width: 40 },
        { width: 20 },
        { width: 12 },
    ]
    return workbook.xlsx.writeBuffer()
}
