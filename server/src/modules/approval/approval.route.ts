import { Router } from 'express';
import approvalController from './approval.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import {  authorize } from '../../middlewares/authorize.js';

const router = Router();

/**
 * @swagger
 * /api/approval/{id}/approve:
 *   patch:
 *     summary: Approve content (Principal only)
 *     tags: [Approval]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content approved
 */
router.patch('/:id/approve', authenticate, authorize('principal'), approvalController.approveContent);

/**
 * @swagger
 * /api/approval/{id}/reject:
 *   patch:
 *     summary: Reject content (Principal only)
 *     tags: [Approval]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejection_reason
 *             properties:
 *               rejection_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content rejected
 */
router.patch('/:id/reject',  authenticate, authorize('principal'), approvalController.rejectContent);

export default router;