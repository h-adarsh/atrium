import { Router } from 'express';
import { getSocieties, getSocietyBySlug, createSociety } from '../controllers/societies.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Publicly accessible to allow resident registration & portal discovery
router.get('/', getSocieties);
router.get('/:slug', optionalAuth, getSocietyBySlug);
router.post('/', optionalAuth, createSociety);

export default router;

