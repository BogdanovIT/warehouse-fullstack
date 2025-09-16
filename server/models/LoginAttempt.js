import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const LoginAttempt = sequelize.define('LoginAttempt', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        }
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    successful: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'login_attempts',
    timestamps: true,
    indexes: [
        {
            fields: ['email', 'createdAt']
        },
        {
            fields: ['ipAddress', 'createdAt']
        }
    ]
})

export default LoginAttempt