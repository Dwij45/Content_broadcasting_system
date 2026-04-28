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

router.post(
  '/upload',
  authenticate,
  authorize('teacher'),
  upload.single('file'),
  uploadContent
);

router.get('/my', authenticate, authorize('teacher'), getMyContent);

//all content
router.get('/all', authenticate, authorize('principal'), getAllContent);

//pending content
router.get(
  '/pending',
  authenticate,
  authorize('principal'),
  (req, res, next) => { req.query.status = 'pending'; next(); },
  getAllContent
);

//get content by id
router.get('/:id', authenticate, authorize('principal', 'teacher'), getContentById);

//delete content
router.delete('/:id', authenticate, authorize('principal', 'teacher'), deleteContent);

export default router;