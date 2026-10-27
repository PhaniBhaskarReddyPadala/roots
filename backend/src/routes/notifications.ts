import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { AppError } from '../middleware/errorHandler';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

// ── GET /notifications ────────────────────────
notificationsRouter.get('/', async (req: AuthRequest, res) => {
  const { unread } = req.query;

  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: req.userId!,
      ...(unread === 'true' ? { read: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { recipientId: req.userId!, read: false },
  });

  res.json({ success: true, data: { notifications, unreadCount } });
});

// ── PATCH /notifications/:id/read ────────────
notificationsRouter.patch('/:id/read', async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) throw new AppError(404, 'Notification not found.');
  if (notification.recipientId !== req.userId) {
    throw new AppError(403, 'Access denied.');
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  res.json({ success: true, data: updated });
});

// ── PATCH /notifications/read-all ────────────
notificationsRouter.patch('/read-all', async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { recipientId: req.userId!, read: false },
    data: { read: true },
  });

  res.json({ success: true, message: 'All notifications marked as read.' });
});
