import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

import { prisma } from './config/prisma';
import { requireAuth, requireApprovedUser } from './middleware/auth';
import authRoutes from './routes/auth.routes';
import flatsRoutes from './routes/flats.routes';
import financeRoutes from './routes/finance.routes';
import complaintsRoutes from './routes/complaints.routes';
import noticesRoutes from './routes/notices.routes';
import feedbackRoutes from './routes/feedback.routes';
import societiesRoutes from './routes/societies.routes';

// Production Secret Hygiene Validation
if (process.env.NODE_ENV === 'production') {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes('change-me') || jwtSecret.includes('super-secret')) {
    console.error('🚨 CRITICAL SECURITY MISCONFIGURATION: Insecure JWT_SECRET detected in production!');
    console.error('A cryptographically strong secret of at least 32 characters is required.');
    console.error('Generate one with: openssl rand -base64 32');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5001;

// Trust reverse proxy (OCI Load Balancer, Nginx, Caddy) for accurate rate limiting and IP tracking
app.set('trust proxy', 1);

// Helmet security headers & Content Security Policy
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  } : false
}));

// CORS Configuration supporting multiple production origins and preview URLs
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:5001'
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.railway.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// Body and cookie parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiters for defense-in-depth against DDoS and brute-force
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // 600 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Feedback submission rate limit reached. Please try again later.' }
});

const societyCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Society creation rate limit reached. Please try again later.' }
});

// Apply global API rate limit
app.use('/api', globalApiLimiter);

// Static file serving directory for uploads
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// SECURITY: Prohibit direct static file access to receipt PDFs.
// Receipts must strictly go through authenticated multi-tenant endpoint /api/v1/finance/receipts/:receiptNumber
app.use('/uploads/receipts', (_req: Request, res: Response) => {
  res.status(403).json({
    success: false,
    message: 'Direct access to receipts directory is forbidden. Access receipts through /api/v1/finance/receipts/:receiptNumber'
  });
});

// SECURITY: Protect uploaded payment proofs and bills with authenticated user session
app.use('/uploads', requireAuth, requireApprovedUser, express.static(uploadsDir));

// Static file serving for React SPA build (robust resolution for Docker and standalone runtimes)
const possibleClientDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist')
];
const clientDistPath = possibleClientDistPaths.find(p => fs.existsSync(p)) || possibleClientDistPaths[0];

if (fs.existsSync(clientDistPath)) {
  console.log(`📦 Serving static client build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
}

// Health check with database connectivity probe
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      service: 'Atrium Apartment Operations API'
    });
  } catch (dbErr: any) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      error: dbErr.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/flats', flatsRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/complaints', complaintsRoutes);
app.use('/api/v1/notices', noticesRoutes);
app.use('/api/v1/feedback', feedbackLimiter, feedbackRoutes);
app.post('/api/v1/societies', societyCreationLimiter);
app.use('/api/v1/societies', societiesRoutes);

// Single Page Application (SPA) client fallback in production
if (fs.existsSync(clientDistPath)) {
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Handler for undefined API routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Global error handling middleware (suppresses stack traces and DB internals in production)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProd && (!err.status || err.status >= 500)
      ? 'An unexpected internal server error occurred. Please contact support.'
      : err.message || 'An internal server error occurred'
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Atrium API Server running at http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server closed');
  });
});

export default app;
