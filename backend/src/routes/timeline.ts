import { Router } from 'express';
import { z } from 'zod';
import { TimelineEntryType, TimelineVisibility } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { AppError } from '../middleware/errorHandler';

export const timelineRouter = Router();
timelineRouter.use(authenticate);

const createEntrySchema = z.object({
  content: z.string().min(1, 'Content is required'),
  imageUrl: z.string().optional(),
  entryType: z.enum(['POST', 'MILESTONE', 'EVENT_MEMORY']).default('POST'),
  title: z.string().optional(),
  eventDate: z.string().optional().refine((val) => {
    if (!val) return true;
    const d = new Date(val);
    return !isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 2100;
  }, 'Please provide a valid event date between year 1900 and 2100'),
  visibility: z.enum(['FAMILY', 'PUBLIC']).default('FAMILY'),
  taggedUserIds: z.array(z.string()).default([]),
  familyEventId: z.string().optional(),
});

// ── POST /timeline ─────────────────────────────
// Create a new timeline entry
timelineRouter.post('/', async (req: AuthRequest, res) => {
  const data = createEntrySchema.parse(req.body);

  const entry = await prisma.post.create({
    data: {
      content: data.content,
      imageUrl: data.imageUrl,
      authorId: req.userId!,
      entryType: data.entryType,
      title: data.title,
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      visibility: data.visibility,
      taggedUserIds: data.taggedUserIds,
      familyEventId: data.familyEventId,
    },
    include: {
      author: { select: { id: true, name: true, familySurname: true, accountType: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  res.status(201).json({ success: true, data: { ...entry, hasLiked: false } });
});

// ── GET /timeline/me ───────────────────────────
// Merged family feed: own posts + family member posts + family events
timelineRouter.get('/me', async (req: AuthRequest, res) => {
  const userId = req.userId!;

  // 1. Get all family member IDs (entire connected family graph up to depth 10)
  const { buildFamilyGraph } = await import('../services/graphService');
  const graph = await buildFamilyGraph(userId, 10);
  
  const familyMemberIds = new Set(graph.nodes.keys());
  const feedUserIds = Array.from(familyMemberIds);

  // 2. Get posts from self + all connected family members
  const posts = await prisma.post.findMany({
    where: { authorId: { in: feedUserIds } },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, familySurname: true, accountType: true } },
      _count: { select: { comments: true, likes: true } },
      likes: { where: { userId } },
      familyEvent: { select: { id: true, title: true, eventDate: true, location: true } },
    },
    take: 100,
  });

  // 3. Get all family events where this user is a participant (host or invitee)
  const events = await prisma.familyEvent.findMany({
    where: {
      OR: [
        { hostId: userId },
        { invitees: { some: { userId } } },
      ],
    },
    include: {
      host: { select: { id: true, name: true, familySurname: true, accountType: true } },
      invitees: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { eventDate: 'desc' },
    take: 100,
  });

  // 4. Convert events to timeline-entry shape
  const eventEntries = events.map(event => ({
    id: `event-${event.id}`,
    _isEvent: true,
    entryType: 'EVENT_MEMORY' as const,
    title: event.title,
    content: event.description || `${event.host.name} created this event.`,
    imageUrl: null,
    eventDate: event.eventDate,
    createdAt: event.eventDate,
    updatedAt: event.eventDate,
    authorId: event.hostId,
    author: event.host,
    visibility: 'FAMILY' as const,
    taggedUserIds: [],
    familyEventId: event.id,
    familyEvent: { id: event.id, title: event.title, eventDate: event.eventDate, location: event.location },
    _count: { comments: 0, likes: 0 },
    hasLiked: false,
    myRsvp: event.hostId === userId ? 'GOING' : (event.invitees.find(i => i.userId === userId)?.rsvpStatus ?? 'PENDING'),
    inviteCount: event.invitees.length,
  }));

  // 5. Format own posts
  const postEntries = posts.map(e => ({ ...e, hasLiked: e.likes.length > 0, likes: undefined, _isEvent: false }));

  // 6. Merge and sort chronologically
  const merged = [...postEntries, ...eventEntries].sort((a, b) => {
    const dateA = new Date((a.eventDate || a.createdAt) as string | Date).getTime();
    const dateB = new Date((b.eventDate || b.createdAt) as string | Date).getTime();
    return dateB - dateA;
  });

  res.json({ success: true, data: merged });
});


// ── GET /timeline/user/:userId ─────────────────
// Another user's timeline
timelineRouter.get('/user/:userId', async (req: AuthRequest, res) => {
  const targetId = req.params.userId as string;
  const currentUserId = req.userId!;

  const entries = await prisma.post.findMany({
    where: { authorId: targetId },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, familySurname: true, accountType: true } },
      _count: { select: { comments: true, likes: true } },
      likes: { where: { userId: currentUserId } },
      familyEvent: { select: { id: true, title: true, eventDate: true, location: true } },
    },
    take: 100,
  });

  const formatted = entries.map(e => ({ ...e, hasLiked: e.likes.length > 0, likes: undefined }));
  res.json({ success: true, data: formatted });
});

// ── DELETE /timeline/:id ───────────────────────
timelineRouter.delete('/:id', async (req: AuthRequest, res) => {
  const postId = req.params.id as string;
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError(404, 'Entry not found');
  if (post.authorId !== req.userId) throw new AppError(403, 'Not authorized');

  await prisma.post.delete({ where: { id: postId } });
  res.json({ success: true, message: 'Entry deleted' });
});

// ── POST /timeline/:id/like ────────────────────
timelineRouter.post('/:id/like', async (req: AuthRequest, res) => {
  const postId = req.params.id as string;
  const userId = req.userId!;

  const existingLike = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existingLike) {
    await prisma.like.delete({ where: { postId_userId: { postId, userId } } });
    res.json({ success: true, data: { liked: false } });
  } else {
    await prisma.like.create({ data: { postId, userId } });
    res.json({ success: true, data: { liked: true } });
  }
});

// ── GET /timeline/:id/comments ─────────────────
timelineRouter.get('/:id/comments', async (req: AuthRequest, res) => {
  const postId = req.params.id as string;
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, name: true, accountType: true } } },
  });
  res.json({ success: true, data: comments });
});

// ── POST /timeline/:id/comments ────────────────
timelineRouter.post('/:id/comments', async (req: AuthRequest, res) => {
  const postId = req.params.id as string;
  const { content } = z.object({ content: z.string().min(1) }).parse(req.body);

  const comment = await prisma.comment.create({
    data: { content, postId, authorId: req.userId! },
    include: { author: { select: { id: true, name: true, accountType: true } } },
  });
  res.status(201).json({ success: true, data: comment });
});
