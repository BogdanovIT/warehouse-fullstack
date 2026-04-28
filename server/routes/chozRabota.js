import express from 'express'
import { createRecord } from '../controllers/chozRabotaController.js'
import  authMiddleware  from '../middlewares/authMiddleware.js'
import { requireRole } from '../middlewares/roleMiddleware.js'

const router = express.Router()
router.use(authMiddleware)

router.post('/', requireRole('director', 'superuser'), createRecord)

export default router