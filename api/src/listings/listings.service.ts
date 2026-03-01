// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ListingStatus, NotificationType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponseDto } from '../common';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { UpdateListingContactDto } from './dto/update-listing-contact.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { evaluateRuleTree } from '../common/rule-tree';
import {
  getBuiltInEngineBlock,
  mergeTemplateFieldsWithBlocks,
} from '../templates/template-schema';

const VALID_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  DRAFT: [ListingStatus.SUBMITTED],
  SUBMITTED: [ListingStatus.PENDING_MODERATION, ListingStatus.DRAFT],
  PENDING_MODERATION: [ListingStatus.ACTIVE, ListingStatus.REJECTED],
  ACTIVE: [ListingStatus.PAUSED, ListingStatus.EXPIRED, ListingStatus.REMOVED],
  PAUSED: [ListingStatus.ACTIVE, ListingStatus.REMOVED],
  EXPIRED: [ListingStatus.DRAFT],
  REJECTED: [ListingStatus.DRAFT],
  REMOVED: [],
};

const listingIncludes = {
  company: { include: { country: true, city: true } },
  category: true,
  brand: true,
  country: true,
  city: true,
  media: { orderBy: { sortOrder: 'asc' as const } },
  attribute: true,
  ownerUser: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
};

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private isPrivilegedRole(role?: string) {
    return role === UserRole.ADMIN || role === UserRole.MANAGER;
  }

  private ensureListingMutationAccess(
    listing: { ownerUserId?: string | null },
    actorUserId: string,
    actorRole?: string,
  ) {
    if (this.isPrivilegedRole(actorRole)) {
      return;
    }

    if (!listing.ownerUserId || listing.ownerUserId !== actorUserId) {
      throw new ForbiddenException(
        'You do not have permission to modify this listing',
      );
    }
  }

  private parseBigIntId(value: string, fieldName: string): bigint {
    const normalized = String(value ?? '').trim();
    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    try {
      return BigInt(normalized);
    } catch {
      throw new BadRequestException(`${fieldName} must be a numeric id`);
    }
  }

  async create(
    dto: CreateListingDto,
    ownerUserId?: string,
    callerRole?: string,
  ) {
    console.log('=== CREATE METHOD CALLED ===');
    console.log('DTO:', JSON.stringify(dto, null, 2));
    console.log('ownerUserId:', ownerUserId);
    console.log('callerRole:', callerRole);

    const {
      media,
      attributes,
      companyId,
      categoryId,
      brandId,
      countryId,
      cityId,
      sellerPhones,
      priceAmount,
      priceCurrency,
      priceType,
      condition,
      year,
      hoursValue,
      hoursUnit,
      listingType,
      euroClass,
      sellerName,
      sellerEmail,
      externalUrl,
      isVideo,
      ...rest
    } = dto;

    const attributesData =
      attributes && attributes.length > 0
        ? Object.fromEntries(attributes.map((a) => [a.key, a.value]))
        : undefined;

    // Admin/Manager listings are auto-published; regular users start as DRAFT
    const isPrivileged =
      callerRole === UserRole.ADMIN || callerRole === UserRole.MANAGER;
    const status = isPrivileged ? ListingStatus.ACTIVE : ListingStatus.DRAFT;

    // Fetch category to get marketplaceId
    let marketplaceId: bigint | undefined;
    if (categoryId) {
      const parsedCategoryId = this.parseBigIntId(categoryId, 'categoryId');
      const cat = await this.prisma.category.findUnique({
        where: { id: parsedCategoryId },
      });
      if (!cat) throw new NotFoundException('Category not found');
      marketplaceId = cat.marketplaceId;
    }

    if (!marketplaceId && categoryId) {
      throw new BadRequestException('Category must belong to a marketplace');
    }
    // If no categoryId, we might fail validation if marketplaceId is required.
    // Schema says marketplaceId is required. So categoryId is effectively required for now unless we look it up from elsewhere.
    if (!marketplaceId) {
      throw new BadRequestException(
        'Category is required to determine marketplace',
      );
    }

    let listing;
    try {
      console.log('Creating listing with data:', {
        title: rest.title,
        marketplaceId,
        companyId,
        categoryId,
        hasMedia: !!media,
        hasAttributes: !!attributes,
      });

      listing = await this.prisma.listing.create({
        data: {
          ...rest,
          marketplace: { connect: { id: marketplaceId } },
          company: { connect: { id: companyId } },
          ownerUser: ownerUserId ? { connect: { id: ownerUserId } } : undefined,
          category: categoryId
            ? { connect: { id: this.parseBigIntId(categoryId, 'categoryId') } }
            : undefined,
          brand: brandId ? { connect: { id: brandId } } : undefined,
          country: countryId ? { connect: { id: countryId } } : undefined,
          city: cityId ? { connect: { id: cityId } } : undefined,
          status,
          publishedAt: isPrivileged ? new Date() : undefined,
          fact: {
            create: {
              priceAmount,
              priceCurrency,
              year,
              condition,
            },
          },
          media: media
            ? {
                createMany: {
                  data: media.map((m) => {
                    const { key, ...mediaData } = m;
                    return mediaData;
                  }),
                },
              }
            : undefined,
          attribute: attributesData
            ? { create: { data: attributesData } }
            : undefined,
        },
        include: listingIncludes,
      });

      console.log('Listing created successfully:', listing.id);
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }

    // Ensure brand/category mapping is persisted for future dropdown filtering.
    if (brandId && categoryId) {
      try {
        await this.prisma.brandCategory.upsert({
          where: {
            brandId_categoryId: {
              brandId,
              categoryId: this.parseBigIntId(categoryId, 'categoryId'),
            },
          },
          create: {
            brandId,
            categoryId: this.parseBigIntId(categoryId, 'categoryId'),
          },
          update: {},
        });
      } catch {
        // Keep listing creation resilient even if category-brand mapping table
        // is not migrated yet or category relation is temporarily invalid.
      }
    }

    // Skip syncFacts for now since we create ListingFact during creation
    // await this.syncFacts(listing.id.toString());

    await this.prisma.company.update({
      where: { id: companyId },
      data: { listingsCount: { increment: 1 } },
    });

    return listing;
  }

  async findAll(query: ListingQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.marketplaceId) where.marketplaceId = BigInt(query.marketplaceId);
    if (query.companyId) where.companyId = query.companyId;
    if (query.categoryId) where.categoryId = BigInt(query.categoryId);
    if (query.brandId) where.brandId = query.brandId;
    if (query.countryId) where.countryId = query.countryId;
    if (query.cityId) where.cityId = query.cityId;
    if (query.condition) where.condition = query.condition;
    if (query.status) where.status = query.status;
    if (query.ownerUserId) where.ownerUserId = query.ownerUserId;
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }
    if (query.listingType) where.listingType = query.listingType;
    if (query.euroClass) where.euroClass = query.euroClass;
    if (query.priceCurrency) where.priceCurrency = query.priceCurrency;

    // Default to only showing ACTIVE listings for public queries
    if (!query.status && !query.ownerUserId) {
      where.status = ListingStatus.ACTIVE;
    }

    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.priceMin !== undefined) priceFilter.gte = query.priceMin;
      if (query.priceMax !== undefined) priceFilter.lte = query.priceMax;
      where.priceAmount = priceFilter;
    }

    if (query.yearMin !== undefined || query.yearMax !== undefined) {
      const yearFilter: Record<string, number> = {};
      if (query.yearMin !== undefined) yearFilter.gte = query.yearMin;
      if (query.yearMax !== undefined) yearFilter.lte = query.yearMax;
      where.year = yearFilter;
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' };
    switch (query.sort) {
      case 'publishedAt':
        orderBy = { publishedAt: 'desc' };
        break;
      case 'priceAsc':
        orderBy = { priceAmount: 'asc' };
        break;
      case 'priceDesc':
        orderBy = { priceAmount: 'desc' };
        break;
      case 'yearDesc':
        orderBy = { year: 'desc' };
        break;
      case 'yearAsc':
        orderBy = { year: 'asc' };
        break;
    }

    const [data, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include: {
          company: { include: { country: true, city: true } },
          category: true,
          brand: true,
          country: true,
          city: true,
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return new PaginatedResponseDto(data, total, query.page!, query.limit!);
  }

  async findByCompany(companyId: string, query: ListingQueryDto) {
    const where: Record<string, unknown> = { companyId };
    if (query.categoryId) where.categoryId = BigInt(query.categoryId);
    if (query.brandId) where.brandId = query.brandId;
    if (query.status) where.status = query.status;

    // Default to ACTIVE for public company listing views
    if (!query.status) {
      where.status = ListingStatus.ACTIVE;
    }

    const [data, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          brand: true,
          country: true,
          city: true,
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return new PaginatedResponseDto(data, total, query.page!, query.limit!);
  }

  async findById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: listingIncludes,
    });

    if (!listing) {
      throw new NotFoundException(`Listing "${id}" not found`);
    }

    return listing;
  }

  async update(
    id: string,
    dto: UpdateListingDto,
    actorUserId: string,
    actorRole?: string,
  ) {
    console.log('=== UPDATE METHOD CALLED ===');
    console.log('ID:', id, 'Type:', typeof id);
    console.log('DTO keys:', Object.keys(dto));

    const listing = await this.findById(id);
    this.ensureListingMutationAccess(listing, actorUserId, actorRole);

    const {
      media,
      attributes,
      categoryId,
      brandId,
      countryId,
      cityId,
      sellerPhones,
      ...rest
    } = dto;

    const attributesData =
      attributes && attributes.length > 0
        ? Object.fromEntries(attributes.map((a) => [a.key, a.value]))
        : undefined;

    return this.prisma.$transaction(async (tx) => {
      if (media !== undefined) {
        await tx.listingMedia.deleteMany({ where: { listingId: BigInt(id) } });
        if (media.length > 0) {
          await tx.listingMedia.createMany({
            data: media.map((m) => {
              const { key, ...mediaData } = m;
              return { ...mediaData, listingId: BigInt(id) };
            }),
          });
        }
      }

      if (attributes !== undefined) {
        if (attributesData) {
          await tx.listingAttribute.upsert({
            where: { listingId: BigInt(id) },
            create: {
              listingId: BigInt(id),
              data: attributesData,
            },
            update: {
              data: attributesData,
            },
          });
        } else {
          await tx.listingAttribute.deleteMany({
            where: { listingId: BigInt(id) },
          });
        }
      }

      const updated = await tx.listing.update({
        where: { id: BigInt(id) },
        data: {
          ...rest,
          sellerPhones: sellerPhones,
          category:
            categoryId !== undefined
              ? categoryId
                ? { connect: { id: BigInt(categoryId) } }
                : { disconnect: true }
              : undefined,
          brand:
            brandId !== undefined
              ? brandId
                ? { connect: { id: brandId } }
                : { disconnect: true }
              : undefined,
          country:
            countryId !== undefined
              ? countryId
                ? { connect: { id: countryId } }
                : { disconnect: true }
              : undefined,
          city:
            cityId !== undefined
              ? cityId
                ? { connect: { id: cityId } }
                : { disconnect: true }
              : undefined,
        },
        include: listingIncludes,
      });

      return updated;
    });

    await this.syncFacts(id);
    return result;
  }

  // ─── Status State Machine ──────────────────────────

  async submitForModeration(
    id: string,
    actorUserId: string,
    actorRole?: string,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        category: true,
        media: true,
        seller: true,
        attribute: true,
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing "${id}" not found`);
    }

    this.ensureListingMutationAccess(listing, actorUserId, actorRole);

    this.validateTransition(listing.status, ListingStatus.SUBMITTED);

    // ─── Validation ──────────────────────────────────
    const errors: string[] = [];

    // 1. Basic Info
    if (!listing.title) errors.push('Title is required');
    if (!listing.categoryId) errors.push('Category is required');

    // 2. Media
    if (!listing.media || listing.media.length === 0) {
      errors.push('At least one image is required');
    }

    // 3. Contact
    if (!listing.seller) {
      errors.push('Seller contact information is required');
    }

    // 4. Attributes
    if (listing.categoryId) {
      const attrData = (listing.attribute?.data as Record<string, any>) || {};
      const attrValidation = await this.validateDraft(
        listing.categoryId.toString(),
        attrData,
      );
      if (!attrValidation.success) {
        errors.push(
          ...attrValidation.errors.map(
            (e) => `Attribute ${e.field}: ${e.message}`,
          ),
        );
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Listing is incomplete',
        errors,
      });
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        status: ListingStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: listingIncludes,
    });
  }

  async approve(id: string) {
    const listing = await this.findById(id);
    // Allow from SUBMITTED or PENDING_MODERATION
    if (listing.status === ListingStatus.SUBMITTED) {
      // Skip straight to ACTIVE
    } else {
      this.validateTransition(listing.status, ListingStatus.ACTIVE);
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        status: ListingStatus.ACTIVE,
        moderatedAt: new Date(),
        publishedAt: new Date(),
      },
      include: listingIncludes,
    });

    await this.syncFacts(id);

    if (listing.ownerUserId) {
      this.notificationsService.create(
        listing.ownerUserId,
        NotificationType.LISTING_APPROVED,
        'Оголошення схвалено',
        `Ваше оголошення "${listing.title}" було схвалено`,
        `/listings/${id}`,
      );
    }

    return updated;
  }

  async reject(id: string, reason: string) {
    const listing = await this.findById(id);
    if (
      listing.status !== ListingStatus.SUBMITTED &&
      listing.status !== ListingStatus.PENDING_MODERATION
    ) {
      throw new BadRequestException(
        `Cannot reject listing in ${listing.status} status`,
      );
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        status: ListingStatus.REJECTED,
        moderationReason: reason,
        moderatedAt: new Date(),
      },
      include: listingIncludes,
    });

    if (listing.ownerUserId) {
      this.notificationsService.create(
        listing.ownerUserId,
        NotificationType.LISTING_REJECTED,
        'Оголошення відхилено',
        `Ваше оголошення "${listing.title}" було відхилено: ${reason}`,
        `/cabinet/listings`,
      );
    }

    return updated;
  }

  async pause(id: string, actorUserId: string, actorRole?: string) {
    const listing = await this.findById(id);
    this.ensureListingMutationAccess(listing, actorUserId, actorRole);
    this.validateTransition(listing.status, ListingStatus.PAUSED);

    return this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.PAUSED },
      include: listingIncludes,
    });
  }

  async resume(id: string, actorUserId: string, actorRole?: string) {
    const listing = await this.findById(id);
    this.ensureListingMutationAccess(listing, actorUserId, actorRole);
    this.validateTransition(listing.status, ListingStatus.ACTIVE);

    return this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.ACTIVE },
      include: listingIncludes,
    });
  }

  async resubmit(id: string, actorUserId: string, actorRole?: string) {
    const listing = await this.findById(id);
    this.ensureListingMutationAccess(listing, actorUserId, actorRole);
    if (
      listing.status !== ListingStatus.REJECTED &&
      listing.status !== ListingStatus.EXPIRED
    ) {
      throw new BadRequestException(
        `Cannot resubmit listing in ${listing.status} status`,
      );
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        status: ListingStatus.DRAFT,
        moderationReason: null,
      },
      include: listingIncludes,
    });
  }

  async removeListing(id: string) {
    const listing = await this.findById(id);
    if (listing.status === ListingStatus.REMOVED) {
      throw new BadRequestException('Listing is already removed');
    }

    return this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.REMOVED },
      include: listingIncludes,
    });
  }

  private validateTransition(current: ListingStatus, target: ListingStatus) {
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${target}`,
      );
    }
  }
  // ─── Draft Validation ──────────────────────────────

  async validateDraft(
    categoryId: string,
    attributes: Record<string, any> = {},
  ) {
    const parsedCategoryId = this.parseBigIntId(categoryId, 'categoryId');

    // 1. Fetch active template for category
    const category = await this.prisma.category.findUnique({
      where: { id: parsedCategoryId },
      include: {
        formTemplates: {
          where: { isActive: true },
          orderBy: { version: 'desc' },
          take: 1,
          include: { fields: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const template = category.formTemplates[0];
    if (!template) {
      // No template means no validation needed (or default validation)
      return { success: true, errors: [] };
    }

    const blockIds = Array.isArray((template as any).blockIds)
      ? (template as any).blockIds.map((id: any) => String(id))
      : [];
    let blocks:
      | Array<{
          id: string;
          name: string;
          isSystem: boolean;
          fields: any;
        }>
      = [];
    if (blockIds.length > 0) {
      try {
        blocks = await this.prisma.formBlock.findMany({
          where: { id: { in: blockIds } },
          orderBy: { name: 'asc' },
        });
      } catch {
        // Keep draft validation resilient if form_block table is missing or
        // temporarily unavailable in local environments.
        blocks = [];
      }
    }

    if (
      Boolean((category as any).hasEngine) &&
      blockIds.includes('engine_block')
    ) {
      const engineBlock = getBuiltInEngineBlock();
      blocks = blocks.filter((block) => block.id !== 'engine_block');
      blocks.push({
        id: engineBlock.id,
        name: engineBlock.name,
        isSystem: true,
        fields: engineBlock.fields,
      });
    }

    const mergedFields = mergeTemplateFieldsWithBlocks(
      (template as any).fields ?? [],
      blocks.map((block) => ({
        id: block.id,
        name: block.name,
        isSystem: block.isSystem,
        fields: block.fields ?? [],
      })),
    );

    const context = {
      category: {
        id: category.id.toString(),
        slug: category.slug,
        hasEngine: Boolean((category as any).hasEngine),
      },
    };

    // 2. Validate attributes against template fields
    const errors: { field: string; message: string }[] = [];

    for (const field of mergedFields) {
      const value = attributes[field.key];
      const visible = evaluateRuleTree(field.visibleIf, attributes, context);
      if (!visible) continue;

      const requiredByRule = evaluateRuleTree(
        field.requiredIf,
        attributes,
        context,
      );
      const required = Boolean(
        field.required || field.isRequired || requiredByRule,
      );

      // Check required
      if (required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.key,
          message: 'This field is required',
        });
        continue;
      }

      if (value !== undefined && value !== null) {
        // Type validation
        if (field.component === 'number' && typeof value !== 'number') {
          // Allow numeric strings
          if (isNaN(Number(value))) {
            errors.push({ field: field.key, message: 'Must be a number' });
          }
        }
        if (
          field.component === 'checkbox' &&
          String(field.type ?? '').toUpperCase() !== 'CHECKBOX_GROUP' &&
          typeof value !== 'boolean' &&
          value !== 'true' &&
          value !== 'false'
        ) {
          errors.push({ field: field.key, message: 'Must be a boolean' });
        }
        if (
          field.component === 'checkbox' &&
          String(field.type ?? '').toUpperCase() === 'CHECKBOX_GROUP'
        ) {
          const isValidGroupValue =
            Array.isArray(value) ||
            typeof value === 'string' ||
            value === null ||
            value === undefined;
          if (!isValidGroupValue) {
            errors.push({
              field: field.key,
              message: 'Must be a comma-separated list or array',
            });
          }
        }

        // Custom validations (min/max)
        if (field.validationRules) {
          const rules = field.validationRules;
          if (rules.min !== undefined && Number(value) < rules.min) {
            errors.push({
              field: field.key,
              message: `Minimum value is ${rules.min}`,
            });
          }
          if (rules.max !== undefined && Number(value) > rules.max) {
            errors.push({
              field: field.key,
              message: `Maximum value is ${rules.max}`,
            });
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  async updateAttributes(
    id: string,
    attributes: Record<string, any>,
    actorUserId: string,
    actorRole?: string,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!listing) {
      throw new NotFoundException(`Listing "${id}" not found`);
    }

    this.ensureListingMutationAccess(listing, actorUserId, actorRole);

    if (!listing.categoryId) {
      throw new BadRequestException(
        'Listing does not have a category assigned',
      );
    }

    // Validate attributes
    const validation = await this.validateDraft(
      listing.categoryId.toString(),
      attributes,
    );
    if (!validation.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Upsert attributes
    return this.prisma.listingAttribute.upsert({
      where: { listingId: id },
      create: {
        listingId: id,
        data: attributes,
      },
      update: {
        data: attributes,
      },
    });
  }

  async updateContact(
    id: string,
    dto: UpdateListingContactDto,
    actorUserId: string,
    actorRole?: string,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { seller: { include: { sellerContact: true } } },
    });

    if (!listing) {
      throw new NotFoundException(`Listing "${id}" not found`);
    }

    this.ensureListingMutationAccess(listing, actorUserId, actorRole);

    // If listing already has a seller contact linked, update it
    if (listing.seller && listing.seller.sellerContact) {
      return this.prisma.sellerContact.update({
        where: { id: listing.seller.sellerContactId },
        data: {
          name: dto.name,
          email: dto.email,
          phoneCountry: dto.phoneCountry,
          phoneNumber: dto.phoneNumber,
          privacyConsent: dto.privacyConsent ?? false,
          termsConsent: dto.termsConsent ?? false,
        },
      });
    }

    // Otherwise create new contact and link it
    const contact = await this.prisma.sellerContact.create({
      data: {
        name: dto.name,
        email: dto.email,
        phoneCountry: dto.phoneCountry,
        phoneNumber: dto.phoneNumber,
        privacyConsent: dto.privacyConsent ?? false,
        termsConsent: dto.termsConsent ?? false,
      },
    });

    await this.prisma.listingSeller.create({
      data: {
        listingId: BigInt(id),
        sellerContactId: contact.id,
      },
    });

    return contact;
  }

  // ─── Fact Sync ─────────────────────────────────────

  private async syncFacts(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: BigInt(listingId) },
      include: {
        attribute: true,
        country: true,
        city: true,
      },
    });

    if (!listing) return;

    const attrs = (listing.attribute?.data as Record<string, any>) || {};

    // Extract standard facts
    // Note: listing.priceAmount is Decimal, we might need to cast or keep as is.
    // Prisma Decimal fits into Decimal used in ListingFact.
    const priceAmount = listing.priceAmount;
    const priceCurrency = listing.priceCurrency;

    // Try to find common attributes if not on root
    // Attributes are strings in JSON usually, need parsing.
    const year = listing.year ?? (attrs.year ? parseInt(attrs.year) : null);

    // Mileage could be 'seconds', 'hours', 'mileage_km'
    let mileage: number | null = null;
    if (attrs.mileage_km) mileage = parseInt(attrs.mileage_km);
    if (attrs.hours) mileage = parseInt(attrs.hours);

    const condition = listing.condition;

    await this.prisma.listingFact.upsert({
      where: { listingId: BigInt(listingId) },
      create: {
        listingId: BigInt(listingId),
        priceAmount,
        priceCurrency,
        year: year ? year : undefined,
        mileageKm: mileage ? mileage : undefined,
        condition,
        country: listing.country?.name,
        city: listing.city?.name,
      },
      update: {
        priceAmount,
        priceCurrency,
        year: year ? year : undefined,
        mileageKm: mileage ? mileage : undefined,
        condition,
        country: listing.country?.name,
        city: listing.city?.name,
      },
    });
  }
}
