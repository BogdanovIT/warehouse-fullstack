import { Sequelize } from "sequelize"
import dotenv from 'dotenv'

dotenv.config()

const sequelize = new Sequelize(
    process.env.DATABASE_NAME || 'breezzzz', 
    process.env.DATABASE_USER || 'postgres', 
    process.env.DATABASE_PASS || '', 
    {
    host: process.env.DATABASE_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
})

export default sequelize