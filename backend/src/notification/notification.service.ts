import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  payload?: Prisma.InputJsonValue;
  eventId?: string;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    if (input.eventId) {
      const existing = await this.prisma.notification.findUnique({
        where: {
          eventId_userId: {
            eventId: input.eventId,
            userId: input.userId,
          },
        },
      });
      if (existing) return existing;
    }

    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        payloadJson: input.payload,
        eventId: input.eventId,
      },
    });
  }

  async createMany(inputs: CreateNotificationInput[]) {
    const created: Awaited<ReturnType<typeof this.create>>[] = [];
    for (const input of inputs) {
      created.push(await this.create(input));
    }
    return created;
  }

  async list(userId: string, page = 1, limit = 20, type?: NotificationType) {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(type ? { type } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async unreadCount(userId: string) {
    const [count, latest] = await Promise.all([
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
      this.prisma.notification.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, title: true, body: true },
      }),
    ]);
    return {
      count,
      latestCreatedAt: latest?.createdAt?.toISOString() ?? null,
      latestTitle: latest?.title ?? null,
      latestBody: latest?.body ?? null,
    };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) return null;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  /** Architecture stub for Phase 3+ email/SMS channels */
  async dispatchExternalChannel(
    _channel: 'email' | 'sms' | 'whatsapp',
    _userId: string,
    _template: string,
    _data: Record<string, unknown>,
  ) {
    return { queued: false, reason: 'channel_not_enabled_phase_2' };
  }
}
