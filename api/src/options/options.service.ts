import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CategorySubmissionStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type OptionItem = { value: string; label: string };
type CategoryTemplateSource = Prisma.FormTemplateGetPayload<{
  include: {
    fields: {
      include: {
        options: true;
      };
    };
  };
}>;
type CategoryOptionResult = {
  value: string;
  label: string;
  status: CategorySubmissionStatus;
};

@Injectable()
export class OptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private isPrivilegedRole(role?: string) {
    return role === UserRole.ADMIN || role === UserRole.MANAGER;
  }

  private slugify(input: string): string {
    const normalized = input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');
    return normalized || 'custom-item';
  }

  async getBrandOptions(categoryId?: string): Promise<OptionItem[]> {
    const brands = await this.prisma.brand.findMany({
      where:
        categoryId && /^\d+$/.test(categoryId)
          ? {
              OR: [
                { categories: { some: { categoryId: BigInt(categoryId) } } },
                { listings: { some: { categoryId: BigInt(categoryId) } } },
              ],
            }
          : undefined,
      orderBy: { name: 'asc' },
      take: 500,
    });

    return brands.map((brand) => ({ value: brand.id, label: brand.name }));
  }

  async getModelOptions(brandId?: string): Promise<OptionItem[]> {
    if (!brandId) return [];

    let storedModels: Array<{ name: string }> = [];
    try {
      storedModels = await this.prisma.model.findMany({
        where: { brandId },
        orderBy: { name: 'asc' },
        take: 500,
      });
    } catch {
      storedModels = [];
    }
    if (storedModels.length > 0) {
      return storedModels.map((model) => ({
        value: model.name,
        label: model.name,
      }));
    }

    let rows: Array<{ value: string | null }> = [];
    try {
      rows = await this.prisma.$queryRaw<Array<{ value: string | null }>>(
        Prisma.sql`
          SELECT DISTINCT NULLIF(TRIM(la.data->>'model'), '') AS value
          FROM listing_attribute la
          INNER JOIN listing l ON l.listing_id = la.listing_id
          WHERE l.brand_id = ${brandId}
          ORDER BY value ASC
          LIMIT 500
        `,
      );
    } catch {
      rows = [];
    }

    const options = rows
      .map((row) => row.value?.trim())
      .filter((value): value is string => Boolean(value))
      .map((value) => ({ value, label: value }));

    if (options.length > 0) return options;

    let listingTitleFallback: Array<{ title: string | null }> = [];
    try {
      listingTitleFallback = await this.prisma.listing.findMany({
        where: { brandId, title: { not: null } },
        select: { title: true },
        orderBy: { title: 'asc' },
        take: 100,
      });
    } catch {
      listingTitleFallback = [];
    }

    const deduped = new Set<string>();
    for (const listing of listingTitleFallback) {
      const title = (listing.title ?? '').trim();
      if (title) deduped.add(title);
    }
    return Array.from(deduped).map((value) => ({ value, label: value }));
  }

  async createBrand(name: string, categoryId?: string): Promise<OptionItem> {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Brand name is required');
    }

    const brand = await this.prisma.brand.upsert({
      where: { name: normalizedName },
      create: { name: normalizedName },
      update: {},
    });

    if (categoryId && /^\d+$/.test(categoryId)) {
      await this.prisma.brandCategory.upsert({
        where: {
          brandId_categoryId: {
            brandId: brand.id,
            categoryId: BigInt(categoryId),
          },
        },
        create: {
          brandId: brand.id,
          categoryId: BigInt(categoryId),
        },
        update: {},
      });
    }

    return { value: brand.id, label: brand.name };
  }

  async createModel(
    name: string,
    brandId?: string,
    categoryId?: string,
  ): Promise<OptionItem> {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Model name is required');
    }

    const normalizedBrandId = brandId || undefined;
    const normalizedCategoryId =
      categoryId && /^\d+$/.test(categoryId) ? BigInt(categoryId) : undefined;

    const existing = await this.prisma.model.findFirst({
      where: {
        name: normalizedName,
        brandId: normalizedBrandId,
        categoryId: normalizedCategoryId,
      },
    });
    if (existing) {
      return { value: existing.name, label: existing.name };
    }

    const model = await this.prisma.model.create({
      data: {
        name: normalizedName,
        brandId: normalizedBrandId,
        categoryId: normalizedCategoryId,
      },
    });

    return { value: model.name, label: model.name };
  }

  private async cloneTemplateToCategory(
    tx: Prisma.TransactionClient,
    category: { id: bigint; parentId: bigint | null; hasEngine: boolean },
    parentCategory:
      | (Prisma.CategoryGetPayload<{
          select: {
            id: true;
            hasEngine: true;
            formTemplates: {
              where: { isActive: true };
              orderBy: { version: 'desc' };
              take: 1;
              include: {
                fields: {
                  orderBy: { sortOrder: 'asc' };
                  include: { options: { orderBy: { sortOrder: 'asc' } } };
                };
              };
            };
          };
        }> & { formTemplates: CategoryTemplateSource[] })
      | null,
  ) {
    const siblingTemplates: CategoryTemplateSource[] =
      category.parentId && (!parentCategory || parentCategory.formTemplates.length === 0)
        ? await tx.formTemplate.findMany({
            where: {
              isActive: true,
              category: {
                parentId: category.parentId,
                submissionStatus: CategorySubmissionStatus.APPROVED,
              },
            },
            orderBy: [{ version: 'desc' }],
            include: {
              fields: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  options: {
                    orderBy: { sortOrder: 'asc' },
                  },
                },
              },
            },
          })
        : [];

    const siblingTemplate = siblingTemplates.slice().sort((a, b) => {
      const aBlocks = Array.isArray(a.blockIds) ? a.blockIds : [];
      const bBlocks = Array.isArray(b.blockIds) ? b.blockIds : [];
      const aHasEngineBlock = aBlocks.includes('engine_block') ? 1 : 0;
      const bHasEngineBlock = bBlocks.includes('engine_block') ? 1 : 0;
      if (aHasEngineBlock !== bHasEngineBlock)
        return bHasEngineBlock - aHasEngineBlock;
      return (b.fields?.length ?? 0) - (a.fields?.length ?? 0);
    })[0];

    const sourceTemplate =
      parentCategory?.formTemplates?.[0] ?? siblingTemplate ?? null;
    if (!sourceTemplate) return;

    const childTemplate = await tx.formTemplate.create({
      data: {
        categoryId: category.id,
        version: 1,
        isActive: true,
        blockIds: (sourceTemplate.blockIds ?? []) as Prisma.InputJsonValue,
      },
    });

    for (const field of sourceTemplate.fields) {
      const createdField = await tx.formField.create({
        data: {
          templateId: childTemplate.id,
          fieldKey: field.fieldKey,
          label: field.label,
          fieldType: field.fieldType,
          required: field.required,
          sortOrder: field.sortOrder,
          helpText: field.helpText,
          validations: (field.validations ?? {}) as Prisma.InputJsonValue,
          visibilityIf: (field.visibilityIf ?? {}) as Prisma.InputJsonValue,
          requiredIf: (field.requiredIf ?? {}) as Prisma.InputJsonValue,
          config: (field.config ?? {}) as Prisma.InputJsonValue,
          section: field.section,
        },
      });

      if (field.options.length > 0) {
        await tx.fieldOption.createMany({
          data: field.options.map((option) => ({
            fieldId: createdField.id,
            value: option.value,
            label: option.label,
            sortOrder: option.sortOrder,
          })),
        });
      }
    }
  }

  async createCategory(
    params: {
      name: string;
      marketplaceId: string;
      parentId?: string;
    },
    actor: { id: string; role?: string },
  ): Promise<CategoryOptionResult> {
    const normalizedName = params.name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Category name is required');
    }
    if (!/^\d+$/.test(params.marketplaceId)) {
      throw new BadRequestException('marketplaceId must be numeric');
    }

    const marketplaceId = BigInt(params.marketplaceId);
    const parentId =
      params.parentId && /^\d+$/.test(params.parentId)
        ? BigInt(params.parentId)
        : null;

    const existingCategory = await this.prisma.category.findFirst({
      where: {
        marketplaceId,
        parentId,
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        submissionStatus: true,
      },
    });
    if (existingCategory) {
      return {
        value: existingCategory.id.toString(),
        label: existingCategory.name,
        status: existingCategory.submissionStatus,
      };
    }

    const parentCategory = parentId
      ? await this.prisma.category.findUnique({
          where: { id: parentId },
          select: {
            id: true,
            hasEngine: true,
            formTemplates: {
              where: { isActive: true },
              orderBy: { version: 'desc' },
              take: 1,
              include: {
                fields: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    options: {
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        })
      : null;

    if (parentId && !parentCategory) {
      throw new BadRequestException('Parent category not found');
    }

    const baseSlug = this.slugify(normalizedName);
    let slug = baseSlug;
    let attempt = 1;
    while (
      await this.prisma.category.findFirst({
        where: { marketplaceId, slug },
        select: { id: true },
      })
    ) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const submissionStatus = this.isPrivilegedRole(actor.role)
      ? CategorySubmissionStatus.APPROVED
      : CategorySubmissionStatus.PENDING;

    const created = await this.prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          marketplaceId,
          name: normalizedName,
          slug,
          parentId,
          hasEngine: Boolean(parentCategory?.hasEngine),
          submissionStatus,
          suggestedByUserId: actor.id,
          approvedByUserId:
            submissionStatus === CategorySubmissionStatus.APPROVED
              ? actor.id
              : null,
          approvedAt:
            submissionStatus === CategorySubmissionStatus.APPROVED
              ? new Date()
              : null,
        },
      });

      if (submissionStatus === CategorySubmissionStatus.APPROVED) {
        await this.cloneTemplateToCategory(tx, category, parentCategory);
      }

      return category;
    });

    return {
      value: created.id.toString(),
      label: created.name,
      status: created.submissionStatus,
    };
  }

  async createCountry(name: string, iso2?: string): Promise<OptionItem> {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Country name is required');
    }

    const normalizedIso2 = (iso2 || normalizedName.slice(0, 2)).toUpperCase();
    const created = await this.prisma.country.upsert({
      where: { iso2: normalizedIso2 },
      create: { iso2: normalizedIso2, name: normalizedName },
      update: { name: normalizedName },
    });
    return { value: created.id, label: created.name };
  }

  async createCity(name: string, countryId: string): Promise<OptionItem> {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new BadRequestException('City name is required');
    }
    if (!countryId) {
      throw new BadRequestException('countryId is required');
    }

    const existing = await this.prisma.city.findFirst({
      where: { countryId, name: normalizedName },
      select: { id: true, name: true },
    });
    if (existing) {
      return { value: existing.id, label: existing.name };
    }

    const created = await this.prisma.city.create({
      data: { countryId, name: normalizedName },
    });
    return { value: created.id, label: created.name };
  }

  async resolveDbOptions(
    optionsQuery: Record<string, any> | undefined,
    depends: Record<string, any> | undefined,
  ): Promise<OptionItem[]> {
    const queryType = String(optionsQuery?.type ?? '');

    if (queryType === 'brandsByCategory') {
      const categoryId = String(
        depends?.categoryId ??
          depends?.category ??
          optionsQuery?.categoryId ??
          '',
      );
      return this.getBrandOptions(categoryId || undefined);
    }

    if (queryType === 'modelsByBrand') {
      const brandId = String(
        depends?.brandId ?? depends?.brand ?? optionsQuery?.brandId ?? '',
      );
      return this.getModelOptions(brandId || undefined);
    }

    if (queryType === 'distinctAttribute') {
      const attributeKey = String(optionsQuery?.attributeKey ?? '').trim();
      if (!attributeKey) return [];

      const brandId = String(depends?.brandId ?? '').trim();
      const categoryId = String(depends?.categoryId ?? '').trim();

      const brandFilterSql = brandId
        ? Prisma.sql`AND l.brand_id = ${brandId}`
        : Prisma.empty;
      const categoryFilterSql =
        categoryId && /^\d+$/.test(categoryId)
          ? Prisma.sql`AND l.category_id = ${BigInt(categoryId)}`
          : Prisma.empty;

      const rows = await this.prisma.$queryRaw<Array<{ value: string | null }>>(
        Prisma.sql`
          SELECT DISTINCT NULLIF(TRIM(la.data->>${attributeKey}), '') AS value
          FROM listing_attribute la
          INNER JOIN listing l ON l.listing_id = la.listing_id
          WHERE 1=1
          ${brandFilterSql}
          ${categoryFilterSql}
          ORDER BY value ASC
          LIMIT 500
        `,
      );

      return rows
        .map((row) => row.value?.trim())
        .filter((value): value is string => Boolean(value))
        .map((value) => ({ value, label: value }));
    }

    return [];
  }
}
