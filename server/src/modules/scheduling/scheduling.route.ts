import { Router } from 'express';
import broadcastController from './scheduling.controller.js';

const router = Router();

/**
 * @swagger
 * /api/broadcast/live/{teacherId}:
 *   get:
 *     summary: Get live scheduled content for a teacher
 *     tags: [Broadcast]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Live content retrieved
 */
router.get('/live/:teacherId', broadcastController.getLive);

export default router;  