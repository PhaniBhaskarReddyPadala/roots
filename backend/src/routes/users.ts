import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { AppError } from '../middleware/errorHandler';

export const usersRouter = Router();
usersRouter.use(authenticate);

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  regionOfOrigin: z.string().optional(),
  motherTongue: z.string().optional(),
  familySurname: z.string().optional(),
  surnameOrigin: z.string().optional(),
  casteSubcaste: z.string().optional(),
});

// ── GET /users/me ─────────────────────────────
usersRouter.get('/me', async (req: AuthRequest, res) => {
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

// ── PATCH /users/me ───────────────────────────
usersRouter.patch('/me', async (req: AuthRequest, res) => {
  const data = updateProfileSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data,
    select: {
      id: true, name: true, email: true, regionOfOrigin: true,
      motherTongue: true, familySurname: true, surnameOrigin: true,
      accountType: true, accountState: true, createdAt: true, updatedAt: true,
    },
  });

  res.json({ success: true, data: user });
});

// ── GET /users/search?q=query ─────────────────
usersRouter.get('/search', async (req: AuthRequest, res) => {
  const q = (req.query.q as string || '').trim();
  if (q.length < 2) {
    res.json({ success: true, data: [] });
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      accountType: 'REAL',
      accountState: 'ACTIVE',
      id: { not: req.userId! },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { familySurname: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true, name: true, email: true,
      regionOfOrigin: true, familySurname: true, motherTongue: true,
      accountType: true,
    },
    take: 20,
  });

  res.json({ success: true, data: users });
});

// ── GET /users/:id ────────────────────────────
usersRouter.get('/:id', async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const isOwnProfile = req.userId === id;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true,
      regionOfOrigin: true, motherTongue: true, familySurname: true,
      surnameOrigin: isOwnProfile,
      casteSubcaste: isOwnProfile,
      accountType: true, accountState: true, createdAt: true,
    },
  });

  if (!user) throw new AppError(404, 'User not found.');

  res.json({ success: true, data: user });
});
