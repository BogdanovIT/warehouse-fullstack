import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

const VerificationCode = sequelize.define('VerificationCode', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'verification_codes',
    timestamps: true,
    indexes: [
        {
            fields: ['email', 'code']
        },
        {
            fields: ['expiresAt']
        }
    ]
})

export default VerificationCode