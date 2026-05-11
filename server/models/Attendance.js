import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Employee from "./Employee.js";

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {model: 'employees', key: 'id'},
    },
    department: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'sick', 'vacation', 'business_trip'),
        defaultValue: 'present',
        comment: "Статус присутствия"
    },
    standartHours: {
        type: DataTypes.DECIMAL(3, 1),
        defaultValue: 8.0,
        comment: "Часы для оклада (по умолчанию 8)"
    },
    overtimeHours: {
        type: DataTypes.DECIMAL(3, 1),
        defaultValue: 0,
        comment: "Часы переработки"
    },
    businessTripHours: {
        type: DataTypes.DECIMAL(3, 1),
        defaultValue: 0,
        comment: "Часы в командировке"
    },
    comment: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Причина отсутствия"
    },
    createdBy: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
}, {
    tableName: 'attendance',
    timestamps: true
})

Employee.hasMany(Attendance, {foreignKey: 'employeeId'})
Attendance.belongsTo(Employee, {foreignKey: 'employeeId'})

export default Attendance