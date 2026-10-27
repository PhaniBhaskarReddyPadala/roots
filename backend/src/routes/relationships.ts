import { Router } from 'express';
import { z } from 'zod';
import { RelationshipType, RelationshipStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { AppError } from '../middleware/errorHandler';
import { createNotification } from '../services/notificationService';
import { buildFamilyGraph, findRelationshipPath } from '../services/graphService';

export const relationshipsRouter = Router();
relationshipsRouter.use(authenticate);

const requestSchema = z.object({
  recipientId: z.string(),
  relationshipType: z.nativeEnum(RelationshipType),
  message: z.string().optional(),
});

// ── Inverse relationship mapping ──────────────
export const INVERSE_MAP: Record<RelationshipType, RelationshipType> = {
  FATHER:      'SON',
  MOTHER:      'SON',
  PARENT:      'SON',
  SON:         'FATHER',
  DAUGHTER:    'FATHER',
  BROTHER:     'BROTHER',
  SISTER:      'SISTER',
  UNCLE:       'SON',        // nephew/niece — using SON as closest available
  AUNT:        'DAUGHTER',
  GRANDFATHER: 'SON',        // grandson/granddaughter — using SON as closest available
  GRANDMOTHER: 'SON',
  SPOUSE:      'SPOUSE',
  HUSBAND:     'WIFE',
  WIFE:        'HUSBAND',
};

// ─────────────────────────────────────────────
// POST /relationships/requests
// ─────────────────────────────────────────────
relationshipsRouter.post('/requests', async (req: AuthRequest, res) => {
  const data = requestSchema.parse(req.body);
  const requesterId = req.userId!;

  if (requesterId === data.recipientId) {
    throw new AppError(400, 'You cannot send a relationship request to yourself.');
  }

  // Check recipient exists
  const recipient = await prisma.user.findUnique({ where: { id: data.recipientId } });
  if (!recipient) throw new AppError(404, 'Recipient not found.');

  // ── Conflict detection ────────────────────
  // Check if requester already has a relationship of this type to someone else
  // For exclusive relationships (FATHER, MOTHER, GRANDFATHER, GRANDMOTHER)
  const exclusiveTypes: RelationshipType[] = ['FATHER', 'MOTHER', 'GRANDFATHER', 'GRANDMOTHER'];
  if (exclusiveTypes.includes(data.relationshipType)) {
    const existingRelationship = await prisma.relationship.findFirst({
      where: {
        userId: requesterId,
        relationshipType: data.relationshipType,
        status: { in: ['ACCEPTED', 'VERIFIED'] },
      },
    });
    if (existingRelationship && existingRelationship.relatedUserId !== data.recipientId) {
      throw new AppError(409, `You already have a ${data.relationshipType.toLowerCase()} relationship established. New claim marked as conflicting.`);
    }
  }

  // Check for duplicate pending request
  const duplicate = await prisma.relationshipRequest.findFirst({
    where: {
      requesterId,
      recipientId: data.recipientId,
      relationshipType: data.relationshipType,
      status: 'PENDING',
    },
  });
  if (duplicate) throw new AppError(409, 'A pending request with this relationship already exists.');

  // Create the request
  const request = await prisma.relationshipRequest.create({
    data: {
      requesterId,
      recipientId: data.recipientId,
      relationshipType: data.relationshipType,
      message: data.message,
      status: 'PENDING',
    },
    include: {
      requester: { select: { id: true, name: true } },
      recipient: { select: { id: true, name: true } },
    },
  });

  // Notify recipient
  await createNotification({
    recipientId: data.recipientId,
    type: 'RELATIONSHIP_REQUEST',
    title: 'New Family Connection Request',
    body: `${request.requester.name} wants to connect to your profile on Roots.`,
    entityId: request.id,
    entityType: 'relationship_request',
  });

  res.status(201).json({ success: true, data: request });
});

// ── GET /relationships/requests ───────────────
relationshipsRouter.get('/requests', async (req: AuthRequest, res) => {
  const { type = 'received' } = req.query;
  const userId = req.userId!;

  const requests = await prisma.relationshipRequest.findMany({
    where: type === 'sent'
      ? { requesterId: userId }
      : { recipientId: userId },
    include: {
      requester: { select: { id: true, name: true, familySurname: true } },
      recipient: { select: { id: true, name: true, familySurname: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: requests });
});

// ── PATCH /relationships/requests/:id ─────────
relationshipsRouter.patch('/requests/:id', async (req: AuthRequest, res) => {
  const requestId = req.params.id as string;
  const { status } = z.object({
    status: z.enum(['ACCEPTED', 'REJECTED']),
  }).parse(req.body);

  const request = await prisma.relationshipRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: { select: { id: true, name: true } },
      recipient: { select: { id: true, name: true } },
    },
  });

  if (!request) throw new AppError(404, 'Relationship request not found.');
  if (request.recipientId !== req.userId) {
    throw new AppError(403, 'You can only respond to requests sent to you.');
  }
  if (request.status !== 'PENDING') {
    throw new AppError(400, 'This request has already been processed.');
  }

  const updated = await prisma.relationshipRequest.update({
    where: { id: requestId },
    data: { status: status as RelationshipStatus },
  });

  if (status === 'ACCEPTED') {
    // ── Conflict check for recipient side ─────
    const exclusiveTypes: RelationshipType[] = ['FATHER', 'MOTHER', 'GRANDFATHER', 'GRANDMOTHER'];
    const inverseType = INVERSE_MAP[request.relationshipType];

    let finalStatus: RelationshipStatus = 'ACCEPTED';

    if (exclusiveTypes.includes(request.relationshipType)) {
      const conflictCheck = await prisma.relationship.findFirst({
        where: {
          userId: request.recipientId,
          relationshipType: inverseType,
          status: { in: ['ACCEPTED', 'VERIFIED'] },
          relatedUserId: { not: request.requesterId },
        },
      });
      if (conflictCheck) finalStatus = 'DISPUTED';
    }

    // Create bidirectional relationship edges
    await prisma.$transaction([
      prisma.relationship.upsert({
        where: {
          userId_relatedUserId_relationshipType: {
            userId: request.requesterId,
            relatedUserId: request.recipientId,
            relationshipType: request.relationshipType,
          },
        },
        create: {
          userId: request.requesterId,
          relatedUserId: request.recipientId,
          relationshipType: request.relationshipType,
          status: finalStatus,
        },
        update: { status: finalStatus },
      }),
      prisma.relationship.upsert({
        where: {
          userId_relatedUserId_relationshipType: {
            userId: request.recipientId,
            relatedUserId: request.requesterId,
            relationshipType: inverseType,
          },
        },
        create: {
          userId: request.recipientId,
          relatedUserId: request.requesterId,
          relationshipType: inverseType,
          status: finalStatus,
        },
        update: { status: finalStatus },
      }),
    ]);

    // Notify requester
    await createNotification({
      recipientId: request.requesterId,
      type: finalStatus === 'DISPUTED' ? 'RELATIONSHIP_DISPUTED' : 'REQUEST_ACCEPTED',
      title: finalStatus === 'DISPUTED' ? 'Relationship Conflict Detected' : 'Family Connection Accepted',
      body: finalStatus === 'DISPUTED'
        ? `${request.recipient!.name} accepted your request, but a conflicting relationship was found. Status: Disputed.`
        : `${request.recipient!.name} accepted your family connection request.`,
      entityId: requestId,
      entityType: 'relationship_request',
    });
  } else {
    await createNotification({
      recipientId: request.requesterId,
      type: 'RELATIONSHIP_STATUS_UPDATE',
      title: 'Family Connection Request Declined',
      body: `${request.recipient!.name} declined your relationship request.`,
      entityId: requestId,
      entityType: 'relationship_request',
    });
  }

  res.json({ success: true, data: updated });
});

// ── GET /relationships ────────────────────────
relationshipsRouter.get('/', async (req: AuthRequest, res) => {
  const relationships = await prisma.relationship.findMany({
    where: { userId: req.userId! },
    include: {
      relatedUser: {
        select: { id: true, name: true, familySurname: true, accountType: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: relationships });
});

// ── GET /relationships/:id ────────────────────
relationshipsRouter.get('/:id', async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const relationship = await prisma.relationship.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      relatedUser: { select: { id: true, name: true } },
    },
  });

  if (!relationship) throw new AppError(404, 'Relationship not found.');

  if (relationship.userId !== req.userId && relationship.relatedUserId !== req.userId) {
    throw new AppError(403, 'Access denied.');
  }

  res.json({ success: true, data: relationship });
});

