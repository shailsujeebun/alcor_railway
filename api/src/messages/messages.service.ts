import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { NotificationType, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponseDto } from '../common';
import { NotificationsService } from '../notifications/notifications.service';

const conversationIncludes = {
  listing: {
    include: {
      media: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
    },
  },
  buyer: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
  seller: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
};

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async resolveAdminRecipientId() {
    const alcorAdminUser = await this.prisma.user.findFirst({
      where: {
        email: 'admin@alcor.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (alcorAdminUser) return alcorAdminUser.id;

    const adminUser = await this.prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (adminUser) return adminUser.id;

    const managerUser = await this.prisma.user.findFirst({
      where: {
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (managerUser) return managerUser.id;

    throw new NotFoundException('No admin recipient available');
  }

  async startConversation(
    buyerId: string,
    listingId: string,
    _sellerId: string | undefined,
    body: string,
  ) {
    const id = BigInt(listingId);
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        ownerUserId: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerUserId && listing.ownerUserId === buyerId) {
      throw new BadRequestException(
        'You cannot send an inquiry for your own listing',
      );
    }

    const sellerId = await this.resolveAdminRecipientId();
    if (sellerId === buyerId) {
      throw new BadRequestException('You cannot start a conversation with yourself');
    }

    // Check if conversation already exists
    let conversation = await this.prisma.conversation.findUnique({
      where: {
        listingId_buyerId_sellerId: { listingId: id, buyerId, sellerId },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { listingId: id, buyerId, sellerId, lastMessageAt: new Date() },
      });
    }

    // Send the first message
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: buyerId,
        body,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    await this.notificationsService.create(
      sellerId,
      NotificationType.NEW_MESSAGE,
      'Нове повідомлення по оголошенню',
      body.length > 100 ? body.slice(0, 100) + '...' : body,
      `/cabinet/messages/${conversation.id}`,
    );

    return this.prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        ...conversationIncludes,
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });
  }

  async getUserConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    };
    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          ...conversationIncludes,
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        ...conversationIncludes,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Mark unread messages as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return conversation;
  }

  async sendMessage(conversationId: string, senderId: string, body: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (
      conversation.buyerId !== senderId &&
      conversation.sellerId !== senderId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const message = await this.prisma.message.create({
      data: { conversationId, senderId, body },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Notify the recipient
    const recipientId =
      conversation.buyerId === senderId
        ? conversation.sellerId
        : conversation.buyerId;
    await this.notificationsService.create(
      recipientId,
      NotificationType.NEW_MESSAGE,
      'Нове повідомлення',
      body.length > 100 ? body.slice(0, 100) + '...' : body,
      `/cabinet/messages/${conversationId}`,
    );

    return message;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
      },
    });
  }

  // ─── Admin Methods ─────────────────────────────────

  async findAllConversations(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { buyer: { email: { contains: search, mode: 'insensitive' } } },
        { seller: { email: { contains: search, mode: 'insensitive' } } },
        { listing: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          ...conversationIncludes,
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async getConversationAdmin(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        ...conversationIncludes,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async deleteConversation(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    await this.prisma.conversation.delete({ where: { id: conversationId } });
    return { deleted: true };
  }
}
