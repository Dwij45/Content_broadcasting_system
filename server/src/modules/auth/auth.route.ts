import express from 'express'
import authController from './auth.controller.js'

const router = express.Router()

router.post('/register',authController.register)
router.post('/login',authController.login)
router.get('/me',authController.getme)
// router.get('/logout',authController.logout)

export default router