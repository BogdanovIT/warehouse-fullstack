import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const LoginBlock = sequelize.define('LoginBlock', {
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
    blockType: {
        type: DataTypes.ENUM('15min', '1hour', '24hours'),
        allowNull: false,
    },
    attemptsCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    tableName: 'login_blocks',
    timestamps: true,
    indexes: [
        {
            fields: ['email', 'expiresAt']
        },
        {
            fields: ['ipAddress', 'expiresAt']
        }
    ]
})

export default LoginBlock