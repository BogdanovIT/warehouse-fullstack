import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        field: 'name'
    },
    code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        field: 'code'
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'description'
    },
    permissions: {
        type: DataTypes.JSON,
        defaultValue: [],
        field: 'permissions'
    },
    level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'level'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})

Role.associate = (models) => {
    Role.belongsToMany(models.User, {
        through: 'UserRole',
        foreignKey: 'role_id',
        as: 'users'
    })
}

export default Role