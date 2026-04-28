import express from 'express'
import authRoutes from './modules/auth/auth.route.js'
const app = express()
app.use(express.json())

app.use('/api/auth', authRoutes)

export default app