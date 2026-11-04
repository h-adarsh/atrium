import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('⚠️ SECURITY WARNING: JWT_SECRET environment variable is not set. Configure a secure random secret in production.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-mygate-jwt-key-2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  approvalStatus?: string;
  flatId?: string | null;
  unitNumber?: string | null;
  societyId?: string | null;
  societySlug?: string | null;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}
