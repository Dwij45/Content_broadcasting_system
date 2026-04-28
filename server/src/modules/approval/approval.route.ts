import { Router } from 'express';
import approvalController from './approval.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import {  authorize } from '../../middlewares/authorize.js';

const router = Router();

router.patch('/:id/approve', authenticate, authorize('principal'), approvalController.approveContent);

router.patch('/:id/reject',  authenticate, authorize('principal'), approvalController.rejectContent);

export default router;