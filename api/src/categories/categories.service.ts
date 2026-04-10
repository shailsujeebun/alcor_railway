import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  mergeTemplateFieldsWithBlocks,
  getBuiltInEngineBlock,
} from '../templates/template-schema';

const AGRO_SHARED_COMBINE_FORM_SLUGS = new Set([
  'combines',
  'grain-harvesters',
  'forage-harvesters',
  'beet-harvesters',
  'combine-headers',
  'grain-headers',
  'corn-headers',
  'sunflower-headers',
]);

const AGRO_SHARED_COMBINE_TEMPLATE_PREFERRED_SLUGS = new Set([
  'combines',
  'grain-harvesters',
  'forage-harvesters',
  'beet-harvesters',
]);

export interface CategoryTreeNode {
  id: string;
  marketplaceId: string;
  slug: string;
  name: string;
  parentId: string | null;
  hasEngine: boolean;
  children: CategoryTreeNode[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly templateWithFieldsInclude = {
    fields: {
      orderBy: { sortOrder: 'asc' as const },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' as const },
        },
      },
    },
  };

  create(dto: CreateCategoryDto) {
    const parentId = dto.parentId ? BigInt(dto.parentId) : undefined;
    const { parentId: _, ...rest } = dto;
    return this.prisma.category.create({
      data: {
        ...rest,
        parentId,
      } as any,
      include: { parent: true },
    });
  }

  async findMarketplaces() {
    const marketplaces = await this.prisma.marketplace.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return marketplaces.map((m) => ({
      id: m.id.toString(),
      key: m.key,
      name: m.name,
      isActive: m.isActive,
    }));
  }

  async findTree(marketplaceId?: string): Promise<CategoryTreeNode[]> {
    const where: any = {};
    if (marketplaceId) {
      where.marketplaceId = BigInt(marketplaceId);
    }

    const all = await this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const map = new Map<string | null, typeof all>();
    for (const cat of all) {
      const parentId = cat.parentId ? cat.parentId.toString() : null;
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId)!.push(cat);
    }

    const buildTree = (parentId: string | null): CategoryTreeNode[] => {
      return (map.get(parentId) ?? []).map((cat) => ({
        id: cat.id.toString(),
        marketplaceId: cat.marketplaceId.toString(),
        slug: cat.slug,
        name: cat.name,
        parentId: cat.parentId ? cat.parentId.toString() : null,
        hasEngine: Boolean(cat.hasEngine),
        children: buildTree(cat.id.toString()),
      }));
    };

    return buildTree(null);
  }

  private parseBlockIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map((entry) => String(entry)).filter(Boolean);
  }

  private scoreMotorizedTemplate(
    template: any,
    requestedCategory: {
      id: bigint;
      marketplaceId: bigint;
      parentId: bigint | null;
    },
  ) {
    const blockIds = this.parseBlockIds(template.blockIds);
    let score = 0;

    if (template.category.marketplaceId === requestedCategory.marketplaceId) {
      score += 1000;
    }
    if (
      requestedCategory.parentId &&
      template.category.parentId === requestedCategory.parentId
    ) {
      score += 250;
    }
    if (blockIds.includes('engine_block')) {
      score += 500;
    }
    score += Math.min(template.fields?.length ?? 0, 200);
    score += template.version ?? 0;

    return score;
  }

  private async findMotorizedFallbackTemplate(category: any) {
    if (!category.hasEngine) return null;

    const candidates = await this.prisma.formTemplate.findMany({
      where: {
        isActive: true,
        category: { hasEngine: true },
      },
      include: {
        ...this.templateWithFieldsInclude,
        category: {
          select: {
            id: true,
            slug: true,
            hasEngine: true,
            marketplaceId: true,
            parentId: true,
          },
        },
      },
    });

    const best = candidates
      .filter((template) => template.categoryId !== category.id)
      .sort(
        (a, b) =>
          this.scoreMotorizedTemplate(b, category) -
          this.scoreMotorizedTemplate(a, category),
      )[0];

    if (!best) return null;

    return this.mapTemplate(best, best.category, category);
  }

  private async findSharedAgroCombineTemplate(category: any) {
    if (!AGRO_SHARED_COMBINE_FORM_SLUGS.has(String(category.slug ?? '').toLowerCase())) {
      return null;
    }

    const candidates = await this.prisma.formTemplate.findMany({
      where: {
        isActive: true,
        category: {
          marketplaceId: category.marketplaceId,
          slug: { in: Array.from(AGRO_SHARED_COMBINE_FORM_SLUGS) },
        },
      },
      include: {
        ...this.templateWithFieldsInclude,
        category: {
          select: {
            id: true,
            slug: true,
            hasEngine: true,
            marketplaceId: true,
            parentId: true,
          },
        },
      },
    });

    const best = candidates.sort((a, b) => {
      const aPreferred = AGRO_SHARED_COMBINE_TEMPLATE_PREFERRED_SLUGS.has(
        String(a.category?.slug ?? '').toLowerCase(),
      )
        ? 1
        : 0;
      const bPreferred = AGRO_SHARED_COMBINE_TEMPLATE_PREFERRED_SLUGS.has(
        String(b.category?.slug ?? '').toLowerCase(),
      )
        ? 1
        : 0;

      if (aPreferred !== bPreferred) return bPreferred - aPreferred;
      if ((a.fields?.length ?? 0) !== (b.fields?.length ?? 0)) {
        return (b.fields?.length ?? 0) - (a.fields?.length ?? 0);
      }
      return (b.version ?? 0) - (a.version ?? 0);
    })[0];

    if (!best) return null;

    return this.mapTemplate(best, best.category, category);
  }

  private async mapTemplate(
    template: any,
    category: any,
    requestedCategory?: any,
  ) {
    const runtimeCategory = requestedCategory ?? category;
    const blockIds = this.parseBlockIds(template.blockIds);

    // For engine categories, always include engine_block even if not yet
    // stored on the template — this ensures the posting form always shows
    // the full set of engine-specific fields (Fuel type, Power, etc.).
    const hasExplicitTemplateFields = (template.fields?.length ?? 0) > 0;
    const effectiveBlockIds =
      runtimeCategory.hasEngine &&
      !hasExplicitTemplateFields &&
      !blockIds.includes('engine_block')
        ? ['engine_block', ...blockIds]
        : blockIds;

    const dbBlocks =
      effectiveBlockIds.length === 0
        ? []
        : await this.prisma.formBlock.findMany({
            where: { id: { in: effectiveBlockIds } },
            orderBy: { name: 'asc' },
          });

    const mappedDbBlocks = dbBlocks
      .filter(
        (block: any) =>
          !(effectiveBlockIds.includes('engine_block') && block.id === 'engine_block'),
      )
      .map((block: any) => ({
        id: block.id,
        name: block.name,
        isSystem: block.isSystem,
        fields: (block.fields as any[]) ?? [],
      }));

    // Always use the built-in engine block for runtime category forms so
    // schema updates are applied immediately without waiting for DB reseed.
    const blocks = effectiveBlockIds.includes('engine_block')
      ? [...mappedDbBlocks, getBuiltInEngineBlock()]
      : mappedDbBlocks;

    const mergedFields = mergeTemplateFieldsWithBlocks(
      template.fields ?? [],
      blocks,
    );

    return {
      id: template.id.toString(),
      categoryId: runtimeCategory.id.toString(),
      version: template.version,
      isActive: template.isActive,
      createdAt: template.createdAt,
      blockIds: effectiveBlockIds,
      blocks: blocks.map((block) => ({
        id: block.id,
        name: block.name,
        isSystem: Boolean(block.isSystem),
      })),
      category: {
        id: runtimeCategory.id.toString(),
        slug: runtimeCategory.slug,
        hasEngine: Boolean(runtimeCategory.hasEngine),
      },
      fields: mergedFields,
    };
  }

  async findTemplate(slug: string) {
    let whereCondition: any = { slug };

    if (/^\d+$/.test(slug)) {
      whereCondition = {
        OR: [{ id: BigInt(slug) }, { slug }],
      };
    }

    const category = await this.prisma.category.findFirst({
      where: whereCondition,
      include: {
        formTemplates: {
          where: { isActive: true },
          orderBy: { version: 'desc' },
          take: 1,
          include: this.templateWithFieldsInclude,
        },
      },
    });

    if (!category) {
      return null;
    }

    const sharedAgroCombineTemplate = await this.findSharedAgroCombineTemplate(
      category,
    );
    if (sharedAgroCombineTemplate) {
      return sharedAgroCombineTemplate;
    }

    // Check nearest active ancestor template.
    let nearestAncestorWithTemplate: { template: any; category: any } | null =
      null;
    let parentId = category.parentId;
    while (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
        include: {
          formTemplates: {
            where: { isActive: true },
            orderBy: { version: 'desc' },
            take: 1,
            include: this.templateWithFieldsInclude,
          },
        },
      });

      if (!parent) break;
      if (parent.formTemplates.length > 0) {
        nearestAncestorWithTemplate = {
          template: parent.formTemplates[0],
          category: parent,
        };
        break;
      }
      parentId = parent.parentId;
    }

    const directTemplate = category.formTemplates[0] ?? null;

    // Always prefer the category's own active template.
    // propagateTemplateToDescendants (in admin.service) keeps it in sync
    // with the parent whenever the admin saves, so there is no need to
    // compare timestamps or fall back to the ancestor when a direct
    // template exists.
    if (directTemplate) {
      return this.mapTemplate(directTemplate, category);
    }

    if (nearestAncestorWithTemplate) {
      return this.mapTemplate(
        nearestAncestorWithTemplate.template,
        nearestAncestorWithTemplate.category,
        category,
      );
    }

    // Fallback: use a sibling template when parent/ancestor do not have one.
    if (category.parentId) {
      const siblingTemplates = await this.prisma.formTemplate.findMany({
        where: {
          isActive: true,
          category: {
            parentId: category.parentId,
          },
        },
        orderBy: [{ version: 'desc' }],
        include: {
          fields: this.templateWithFieldsInclude.fields,
        },
      });

      const siblingTemplate = siblingTemplates
        .slice()
        .sort((a: any, b: any) => {
          const aBlocks = Array.isArray(a.blockIds) ? a.blockIds : [];
          const bBlocks = Array.isArray(b.blockIds) ? b.blockIds : [];
          const aHasEngineBlock = aBlocks.includes('engine_block') ? 1 : 0;
          const bHasEngineBlock = bBlocks.includes('engine_block') ? 1 : 0;
          if (aHasEngineBlock !== bHasEngineBlock) {
            return bHasEngineBlock - aHasEngineBlock;
          }
          return (b.fields?.length ?? 0) - (a.fields?.length ?? 0);
        })[0];

      if (siblingTemplate) {
        const siblingCategory = await this.prisma.category.findUnique({
          where: { id: siblingTemplate.categoryId },
          select: { id: true, slug: true, hasEngine: true },
        });
        if (siblingCategory) {
          return this.mapTemplate(siblingTemplate, siblingCategory, category);
        }
      }
    }

    // Last fallback for motorized categories when no explicit/ancestor/sibling
    // template exists.
    const motorizedTemplate =
      await this.findMotorizedFallbackTemplate(category);
    if (motorizedTemplate) {
      return motorizedTemplate;
    }

    return null;
  }
}
