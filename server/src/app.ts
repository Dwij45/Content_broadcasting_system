import express from 'express'
import authRoutes from './modules/auth/auth.route.js'
import contentRoutes from './modules/content/content.route.js'
import cors from 'cors'
import path from 'path'
import type { Request, Response } from 'express'

const app = express()
app.use(express.json())
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.resolve('src/uploads')));

app.use('/api/auth', authRoutes)
app.use('/api/content', contentRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});


export default app