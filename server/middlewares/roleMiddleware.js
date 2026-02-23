import jwt from 'jsonwebtoken'
import { User, Role } from '../models'

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (!token) {
            return res.status(401).json({
                error: 'Токен не предоставлен',
                code: 'NO_TOKEN'
            })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findByPk(decoded.id, {
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'code', 'name', 'permissions'],
                through: { attributes: ['is_primary'] }
            }],
            attributes: {
                exclude: ['password', 'resetCode', 'resetCodeExpires']
            }
        })
    } catch (error) {
        
    }
}