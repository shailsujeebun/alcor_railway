import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  getBuiltInEngineBlock,
  mapFieldToResponse,
  mergeTemplateFieldsWithBlocks,
  sanitizeFieldPayload,
} from '../templates/template-schema';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }

  async createMarketplace(data: { key: string; name: string }) {
    return this.prisma.marketplace.create({
      data: {
        key: data.key,
        name: data.name,
      },
    });
  }

  async getMarketplaces() {
    return this.prisma.marketplace.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async updateMarketplace(
    id: number,
    data: { name?: string; isActive?: boolean },
  ) {
    return this.prisma.marketplace.update({
      where: { id },
      data,
    });
  }

  async createCategory(data: {
    marketplaceId: number;
    name: string;
    slug: string;
    parentId?: number;
    sortOrder?: number;
    hasEngine?: boolean;
  }) {
    let inheritedHasEngine = false;
    if (data.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentId },
        select: { hasEngine: true },
      });
      inheritedHasEngine = Boolean(parent?.hasEngine);
    }

    return this.prisma.category.create({
      data: {
        marketplaceId: data.marketplaceId,
        name: data.name,
        slug: data.slug,
        parentId: data.parentId,
        sortOrder: data.sortOrder,
        hasEngine:
          data.hasEngine === undefined
            ? inheritedHasEngine
            : Boolean(data.hasEngine),
      },
    });
  }

  async updateCategory(
    id: number,
    data: {
      name?: string;
      slug?: string;
      parentId?: number;
      sortOrder?: number;
      hasEngine?: boolean;
    },
  ) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: number) {
    const categoryId = BigInt(id);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('Category not found');
      }

      const subtreeIds = [categoryId, ...(await this.getDescendantCategoryIds(tx, categoryId))];

      const listingsCount = await tx.listing.count({
        where: {
          categoryId: { in: subtreeIds },
        },
      });

      if (listingsCount > 0) {
        throw new BadRequestException(
          'Cannot delete category because it or its subcategories still contain listings.',
        );
      }

      await tx.formTemplate.deleteMany({
        where: { categoryId: { in: subtreeIds } },
      });

      await tx.brandCategory.deleteMany({
        where: { categoryId: { in: subtreeIds } },
      });

      await tx.model.updateMany({
        where: { categoryId: { in: subtreeIds } },
        data: { categoryId: null },
      });

      await tx.category.deleteMany({
        where: { id: { in: subtreeIds } },
      });

      return { deletedIds: subtreeIds.map((value) => value.toString()) };
    });
  }

  private parseBlockIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map((entry) => String(entry)).filter(Boolean);
  }

  private async ensureSystemEngineBlock(tx: any = this.prisma) {
    const engineBlock = getBuiltInEngineBlock();
    await tx.formBlock.upsert({
      where: { id: engineBlock.id },
      update: {
        name: engineBlock.name,
        isSystem: true,
        fields: engineBlock.fields,
      },
      create: {
        id: engineBlock.id,
        name: engineBlock.name,
        isSystem: true,
        fields: engineBlock.fields,
      },
    });
  }

  private async getTemplateBlocks(template: any, tx: any = this.prisma) {
    const blockIds = this.parseBlockIds(template.blockIds);
    if (blockIds.length === 0) return [];
    const blocks = await tx.formBlock.findMany({
      where: { id: { in: blockIds } },
      orderBy: { name: 'asc' },
    });
    return blocks.map((block: any) => ({
      id: block.id,
      name: block.name,
      isSystem: block.isSystem,
      fields: block.fields ?? [],
    }));
  }

  private async mapTemplate(template: any, tx: any = this.prisma) {
    const blocks = await this.getTemplateBlocks(template, tx);
    const localFields = (template.fields ?? []).map((field: any) =>
      mapFieldToResponse(field),
    );
    const mergedFields = mergeTemplateFieldsWithBlocks(
      template.fields ?? [],
      blocks,
    );

    return {
      id: template.id.toString(),
      categoryId: template.categoryId.toString(),
      version: template.version,
      isActive: template.isActive,
      createdAt: template.createdAt,
      blockIds: this.parseBlockIds(template.blockIds),
      blocks,
      fields: localFields,
      resolvedFields: mergedFields,
    };
  }

  private async createTemplateFields(
    tx: any,
    templateId: bigint,
    fields: any[] = [],
  ) {
    for (const field of fields) {
      const normalized = sanitizeFieldPayload(field, Number(field.order ?? 0));
      const createdField = await tx.formField.create({
        data: {
          templateId,
          fieldKey: normalized.fieldKey,
          label: normalized.label,
          fieldType: normalized.fieldType,
          required: normalized.required,
          sortOrder: normalized.sortOrder,
          validations: normalized.validations,
          visibilityIf: normalized.visibilityIf,
          requiredIf: normalized.requiredIf,
          config: normalized.config,
          section: normalized.section || null,
        },
      });

      if (
        Array.isArray(normalized.staticOptions) &&
        normalized.staticOptions.length > 0
      ) {
        await tx.fieldOption.createMany({
          data: normalized.staticOptions.map((opt: any, index: number) => ({
            fieldId: createdField.id,
            value: opt.value,
            label: opt.label,
            sortOrder: index,
          })),
        });
      }
    }
  }

  private async getDescendantCategoryIds(
    tx: any,
    rootCategoryId: bigint,
  ): Promise<bigint[]> {
    const descendants: bigint[] = [];
    let frontier: bigint[] = [rootCategoryId];

    while (frontier.length > 0) {
      const children = await tx.category.findMany({
        where: {
          parentId: { in: frontier },
        },
        select: { id: true },
      });

      if (children.length === 0) break;
      const childIds = children.map((row: { id: bigint }) => row.id);
      descendants.push(...childIds);
      frontier = childIds;
    }

    return descendants;
  }

  private async getPropagationCategoryIds(
    tx: any,
    rootCategoryId: bigint,
  ): Promise<bigint[]> {
    const rootCategory = await tx.category.findUnique({
      where: { id: rootCategoryId },
      select: { id: true, hasEngine: true },
    });
    if (!rootCategory) return [];

    if (rootCategory.hasEngine) {
      const motorized = await tx.category.findMany({
        where: { hasEngine: true },
        select: { id: true },
      });
      return motorized
        .map((row: { id: bigint }) => row.id)
        .filter((id: bigint) => id !== rootCategoryId);
    }

    return this.getDescendantCategoryIds(tx, rootCategoryId);
  }

  private async propagateTemplateToDescendants(
    tx: any,
    rootCategoryId: bigint,
    fields: any[],
    blockIds: string[],
  ) {
    const targets = await this.getPropagationCategoryIds(tx, rootCategoryId);
    for (const categoryId of targets) {
      const lastTemplate = await tx.formTemplate.findFirst({
        where: { categoryId },
        orderBy: { version: 'desc' },
      });
      const nextVersion = (lastTemplate?.version ?? 0) + 1;

      await tx.formTemplate.updateMany({
        where: { categoryId, isActive: true },
        data: { isActive: false },
      });

      const created = await tx.formTemplate.create({
        data: {
          categoryId,
          version: nextVersion,
          isActive: true,
          blockIds,
        },
      });

      await this.createTemplateFields(tx, created.id, fields);
    }
  }

  async createTemplate(data: {
    categoryId: number;
    name?: string;
    fields: any[];
    blockIds?: string[];
  }) {
    if (!Number.isInteger(data.categoryId)) {
      throw new BadRequestException('categoryId must be an integer');
    }

    const categoryId = BigInt(data.categoryId);

    return this.prisma.$transaction(async (tx) => {
      await this.ensureSystemEngineBlock(tx);
      const lastTemplate = await tx.formTemplate.findFirst({
        where: { categoryId },
        orderBy: { version: 'desc' },
      });
      const nextVersion = (lastTemplate?.version ?? 0) + 1;

      await tx.formTemplate.updateMany({
        where: { categoryId, isActive: true },
        data: { isActive: false },
      });

      const created = await tx.formTemplate.create({
        data: {
          categoryId,
          version: nextVersion,
          isActive: true,
          blockIds: data.blockIds ?? [],
        },
      });

      await this.createTemplateFields(tx, created.id, data.fields);
      await this.propagateTemplateToDescendants(
        tx,
        categoryId,
        data.fields,
        data.blockIds ?? [],
      );

      const template = await tx.formTemplate.findUnique({
        where: { id: created.id },
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
      });

      if (!template) throw new NotFoundException('Template not found');
      return this.mapTemplate(template, tx);
    });
  }

  async getTemplate(id: number) {
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: BigInt(id) },
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
    });

    if (!template) throw new NotFoundException('Template not found');
    return this.mapTemplate(template);
  }

  async getTemplates() {
    const templates = await this.prisma.formTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            hasEngine: true,
            marketplace: { select: { name: true } },
          },
        },
        fields: { select: { id: true } },
      },
    });

    return templates.map((template) => ({
      ...template,
      id: template.id.toString(),
      categoryId: template.categoryId.toString(),
      blockIds: this.parseBlockIds(template.blockIds),
      category: template.category
        ? {
          ...template.category,
          id: template.category.id.toString(),
        }
        : undefined,
      fields: template.fields.map((field) => ({
        id: field.id.toString(),
      })),
    }));
  }

  async deleteTemplate(id: number) {
    return this.prisma.formTemplate.delete({
      where: { id: BigInt(id) },
    });
  }

  async toggleTemplateStatus(id: number, isActive: boolean) {
    if (typeof isActive !== 'boolean') {
      throw new BadRequestException('isActive must be a boolean');
    }

    const templateId = BigInt(id);
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException('Template not found');

    return this.prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.formTemplate.updateMany({
          where: {
            categoryId: template.categoryId,
            isActive: true,
            id: { not: templateId },
          },
          data: { isActive: false },
        });
      }

      const updated = await tx.formTemplate.update({
        where: { id: templateId },
        data: { isActive },
      });

      return {
        ...updated,
        id: updated.id.toString(),
        categoryId: updated.categoryId.toString(),
      };
    });
  }

  async updateTemplate(
    id: number,
    data: { fields: any[]; blockIds?: string[] },
  ) {
    const templateId = BigInt(id);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.formTemplate.findUnique({
        where: { id: templateId },
      });
      if (!existing) throw new NotFoundException('Template not found');

      await tx.formField.deleteMany({
        where: { templateId },
      });

      await this.createTemplateFields(tx, templateId, data.fields);

      if (Array.isArray((data as any).blockIds)) {
        await tx.formTemplate.update({
          where: { id: templateId },
          data: { blockIds: (data as any).blockIds },
        });
      }

      await this.propagateTemplateToDescendants(
        tx,
        existing.categoryId,
        data.fields,
        Array.isArray((data as any).blockIds)
          ? (data as any).blockIds
          : this.parseBlockIds(existing.blockIds),
      );

      const template = await tx.formTemplate.findUnique({
        where: { id: templateId },
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
      });

      if (!template) throw new NotFoundException('Template not found');
      return this.mapTemplate(template, tx);
    });
  }

  async getBlocks() {
    await this.ensureSystemEngineBlock();
    const blocks = await this.prisma.formBlock.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
    return blocks.map((block) => ({
      id: block.id,
      name: block.name,
      isSystem: block.isSystem,
      fields: block.fields ?? [],
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    }));
  }

  async createBlock(data: { name: string; fields: any[]; isSystem?: boolean }) {
    if (!data.name?.trim()) {
      throw new BadRequestException('Block name is required');
    }
    const created = await this.prisma.formBlock.create({
      data: {
        id: globalThis.crypto.randomUUID(),
        name: data.name.trim(),
        fields: (data.fields ?? []) as any,
        isSystem: Boolean(data.isSystem),
      },
    });
    return {
      id: created.id,
      name: created.name,
      isSystem: created.isSystem,
      fields: created.fields ?? [],
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updateBlock(id: string, data: { name?: string; fields?: any[] }) {
    const existing = await this.prisma.formBlock.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Block not found');
    if (existing.isSystem) {
      throw new BadRequestException('System blocks cannot be edited');
    }

    const updated = await this.prisma.formBlock.update({
      where: { id },
      data: {
        name: data.name?.trim() || existing.name,
        fields: (data.fields ?? (existing.fields as any[])) as any,
      },
    });
    return {
      id: updated.id,
      name: updated.name,
      isSystem: updated.isSystem,
      fields: updated.fields ?? [],
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteBlock(id: string) {
    const existing = await this.prisma.formBlock.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Block not found');
    if (existing.isSystem) {
      throw new BadRequestException('System blocks cannot be deleted');
    }

    const templates = await this.prisma.formTemplate.findMany({
      select: { id: true, blockIds: true },
    });
    const templatesWithBlock = templates.filter((template) =>
      this.parseBlockIds(template.blockIds).includes(id),
    );

    await this.prisma.$transaction(async (tx) => {
      for (const template of templatesWithBlock) {
        const nextBlockIds = this.parseBlockIds(template.blockIds).filter(
          (blockId) => blockId !== id,
        );
        await tx.formTemplate.update({
          where: { id: template.id },
          data: { blockIds: nextBlockIds },
        });
      }
      await tx.formBlock.delete({ where: { id } });
    });

    return { ok: true };
  }

  async getStats() {
    const [usersCount, listingsCount, companiesCount, activeTicketsCount] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.listing.count(),
        this.prisma.company.count(),
        this.prisma.supportTicket.count({
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        }),
      ]);

    return { usersCount, listingsCount, companiesCount, activeTicketsCount };
  }
}
