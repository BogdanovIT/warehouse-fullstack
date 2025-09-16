import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'
import bcrypt from 'bcryptjs'

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'first_name'
    },
    lastName: {
        type: DataTypes.STRING,
        field: 'last_name'
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        set(value) {
            const hash = bcrypt.hashSync(value, 10)
            this.setDataValue('password', hash)
        }
    },
    passwordChangedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    passwordExpiresAt: {
        type: DataTypes.DATE,
        defaultValue: () => new Date(Date.now() + 90*24*60*60*1000)
    },
    loginLv: {
        type:DataTypes.STRING,
        field: 'loginLv'
    },
    resetCode: {
        type: DataTypes.STRING(6),
        allowNull: true,
        defaultValue: null
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    resetCodeExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    place: DataTypes.STRING,
    operators: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    block_reason: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true
})

export default User