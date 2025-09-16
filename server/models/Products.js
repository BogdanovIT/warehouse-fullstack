import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Product = sequelize.define('Product', {
    primary_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: "НС код товара"
    },
    product: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Наименование товара"
    },
    barcode: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Штрих-код товара "
    }
}, {
    tableName: 'products',
    timestamps: true,
    comment: "Каталог товаров"
})

export default Product