// ── PATCH /relationships/:id/verify ──────────
relationshipsRouter.patch('/:id/verify', async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const relationship = await prisma.relationship.findUnique({
    where: { id },
  });

  if (!relationship) throw new AppError(404, 'Relationship not found.');
  if (relationship.userId !== req.userId && relationship.relatedUserId !== req.userId) {
    throw new AppError(403, 'Access denied.');
  }
  if (relationship.status !== 'ACCEPTED') {
    throw new AppError(400, 'Only accepted relationships can be verified.');
  }

  const updated = await prisma.relationship.update({
    where: { id },
    data: { status: 'VERIFIED' },
  });

  // Notify the other party
  const otherUserId = relationship.userId === req.userId
    ? relationship.relatedUserId
    : relationship.userId;

  await createNotification({
    recipientId: otherUserId,
    type: 'RELATIONSHIP_VERIFIED',
    title: 'Relationship Verified',
    body: 'A family relationship has been verified on the platform.',
    entityId: relationship.id,
    entityType: 'relationship',
  });

  res.json({ success: true, data: updated });
});

// ── GET /relationships/path/:userId ──────────
relationshipsRouter.get('/path/:userId', async (req: AuthRequest, res) => {
  const sourceId = req.userId!;
  const targetId = req.params.userId as string;

  if (sourceId === targetId) {
    throw new AppError(400, 'Source and target cannot be the same person.');
  }

  const graph = await buildFamilyGraph(sourceId);
  const path = findRelationshipPath(graph, sourceId, targetId);

  if (!path) {
    res.json({ success: true, data: null, message: 'No relationship path found.' });
    return;
  }

  res.json({ success: true, data: path });
});
