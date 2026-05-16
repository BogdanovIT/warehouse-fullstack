import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Employee from "./Employee.js";

const chozRabota = sequelize.define('ChozRabota', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoincrement: true,
    },
    createdBy: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Логин руководителя"
    },
    employeeName:{
        type: DataTypes.STRING(200),
        allowNull: false
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'id'},
        comment: 'ID Сотрудника из справочника'
    },
    department: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    workType: {
        type: DataTypes.ENUM(
            "W001-Work,work!",
            "W002-Переупаковка товара",
            "W003-Перекладка паллет",
            "W004-Ремонт паллет",
            "W005-Уборка",
            "W006-ПРР без системы",
            "W007-Инвентаризация",
            "W008-Замеры",
            "W009-Стикеровка",
            "W010-Технологические работы",
            "W011-Задачи КРО",
            "W012-хоз работы",
        ),
        allowNull: false,
        comment: 'Вид работ',
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    hadLunch: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    totalMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Итоговое время в минутах'
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    workDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Дата выполнения, всегда сегодня'
    },
}, {
    tableName: 'choz_rabota',
    timestamps: true
})
chozRabota.belongsTo(Employee, { foreignKey: 'employeeId'})
export default chozRabota
