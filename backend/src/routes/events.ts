import { Router } from 'express';
import { z } from 'zod';
import { RsvpStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { AppError } from '../middleware/errorHandler';
import { createNotification } from '../services/notificationService';

export const eventsRouter = Router();
eventsRouter.use(authenticate);

const createEventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  eventDate: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 2100;
  }, 'Please provide a valid event date between year 1900 and 2100'), // Validate date range
  eventTime: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  inviteeIds: z.array(z.string()).default([]),
});

const rsvpSchema = z.object({
  rsvpStatus: z.enum(['PENDING', 'GOING', 'INTERESTED', 'CANT_GO']),
});

// ── POST /events ─────────────────────────────
eventsRouter.post('/', async (req: AuthRequest, res) => {
  const data = createEventSchema.parse(req.body);
  const hostId = req.userId!;

  const event = await prisma.familyEvent.create({
    data: {
      hostId,
      title: data.title,
      eventDate: new Date(data.eventDate),
      eventTime: data.eventTime,
      location: data.location,
      description: data.description,
      invitees: {
        create: data.inviteeIds
          .filter(id => id !== hostId)
          .map(userId => ({ userId, rsvpStatus: 'PENDING' as RsvpStatus })),
      },
    },
    include: {
      host: { select: { id: true, name: true, familySurname: true } },
      invitees: {
        include: { user: { select: { id: true, name: true, familySurname: true } } },
      },
    },
  });

  // Notify each invitee
  await Promise.allSettled(
    data.inviteeIds
      .filter(id => id !== hostId)
      .map(userId =>
        createNotification({
          recipientId: userId,
          type: 'EVENT_INVITATION',
          title: `You're invited: ${event.title}`,
          body: `${event.host.name} invited you to ${event.title} on ${new Date(event.eventDate).toLocaleDateString()}.`,
          entityId: event.id,
          entityType: 'family_event',
        }),
      ),
  );

  res.status(201).json({ success: true, data: event });
});

// ── GET /events ───────────────────────────────
// Events where user is host OR invitee
eventsRouter.get('/', async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const events = await prisma.familyEvent.findMany({
    where: {
      OR: [
        { hostId: userId },
        { invitees: { some: { userId } } },
      ],
    },
    include: {
      host: { select: { id: true, name: true, familySurname: true } },
      invitees: {
        include: { user: { select: { id: true, name: true, familySurname: true } } },
      },
      _count: { select: { invitees: true, timelinePosts: true } },
    },
    orderBy: { eventDate: 'asc' },
  });

  // Attach current user's RSVP to each event
  const formatted = events.map(event => {
    const myInvite = event.invitees.find(inv => inv.userId === userId);
    return {
      ...event,
      myRsvp: event.hostId === userId ? 'GOING' : (myInvite?.rsvpStatus ?? null),
      rsvpCounts: {
        GOING: event.invitees.filter(i => i.rsvpStatus === 'GOING').length + (event.hostId === userId ? 1 : 0),
        INTERESTED: event.invitees.filter(i => i.rsvpStatus === 'INTERESTED').length,
        CANT_GO: event.invitees.filter(i => i.rsvpStatus === 'CANT_GO').length,
        PENDING: event.invitees.filter(i => i.rsvpStatus === 'PENDING').length,
      },
    };
  });

  res.json({ success: true, data: formatted });
});

// ── GET /events/:id ───────────────────────────
eventsRouter.get('/:id', async (req: AuthRequest, res) => {
  const eventId = req.params.id as string;
  const userId = req.userId!;

  const event = await prisma.familyEvent.findUnique({
    where: { id: eventId },
    include: {
      host: { select: { id: true, name: true, familySurname: true } },
      invitees: {
        include: { user: { select: { id: true, name: true, familySurname: true } } },
      },
      timelinePosts: {
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { comments: true, likes: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!event) throw new AppError(404, 'Event not found');

  // Check access: host or invitee
  const isParticipant = event.hostId === userId || event.invitees.some(i => i.userId === userId);
  if (!isParticipant) throw new AppError(403, 'Not authorized to view this event');

  const myInvite = event.invitees.find(inv => inv.userId === userId);
  const formatted = {
    ...event,
    myRsvp: event.hostId === userId ? 'GOING' : (myInvite?.rsvpStatus ?? null),
    rsvpCounts: {
      GOING: event.invitees.filter(i => i.rsvpStatus === 'GOING').length + (event.hostId === userId ? 1 : 0),
      INTERESTED: event.invitees.filter(i => i.rsvpStatus === 'INTERESTED').length,
      CANT_GO: event.invitees.filter(i => i.rsvpStatus === 'CANT_GO').length,
      PENDING: event.invitees.filter(i => i.rsvpStatus === 'PENDING').length,
    },
  };

  res.json({ success: true, data: formatted });
});

// ── PATCH /events/:id/rsvp ────────────────────
eventsRouter.patch('/:id/rsvp', async (req: AuthRequest, res) => {
  const eventId = req.params.id as string;
  const userId = req.userId!;
  const { rsvpStatus } = rsvpSchema.parse(req.body);

  const event = await prisma.familyEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(404, 'Event not found');
  if (event.hostId === userId) throw new AppError(400, 'Host cannot change RSVP');

  const updated = await prisma.eventInvitee.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, rsvpStatus },
    update: { rsvpStatus },
  });

  // Notify host of RSVP update
  await createNotification({
    recipientId: event.hostId,
    type: 'EVENT_RSVP_UPDATE',
    title: 'RSVP Update',
    body: `A family member updated their RSVP for ${event.title}.`,
    entityId: eventId,
    entityType: 'family_event',
  });

  res.json({ success: true, data: updated });
});
