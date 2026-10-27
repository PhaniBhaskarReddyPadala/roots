import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { RelationshipType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { AppError } from '../middleware/errorHandler';
import { createNotification } from '../services/notificationService';
import { INVERSE_MAP } from './relationships';

export const dummyProfilesRouter = Router();
dummyProfilesRouter.use(authenticate);

const createDummySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  regionOfOrigin: z.string().optional(),
  motherTongue: z.string().optional(),
  familySurname: z.string().optional(),
  relationshipType: z.nativeEnum(RelationshipType),
});

// ── POST /dummy-profiles ──────────────────────
dummyProfilesRouter.post('/', async (req: AuthRequest, res: Response) => {
  const data = createDummySchema.parse(req.body);
  const creatorId = req.userId!;

  const result = await prisma.$transaction(async (tx) => {
    const dummyUser = await tx.user.create({
      data: {
        name: data.name,
        regionOfOrigin: data.regionOfOrigin,
        motherTongue: data.motherTongue,
        familySurname: data.familySurname,
        accountType: 'DUMMY',
        accountState: 'ACTIVE',
      },
    });

    const meta = await tx.dummyProfileMeta.create({
      data: {
        userId: dummyUser.id,
        createdById: creatorId,
        claimState: 'UNCLAIMED',
      },
    });

    // Create bidirectional relationship edges (same as real relationship acceptance)
    await tx.relationship.create({
      data: {
        userId: creatorId,
        relatedUserId: dummyUser.id,
        relationshipType: data.relationshipType,
        status: 'VERIFIED',
      },
    });

    const inverseType = INVERSE_MAP[data.relationshipType];
    await tx.relationship.create({
      data: {
        userId: dummyUser.id,
        relatedUserId: creatorId,
        relationshipType: inverseType,
        status: 'VERIFIED',
      },
    });

    return { dummyUser, meta };
  });

  res.status(201).json({ success: true, data: result });
});

// ── GET /dummy-profiles/:id ───────────────────
dummyProfilesRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({
    where: { id, accountType: 'DUMMY' },
    include: {
      dummyProfileMeta: {
        include: { createdBy: { select: { id: true, name: true } } },
      },
    },
  });

  if (!user) throw new AppError(404, 'Dummy profile not found.');

  res.json({ success: true, data: user });
});

// ── POST /dummy-profiles/:id/claim ───────────
dummyProfilesRouter.post('/:id/claim', async (req: AuthRequest, res: Response) => {
  const claimantId = req.userId!;
  const dummyId = req.params.id as string;

  const dummyUser = await prisma.user.findUnique({
    where: { id: dummyId, accountType: 'DUMMY' },
    include: { dummyProfileMeta: true },
  });

  if (!dummyUser) throw new AppError(404, 'Dummy profile not found.');
  if (!dummyUser.dummyProfileMeta) throw new AppError(400, 'Invalid dummy profile.');

  if (dummyUser.dummyProfileMeta.claimState === 'CLAIMED') {
    throw new AppError(409, 'This profile has already been claimed.');
  }

  const claimant = await prisma.user.findUnique({
    where: { id: claimantId },
    select: { id: true, name: true },
  });

  if (!claimant) throw new AppError(404, 'Claimant not found.');

  await prisma.$transaction(async (tx) => {
    await tx.relationship.updateMany({
      where: { relatedUserId: dummyId },
      data: { relatedUserId: claimantId },
    });

    await tx.relationship.updateMany({
      where: { userId: dummyId },
      data: { userId: claimantId },
    });

    await tx.dummyProfileMeta.update({
      where: { userId: dummyId },
      data: { claimState: 'CLAIMED' },
    });

    await tx.user.update({
      where: { id: dummyId },
      data: { accountState: 'INACTIVE', claimedById: claimantId, claimedAt: new Date() },
    });
  });

  const meta = dummyUser.dummyProfileMeta;
  await createNotification({
    recipientId: meta.createdById,
    type: 'DUMMY_PROFILE_CLAIMED',
    title: 'Dummy Profile Claimed',
    body: `${claimant.name} has claimed the dummy profile for "${dummyUser.name}". Their relationships are now connected.`,
    entityId: dummyId,
    entityType: 'dummy_profile',
  });

  res.json({
    success: true,
    message: 'Dummy profile claimed. All relationships have been transferred.',
    data: { dummyId, claimedById: claimantId },
  });
});
