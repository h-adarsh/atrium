import { Router } from 'express';
import { getNotices, createNotice, togglePinNotice, deleteNotice } from '../controllers/notices.controller';
import { requireAuth, requireRole, requireApprovedUser } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);
router.use(requireApprovedUser);

router.get('/', getNotices);
router.post('/', requireRole([Role.ADMIN]), createNotice);
router.patch('/:id/toggle-pin', requireRole([Role.ADMIN]), togglePinNotice);
router.delete('/:id', requireRole([Role.ADMIN]), deleteNotice);

export default router;
