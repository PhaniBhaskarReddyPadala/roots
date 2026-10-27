import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/authenticate';

export const authRouter = Router();

// ── Schemas ───────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  regionOfOrigin: z.string().optional(),
  motherTongue: z.string().optional(),
  familySurname: z.string().optional(),
  surnameOrigin: z.string().optional(),
  casteSubcaste: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Helpers ───────────────────────────────────
function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

// ── POST /auth/register ───────────────────────
authRouter.post('/register', async (req, res) => {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      regionOfOrigin: data.regionOfOrigin,
      motherTongue: data.motherTongue,
      familySurname: data.familySurname,
      surnameOrigin: data.surnameOrigin,
      casteSubcaste: data.casteSubcaste,
      accountType: 'REAL',
      accountState: 'ACTIVE',
    },
    select: {
      id: true, name: true, email: true, regionOfOrigin: true,
      motherTongue: true, familySurname: true, accountType: true,
      accountState: true, createdAt: true,
    },
  });

  const token = signToken(user.id);

  res.status(201).json({ success: true, data: { user, token } });
});

// ── POST /auth/login ──────────────────────────
authRouter.post('/login', async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.passwordHash) {
    throw new AppError(401, 'Invalid email or password.');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid email or password.');

  if (user.accountState === 'INACTIVE') {
    throw new AppError(401, 'This account has been deactivated.');
  }

  const token = signToken(user.id);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        regionOfOrigin: user.regionOfOrigin,
        motherTongue: user.motherTongue,
        familySurname: user.familySurname,
        accountType: user.accountType,
        accountState: user.accountState,
      },
      token,
    },
  });
});

// ── POST /auth/logout ─────────────────────────
// JWT is stateless; client discards the token.
// Endpoint exists for client-side flow consistency.
authRouter.post('/logout', authenticate, (_req: AuthRequest, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ── GET /auth/me ──────────────────────────────
authRouter.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true, name: true, email: true, regionOfOrigin: true,
      motherTongue: true, familySurname: true, surnameOrigin: true,
      accountType: true, accountState: true, createdAt: true, updatedAt: true,
    },
  });
  res.json({ success: true, data: user });
});
