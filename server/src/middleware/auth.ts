import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.token || 
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null) ||
    (typeof req.query?.token === 'string' ? req.query.token : null);

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ success: false, message: 'Invalid or expired session. Please sign in again.' });
    return;
  }

  req.user = decoded;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.token || 
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null) ||
    (typeof req.query?.token === 'string' ? req.query.token : null);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Super admin has universal override permission
    if (req.user.role === Role.SUPER_ADMIN) {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}

export async function requireApprovedUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  // SuperAdmin, Admin, and Staff roles bypass resident approval checks
  if (req.user.role === Role.SUPER_ADMIN || req.user.role === Role.ADMIN || req.user.role === Role.STAFF) {
    next();
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { approvalStatus: true, isActive: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User account is inactive or not found.' });
      return;
    }

    if (user.approvalStatus === 'PENDING') {
      res.status(403).json({
        success: false,
        code: 'ACCOUNT_PENDING_APPROVAL',
        message: 'Your resident account is awaiting administrator approval. Access to society records, dues, and complaints will be unlocked once verified by building management.'
      });
      return;
    }

    if (user.approvalStatus === 'REJECTED') {
      res.status(403).json({
        success: false,
        code: 'ACCOUNT_REJECTED',
        message: 'Your resident registration was rejected by building management. Please contact the society administrator.'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('requireApprovedUser error:', error);
    res.status(500).json({ success: false, message: 'Internal authorization error' });
  }
}
