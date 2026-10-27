import { NotificationType } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityId?: string;
  entityType?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      body: input.body,
      entityId: input.entityId,
      entityType: input.entityType,
      read: false,
    },
  });
}
