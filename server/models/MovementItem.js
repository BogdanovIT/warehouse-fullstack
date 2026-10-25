import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Movement from "./Movement.js";

const MovementItem = sequelize.define('MovementItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    movementId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'movements', key: 'id' },
        onDelete: 'CASCADE',
    },
    qrData: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Сырые данные из QR/DataMatrix',
    },
}, {
    tableName: 'movement_items',
    timestamps: true
})

Movement.hasMany(MovementItem, { foreignKey: 'movementId', as: 'items'})
MovementItem.belongsTo(Movement, { foreignKey: 'movementId' })

export default MovementItem