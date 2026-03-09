import { DataTypes, where } from 'sequelize'
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
        validate: { isEmail: true },
        field: 'email'
    },
    password: {
        type: DataTypes.STRING,
        field: 'password',
        set(value) {
            const hash = bcrypt.hashSync(value, 10)
            this.setDataValue('password', hash)
        }
    },
    passwordChangedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'passwordChangeAt'
    },
    passwordExpiresAt: {
        type: DataTypes.DATE,
        defaultValue: () => new Date(Date.now() + 90*24*60*60*1000),
        field: 'passworgExpiresAt'
    },
    loginLv: {
        type:DataTypes.STRING,
        field: 'loginLv'
    },
    resetCode: {
        type: DataTypes.STRING(6),
        allowNull: true,
        defaultValue: null,
        field: 'resetCode'
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'emailVerified'
    },
    resetCodeExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        field: 'resetCodeExpires'
    },
    is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_blocked'
    },
    place: {
        type: DataTypes.STRING,
        field: 'place'
    },
    operators: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        field: 'operators'
    },
    block_reason: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'block_reason'
    },
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
})
User.associate = (models) => {
    User.belongsToMany(models.Role, {
        through: 'UserRole',
        foreignKey: 'user_id',
        as: 'roles'
    })
    User.hasMany(models.UserRole, {
        foreignKey: 'assygned_by',
        as: 'assignedRoles'
    })
}

User.prototype.getRolesWithDetails = async function() {
    return await this.getRoles({
        attributes: ['id', 'code', 'name', 'description', 'permissions', 'level'],
        through: {
            attributes: ['assygned_at', 'is_primary']
        },
        order: [
            [{ model: Role, as: 'roles'}, 'level', 'DESC'],
            ['is_primary', 'DESC']
        ]
    })
} 

User.prototype.hasRole = async function(roleCode) {
    const roles = await this.getRoles({
        where: { code: roleCode}
    })
    return roles.length > 0
}
User.prototype.hasAnyRole = async function(roleCodes) {
    const roles = await this.getRoles({
        where: { code: roleCodes}
    })
    return roles.length > 0
}
User.prototype.getPrimaryRole = async function() {
    const roles = await this.getRoles({
        where: {'$UserRole.is_primary$': true},
        limit: 1
    })
    return roles.length > 0 ? roles[0] : null
}
User.prototype.hasPermission = async function(permission) {
    const roles = await this.getRoles({
        attributes: ['permissions']
    })
    return roles.some(role => {
        const permissions = role.permissions || []
        return permissions.includes('*') || permissions.includes(permission)
    })
}
User.prototype.assignRole = async function(roleCode, assignedBy = null, isPrimary = false) {
    const role = await sequelize.models.Role.findOne({
        where: { code: roleCode }
    })
    if (!role) {
        throw new Error(`Роль ${roleCode} не найдена`)
    }
    if (isPrimary) {
        await sequelize.models.UserRole.update(
            { is_primary: false },
            { where: { user_id: this.id } }
        )
    }
    const userRole = await sequelize.models.UserRole.create({
        user_id: this.id,
        role_id: role.id,
        assigned_by: assignedBy,
        is_primary: isPrimary
    })
    return userRole
}

export default User