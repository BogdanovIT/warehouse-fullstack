import express from 'express'
import Product from '../models/Products.js'
import User from '../models/User.js'

const productRout = express.Router()

productRout.get('/by-article', async (req, res) => {
    try {
        const {article} = req.query
        
        if (!article) {
            return res.status(400).json({
                success: false,
                message: "Параметр article обязателен"
            })
        }
        const product = await Product.findOne({
            where: {primary_code: article},
            attributes: ['product', 'primary_code']
        })
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Товар не найден"
            })
        }
        return res.json({
            success: true,
            product: {
                name: product.product,
                code: product.primary_code
            }
        })
    } catch (error) {
        console.error("Ошибка при поиске товара", error)
        res.status(500).json({
            success: false,
            message: "Внутренняя ошибка сервера"
        })
    }
})
export default productRout