import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Employee = sequelize.define('Employee',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fullName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: "ФИО сотрудника"
    },
    shortName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Краткое обращение (Иванов И.)"
    },
    loginLv: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        comment: "Логин LV (из WMS)"
    },
    position: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Должность"
    },
    department: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: "Подразделение (place)"
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Действующий сотрудник"
    },
    isHourly: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Зависит от выработки (false - окладник)"
    },
}, {
    tableName: 'employees',
    timestamps: true
})

export default Employee