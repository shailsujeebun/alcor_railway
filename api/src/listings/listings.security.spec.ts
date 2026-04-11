import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ListingsService } from './listings.service';

describe('ListingsService security controls', () => {
  let service: ListingsService;
  let prisma: any;
  let tx: any;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    tx = {
      listingMedia: { deleteMany: jest.fn() },
      listingAttribute: { upsert: jest.fn(), deleteMany: jest.fn() },
      listing: { update: jest.fn().mockResolvedValue({ id: '123' }) },
    };

    prisma = {
      listing: { findUnique: jest.fn() },
      $transaction: jest.fn(async (callback: (client: any) => any) =>
        callback(tx),
      ),
    };

    const notificationsService = { create: jest.fn() };
    service = new ListingsService(prisma, notificationsService as any);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('blocks cross-account listing updates for regular users', async () => {
    prisma.listing.findUnique.mockResolvedValue({
      id: '123',
      ownerUserId: 'owner-1',
    });

    await expect(
      service.update('123', {} as any, 'user-2', UserRole.USER),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(tx.listing.update).not.toHaveBeenCalled();
  });

  it('allows admin to update listing owned by another user', async () => {
    prisma.listing.findUnique.mockResolvedValue({
      id: '123',
      ownerUserId: 'owner-1',
    });

    await expect(
      service.update('123', {} as any, 'admin-1', UserRole.ADMIN),
    ).resolves.toMatchObject({ id: '123' });

    expect(tx.listing.update).toHaveBeenCalled();
  });

  it('blocks submit-for-moderation from non-owner actors', async () => {
    prisma.listing.findUnique.mockResolvedValue({
      id: '123',
      ownerUserId: 'owner-1',
      status: 'DRAFT',
      categoryId: BigInt(1),
      media: [{ id: 'm1' }],
      seller: { id: 's1' },
      attribute: { data: {} },
    });

    await expect(
      service.submitForModeration('123', 'user-2', UserRole.USER),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
