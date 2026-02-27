import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyUserRole, NotificationType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponseDto } from '../common';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';
import { CreateCompanyReviewDto } from './dto/create-company-review.dto';
import { UpdateCompanyFlagsDto } from './dto/update-company-flags.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private isPrivilegedRole(role?: string) {
    return role === UserRole.ADMIN || role === UserRole.MANAGER;
  }

  private async ensureCompanyUpdateAccess(
    companyId: string,
    actorUserId: string,
    actorRole?: string,
  ) {
    if (this.isPrivilegedRole(actorRole)) {
      return;
    }

    const membership = await this.prisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId: actorUserId,
          companyId,
        },
      },
      select: { role: true },
    });

    if (!membership || membership.role !== CompanyUserRole.OWNER) {
      throw new ForbiddenException(
        'You do not have permission to update this company',
      );
    }
  }

  async create(dto: CreateCompanyDto) {
    const { phones, activityTypeIds, brandIds, ...companyData } = dto;

    return this.prisma.company.create({
      data: {
        ...companyData,
        phones: phones ? { createMany: { data: phones } } : undefined,
        activities: activityTypeIds?.length
          ? {
              createMany: {
                data: activityTypeIds.map((id) => ({
                  activityTypeId: id,
                })),
              },
            }
          : undefined,
        brands: brandIds?.length
          ? {
              createMany: {
                data: brandIds.map((id) => ({ brandId: id })),
              },
            }
          : undefined,
      },
      include: {
        country: true,
        city: true,
        phones: true,
        activities: { include: { activityType: true } },
        brands: { include: { brand: true } },
      },
    });
  }

  async findAll(query: CompanyQueryDto) {
    const where: Record<string, unknown> = {};

    if (query.countryId) where.countryId = query.countryId;
    if (query.cityId) where.cityId = query.cityId;
    if (query.isOfficialDealer !== undefined)
      where.isOfficialDealer = query.isOfficialDealer;
    if (query.isManufacturer !== undefined)
      where.isManufacturer = query.isManufacturer;
    if (query.isVerified !== undefined) where.isVerified = query.isVerified;
    if (query.search)
      where.name = { contains: query.search, mode: 'insensitive' };

    if (query.activityTypeId) {
      where.activities = {
        some: { activityTypeId: query.activityTypeId },
      };
    }
    if (query.brandId) {
      where.brands = {
        some: { brandId: query.brandId },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          country: true,
          city: true,
          media: { where: { kind: 'LOGO' }, take: 1 },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return new PaginatedResponseDto(data, total, query.page!, query.limit!);
  }

  async findBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: {
        country: true,
        city: true,
        phones: true,
        media: { orderBy: { sortOrder: 'asc' } },
        activities: { include: { activityType: true } },
        brands: { include: { brand: true } },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with slug "${slug}" not found`);
    }

    return company;
  }

  async findMine(userId: string, role?: string) {
    if (this.isPrivilegedRole(role)) {
      return this.prisma.company.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, slug: true, name: true },
      });
    }

    const memberships = await this.prisma.companyUser.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        role: true,
        company: {
          select: { id: true, slug: true, name: true },
        },
      },
    });

    return memberships.map((membership) => ({
      ...membership.company,
      membershipRole: membership.role,
    }));
  }

  async update(
    id: string,
    dto: UpdateCompanyDto,
    actorUserId: string,
    actorRole?: string,
  ) {
    await this.ensureCompanyUpdateAccess(id, actorUserId, actorRole);

    const { phones, activityTypeIds, brandIds, ...companyData } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (activityTypeIds !== undefined) {
        await tx.companyActivityType.deleteMany({
          where: { companyId: id },
        });
        if (activityTypeIds.length > 0) {
          await tx.companyActivityType.createMany({
            data: activityTypeIds.map((atId) => ({
              companyId: id,
              activityTypeId: atId,
            })),
          });
        }
      }

      if (brandIds !== undefined) {
        await tx.companyBrand.deleteMany({ where: { companyId: id } });
        if (brandIds.length > 0) {
          await tx.companyBrand.createMany({
            data: brandIds.map((bId) => ({
              companyId: id,
              brandId: bId,
            })),
          });
        }
      }

      if (phones !== undefined) {
        await tx.companyPhone.deleteMany({ where: { companyId: id } });
        if (phones.length > 0) {
          await tx.companyPhone.createMany({
            data: phones.map((p) => ({ ...p, companyId: id })),
          });
        }
      }

      return tx.company.update({
        where: { id },
        data: companyData,
        include: {
          country: true,
          city: true,
          phones: true,
          activities: { include: { activityType: true } },
          brands: { include: { brand: true } },
        },
      });
    });
  }

  // ─── Reviews ─────────────────────────────────────

  async createReview(companyId: string, dto: CreateCompanyReviewDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company "${companyId}" not found`);
    }

    const review = await this.prisma.companyReview.create({
      data: { ...dto, companyId },
    });

    // Recalculate denormalized rating
    const agg = await this.prisma.companyReview.aggregate({
      where: { companyId },
      _count: true,
      _avg: { rating: true },
    });

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        reviewsCount: agg._count,
        ratingAvg: agg._avg.rating ?? 0,
      },
    });

    // Notify company owners about new review
    const companyUsers = await this.prisma.companyUser.findMany({
      where: { companyId, role: 'OWNER' },
      select: { userId: true },
    });
    for (const cu of companyUsers) {
      this.notificationsService.create(
        cu.userId,
        NotificationType.REVIEW_RECEIVED,
        'Новий відгук',
        `Нова оцінка ${dto.rating}/5 для "${company.name}"`,
        `/companies/${company.slug}`,
      );
    }

    return review;
  }

  async findReviews(companyId: string, query: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.prisma.companyReview.findMany({
        where: { companyId },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.companyReview.count({ where: { companyId } }),
    ]);

    return new PaginatedResponseDto(data, total, query.page!, query.limit!);
  }

  // ─── Admin Methods ─────────────────────────────────

  async toggleVerified(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException(`Company "${id}" not found`);

    return this.prisma.company.update({
      where: { id },
      data: { isVerified: !company.isVerified },
    });
  }

  async updateFlags(id: string, dto: UpdateCompanyFlagsDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException(`Company "${id}" not found`);

    return this.prisma.company.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException(`Company "${id}" not found`);

    return this.prisma.company.delete({ where: { id } });
  }

  async deleteReview(companyId: string, reviewId: string) {
    const review = await this.prisma.companyReview.findFirst({
      where: { id: reviewId, companyId },
    });
    if (!review) throw new NotFoundException(`Review "${reviewId}" not found`);

    await this.prisma.companyReview.delete({ where: { id: reviewId } });

    // Recalculate denormalized rating
    const agg = await this.prisma.companyReview.aggregate({
      where: { companyId },
      _count: true,
      _avg: { rating: true },
    });

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        reviewsCount: agg._count,
        ratingAvg: agg._avg.rating ?? 0,
      },
    });

    return { deleted: true };
  }
}
