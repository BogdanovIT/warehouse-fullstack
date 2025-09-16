import { Sequelize } from "sequelize"

const sequelize = new Sequelize(
    'breezzzz', 
    'postgres', 
    '198111030612', 
    {
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
})

export default sequelize