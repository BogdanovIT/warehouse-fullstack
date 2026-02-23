import express from 'express'
import ChatController from '../controllers/chatController.js'

const router = express.Router()

router.post('/rooms/my', ChatController.getOrCreateUserRoom)
router.get('/rooms', ChatController.getAllRooms)
router.post('/messages', ChatController.sendMessage)
router.get('/rooms/:roomId/messages', ChatController.getRoomMessages)
export default router