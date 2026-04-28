import { Router } from 'express';
import {
  uploadContent,
  getMyContent,
  getAllContent,
  getContentById,
  deleteContent,
} from './content.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { upload } from '../../middlewares/uppload.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/content/upload:
 *   post:
 *     summary: Upload new content (Teacher only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - subject
 *               - file
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               subject:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               rotation_duration:
 *                 type: number
 *     responses:
 *       201:
 *         description: Content uploaded successfully
 */
router.post(
  '/upload',
  authenticate,
  authorize('teacher'),
  upload.single('file'),
  uploadContent
);

/**
 * @swagger
 * /api/content/my:
 *   get:
 *     summary: Get all content uploaded by the current teacher
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of teacher's content
 */
router.get('/my', authenticate, authorize('teacher'), getMyContent);

/**
 * @swagger
 * /api/content/all:
 *   get:
 *     summary: Get all content across all teachers (Principal only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of all content
 */
router.get('/all', authenticate, authorize('principal'), getAllContent);

/**
 * @swagger
 * /api/content/pending:
 *   get:
 *     summary: Get pending content across all teachers (Principal only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of all pending content
 */
router.get(
  '/pending',
  authenticate,
  authorize('principal'),
  (req, res, next) => { req.query.status = 'pending'; next(); },
  getAllContent
);

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Get specific content details by ID
 *     tags: [Content]
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
 *         description: Content details
 */
router.get('/:id', authenticate, authorize('principal', 'teacher'), getContentById);

/**
 * @swagger
 * /api/content/{id}:
 *   delete:
 *     summary: Delete specific content by ID
 *     tags: [Content]
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
 *         description: Content deleted successfully
 */
router.delete('/:id', authenticate, authorize('principal', 'teacher'), deleteContent);

export default router;