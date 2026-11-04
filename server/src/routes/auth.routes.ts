import { Router } from 'express';
import {
  login,
  register,
  logout,
  getCurrentUser,
  getDemoAccounts,
  getBuildingUnits,
  getPendingRegistrations,
  reviewRegistration,
  cancelPendingRegistration,
  updateProfile,
  changePassword
} from '../controllers/auth.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);
router.put('/profile', requireAuth, updateProfile);
router.put('/change-password', requireAuth, changePassword);
router.get('/demo-accounts', getDemoAccounts);
router.get('/building-units', getBuildingUnits);

// Resident self-service: Cancel mistaken or rejected registration
router.delete('/pending-registration', requireAuth, cancelPendingRegistration);

// Admin-only approval routes
router.get('/admin/pending-registrations', requireAuth, requireRole([Role.ADMIN]), getPendingRegistrations);
router.post('/admin/registrations/:userId/review', requireAuth, requireRole([Role.ADMIN]), reviewRegistration);

export default router;
