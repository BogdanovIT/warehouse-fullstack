import { ChatRoom, Message, User } from "../models";

class ChatController {
    static async getUserRoom(req, res) {
        try {
            const userId = req.user.id
            const user = await User.findByPk(userId, {
                attributes: ['id', 'firstName', 'lastName', 'city', 'department']
            })
            if (!user || !user.place) {
                return res.status(404).json({ error: "Пользователь не найден"})
            }
            const [room] = await ChatRoom.findOrCreate({
                where: { place: user.place },
                defaults: { place: user.place }
            })
            res.json({
                success: true,
                room: {
                    id: room.id,
                    place: room.place
                }
            })
        } catch (error) {
            console.error('Ошибка получения комнаты:', error)
            res.status(500).json({ error: "Внутренняя ошибка сервера"})
        }
    }

    static async sendMessage(req, res) {
        try {
            const { text } = req.body
            const userId = req.user.id
            const user = await User.findByPk(userId)
            if (!user.place) {
                return res.status(404).json({ error: 'Комната не найдена'})
            }
            const room = await ChatRoom.findOne({where: { place: user.place}})
            if (!room) {
                return res.status(404).json({ error: 'Комната не найдена'})
            }
            const message = await Message.create({
                text,
                roomId: room.id,
                authorId: user.id
            })
            const messageWithAuthor = await Message.findByPk(message.id, {
                include: [{
                    model: User,
                    attributes: ['id', 'firstName', 'lastName', 'place']
                }]
            })
            res.status(201).json({
                success: true,
                message: messageWithAuthor})
        } catch(error) {
            console.error('Ошибка отправки сообщения:', error)
            res.status(500).json({ error: 'Не удалось отправить сообщение'})
        }
    }
    static async getMessages(req, res) {
        try {
            const userId = req.user.id
            const { limit = 50, offset = 0 } = req.query
            const user = await User.findByPk(userId)
            const room = await ChatRoom.findOne({where: {place: user.place}})
            if (!room) {
                return res.json([])
            }
            const messages = await Message.findAll({
                where: {roomId: room.id},
                include: [{
                    model: User,
                    attributes: ['id', 'firstName', 'lastName', 'city', 'department']
                }],
                order: [['craetedAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            })
            res.json(messages.reverse())
            } catch(error) {
                console.error('Ошибка получения сообщений:', error)
                res.status(500).json({error: 'Не удалось загрузить сообщения'})
            }
    }
    static async getAllRooms(req, res) {
        try {
            const rooms = await ChatRoom.findAll({
                order: [['place', 'ASC']],
                include: [{
                    model: Message,
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                    include: [{ model: User, attributes:['firstName', 'lastName']}]
                }]
            })
            res.json(rooms)
        } catch(error) {
            console.error('Ошибка получения комнат:', error)
            res.status(500).json({ error: 'Не удалось загрузить список комнат'})
        }
    }
}
export default ChatController