import ExcelJS from 'exceljs'

class TemplateService {
    async generateDefectExcel(parsedData){
        const templatePath = '/home/abogdanov/Mobile_Storekeeper/assets/template.xlsx'
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
}
export default new TemplateService()