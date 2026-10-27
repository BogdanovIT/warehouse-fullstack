import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

const Movement = sequelize.define('Movement', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    operationType: {
        type: DataTypes.ENUM('issued', 'returned'),
        allowNull: false,
        comment: "Выдача или возврат",
    },
    department: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    employeeName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: "ФИО сотрудника, веденное вручную"
    },
    issuedBy: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: "ФИО сотрудника склада, который сканировал марку",
    },
    document: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: "Номер документа основания",
    },
}, {
    tableName: 'movements',
    timestamps: true,
})

export default Movement