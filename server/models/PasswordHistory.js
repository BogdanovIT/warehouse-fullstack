import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PasswordHistory = sequelize.define('PasswordHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    changedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'password_history',
    timestamps: true,
    indexes: [
        {
            fields: ['userId', 'changedAt']
        }
    ]
})

export default PasswordHistory