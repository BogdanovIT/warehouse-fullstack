import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const UserRole = sequelize.define('UserRole', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'role_id',
        references: {
            model: 'roles',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    assignedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'assigned_at'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expires_at'
    },
    is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_primary'
    }
}, {
    tableName: 'user_roles',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'role_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['role_id']
        }
    ]
})

export default UserRole