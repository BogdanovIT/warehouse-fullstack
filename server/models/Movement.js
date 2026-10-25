import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'
import Employee from './Employee.js'

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
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'employees', key: 'id'},
        comment: "Кому выдали или от кого приняли"
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

Movement.belongsTo(Employee, { foreignKey: 'employeeId' })

export default Movement