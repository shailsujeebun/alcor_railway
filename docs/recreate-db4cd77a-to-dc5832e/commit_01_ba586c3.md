# Commit 1: ba586c3

## Metadata
```text
commit ba586c323686998ed9b5fdfb736ef18845fc4d64
Author:     Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
AuthorDate: Mon Feb 23 15:21:19 2026 +0100
Commit:     Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
CommitDate: Mon Feb 23 15:21:19 2026 +0100

    fix: sync post-ad form with admin template builder
    
    - Add propagateTemplateToDescendants + getPropagationCategoryIds in
      admin.service: when admin saves a template for an engine category,
      all other hasEngine categories receive the same template update
      automatically; for non-engine categories, all descendants are synced.
    - Fix findTemplate in categories.service: remove fragile createdAt
      timestamp comparison that could return a stale direct template over
      a newer ancestor. Now the category's own active template is always
      preferred (propagation keeps it current); ancestor/sibling/motorized
      fallback only applies when no direct template exists.
    - Set useCategoryTemplate staleTime:0, refetchOnMount:'always' so the
      post-ad form always fetches the latest template without stale cache.
    - Add has_engine column to category table and block_ids JSONB column
      to form_template table via Prisma migrations.
    - Update seeds with hasEngine flags and engine-category templates.
    - Add admin categories management UI page.
    - Add getCategoryTemplateByCategory and getTemplateBlocks API helpers.
    - Add categories.service.spec.ts unit tests for template resolution.
    
    Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## File Changes
```text
ba586c3 fix: sync post-ad form with admin template builder
 .../migration.sql                                  |  18 +++
 .../migration.sql                                  |   2 +
 api/prisma/seed-all/core.ts                        |  37 +++++
 api/prisma/seed.ts                                 |  56 ++++++++
 api/src/admin/admin.service.ts                     |  94 +++++++++++++
 api/src/categories/categories.service.spec.ts      | 154 +++++++++++++++++++++
 api/src/categories/categories.service.ts           | 146 ++++++++++++++-----
 web/src/app/admin/categories/page.tsx              |  40 +++++-
 web/src/lib/api.ts                                 |   3 +
 web/src/lib/queries.ts                             |   4 +-
 10 files changed, 515 insertions(+), 39 deletions(-)
```

## Full Patch
```diff
commit ba586c323686998ed9b5fdfb736ef18845fc4d64
Author: Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
Date:   Mon Feb 23 15:21:19 2026 +0100

    fix: sync post-ad form with admin template builder
    
    - Add propagateTemplateToDescendants + getPropagationCategoryIds in
      admin.service: when admin saves a template for an engine category,
      all other hasEngine categories receive the same template update
      automatically; for non-engine categories, all descendants are synced.
    - Fix findTemplate in categories.service: remove fragile createdAt
      timestamp comparison that could return a stale direct template over
      a newer ancestor. Now the category's own active template is always
      preferred (propagation keeps it current); ancestor/sibling/motorized
      fallback only applies when no direct template exists.
    - Set useCategoryTemplate staleTime:0, refetchOnMount:'always' so the
      post-ad form always fetches the latest template without stale cache.
    - Add has_engine column to category table and block_ids JSONB column
      to form_template table via Prisma migrations.
    - Update seeds with hasEngine flags and engine-category templates.
    - Add admin categories management UI page.
    - Add getCategoryTemplateByCategory and getTemplateBlocks API helpers.
    - Add categories.service.spec.ts unit tests for template resolution.
    
    Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

diff --git a/api/prisma/migrations/20260223143000_backfill_motorized_categories/migration.sql b/api/prisma/migrations/20260223143000_backfill_motorized_categories/migration.sql
new file mode 100644
index 0000000..0a47553
--- /dev/null
+++ b/api/prisma/migrations/20260223143000_backfill_motorized_categories/migration.sql
@@ -0,0 +1,18 @@
+ALTER TABLE category
+ADD COLUMN IF NOT EXISTS has_engine BOOLEAN NOT NULL DEFAULT FALSE;
+
+WITH RECURSIVE motorized_categories AS (
+  SELECT c.category_id
+  FROM category c
+  WHERE
+    c.slug ~* '(tractor|traktor|combine|kombain|harvest|excavator|ekskavator|loader|navantazhuvach|forklift|telehandler|truck|vantazh|tyahach|bus|avtobus|car|auto|sedan|suv|hatchback|coupe|convertible|pickup|minivan|electric|hybrid)'
+    OR lower(c.name) ~ '(tractor|traktor|combine|kombain|harvest|excavator|ekskavator|loader|forklift|telehandler|truck|bus|car|sedan|suv|hatchback|coupe|convertible|pickup|minivan|electric|hybrid|трактор|комбайн|екскаватор|навантажувач|тягач|вантаж|автобус|легков|авто)'
+  UNION
+  SELECT child.category_id
+  FROM category child
+  INNER JOIN motorized_categories parent
+    ON child.parent_id = parent.category_id
+)
+UPDATE category c
+SET has_engine = TRUE
+WHERE c.category_id IN (SELECT category_id FROM motorized_categories);
diff --git a/api/prisma/migrations/20260223150000_add_form_template_block_ids/migration.sql b/api/prisma/migrations/20260223150000_add_form_template_block_ids/migration.sql
new file mode 100644
index 0000000..00cf101
--- /dev/null
+++ b/api/prisma/migrations/20260223150000_add_form_template_block_ids/migration.sql
@@ -0,0 +1,2 @@
+ALTER TABLE form_template
+ADD COLUMN IF NOT EXISTS block_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
diff --git a/api/prisma/seed-all/core.ts b/api/prisma/seed-all/core.ts
index 9a3d63c..42729b6 100644
--- a/api/prisma/seed-all/core.ts
+++ b/api/prisma/seed-all/core.ts
@@ -10,6 +10,38 @@ export type CoreSeedData = {
 };
 
 export async function seedCore(prisma: PrismaClient): Promise<CoreSeedData> {
+  const isLikelyMotorizedSlug = (slug: string) => {
+    const value = slug.toLowerCase();
+    const excludedTokens = ['trailer', 'semi-trailer', 'parts', 'tires', 'wheels', 'service'];
+    if (excludedTokens.some((token) => value.includes(token))) {
+      return false;
+    }
+
+    const motorizedTokens = [
+      'tractor',
+      'harvester',
+      'combine',
+      'excavator',
+      'loader',
+      'forklift',
+      'telehandler',
+      'truck',
+      'bus',
+      'car',
+      'sedan',
+      'suv',
+      'hatchback',
+      'coupe',
+      'convertible',
+      'pickup',
+      'minivan',
+      'electric',
+      'hybrid',
+    ];
+
+    return motorizedTokens.some((token) => value.includes(token));
+  };
+
   const passwordHash = await bcrypt.hash('test1234', 10);
 
   const admin = await prisma.user.create({
@@ -166,6 +198,7 @@ export async function seedCore(prisma: PrismaClient): Promise<CoreSeedData> {
     name: string;
     parentSlug?: string;
     sortOrder: number;
+    hasEngine?: boolean;
   }) {
     const marketplaceId = marketplaceMap.get(params.marketplaceKey);
     if (!marketplaceId) {
@@ -180,6 +213,10 @@ export async function seedCore(prisma: PrismaClient): Promise<CoreSeedData> {
         name: params.name,
         parentId: parent?.id,
         sortOrder: params.sortOrder,
+        hasEngine:
+          params.hasEngine === undefined
+            ? isLikelyMotorizedSlug(params.slug)
+            : params.hasEngine,
       },
     });
 
diff --git a/api/prisma/seed.ts b/api/prisma/seed.ts
index 29d3067..087879b 100644
--- a/api/prisma/seed.ts
+++ b/api/prisma/seed.ts
@@ -48,6 +48,44 @@ function makeUniqueSlug(base: string, used: Set<string>, parentSlug?: string): s
   return `${slug}-${i}`;
 }
 
+function isLikelyMotorizedSlug(slug: string): boolean {
+  const value = slug.toLowerCase();
+  const excludedTokens = ['trailer', 'semi-trailer', 'parts', 'tires', 'wheels', 'service'];
+  if (excludedTokens.some((token) => value.includes(token))) return false;
+
+  const motorizedTokens = [
+    'tractor',
+    'traktor',
+    'combine',
+    'kombain',
+    'harvester',
+    'excavator',
+    'ekskavator',
+    'loader',
+    'navantazhuvach',
+    'forklift',
+    'telehandler',
+    'truck',
+    'vantazh',
+    'tyahach',
+    'bus',
+    'avtobus',
+    'car',
+    'sedan',
+    'suv',
+    'hatchback',
+    'coupe',
+    'convertible',
+    'pickup',
+    'minivan',
+    'electric',
+    'hybrid',
+    'avto',
+  ];
+
+  return motorizedTokens.some((token) => value.includes(token));
+}
+
 async function main() {
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   const adapter = new PrismaPg(pool);
@@ -606,6 +644,24 @@ async function main() {
   await insertTree(agrolineTree, 'agroline');
   await insertTree(autolineTree, 'autoline');
 
+  // Backfill motorized categories so all engine-powered categories can
+  // inherit motorized template behavior at runtime.
+  const motorizedIds = Object.entries(catMap)
+    .filter(([slug]) => isLikelyMotorizedSlug(slug))
+    .map(([, id]) => id);
+  if (motorizedIds.length > 0) {
+    await prisma.category.updateMany({
+      where: {
+        id: {
+          in: motorizedIds,
+        },
+      },
+      data: {
+        hasEngine: true,
+      },
+    });
+  }
+
   // ─── Form Templates ─────────────────────────────
   console.log('Seeding form templates...');
 
diff --git a/api/src/admin/admin.service.ts b/api/src/admin/admin.service.ts
index 6c52a97..98da51b 100644
--- a/api/src/admin/admin.service.ts
+++ b/api/src/admin/admin.service.ts
@@ -191,6 +191,85 @@ export class AdminService {
     }
   }
 
+  private async getDescendantCategoryIds(
+    tx: any,
+    rootCategoryId: bigint,
+  ): Promise<bigint[]> {
+    const descendants: bigint[] = [];
+    let frontier: bigint[] = [rootCategoryId];
+
+    while (frontier.length > 0) {
+      const children = await tx.category.findMany({
+        where: {
+          parentId: { in: frontier },
+        },
+        select: { id: true },
+      });
+
+      if (children.length === 0) break;
+      const childIds = children.map((row: { id: bigint }) => row.id);
+      descendants.push(...childIds);
+      frontier = childIds;
+    }
+
+    return descendants;
+  }
+
+  private async getPropagationCategoryIds(
+    tx: any,
+    rootCategoryId: bigint,
+  ): Promise<bigint[]> {
+    const rootCategory = await tx.category.findUnique({
+      where: { id: rootCategoryId },
+      select: { id: true, hasEngine: true },
+    });
+    if (!rootCategory) return [];
+
+    if (rootCategory.hasEngine) {
+      const motorized = await tx.category.findMany({
+        where: { hasEngine: true },
+        select: { id: true },
+      });
+      return motorized
+        .map((row: { id: bigint }) => row.id)
+        .filter((id: bigint) => id !== rootCategoryId);
+    }
+
+    return this.getDescendantCategoryIds(tx, rootCategoryId);
+  }
+
+  private async propagateTemplateToDescendants(
+    tx: any,
+    rootCategoryId: bigint,
+    fields: any[],
+    blockIds: string[],
+  ) {
+    const targets = await this.getPropagationCategoryIds(tx, rootCategoryId);
+    for (const categoryId of targets) {
+      const lastTemplate = await tx.formTemplate.findFirst({
+        where: { categoryId },
+        orderBy: { version: 'desc' },
+      });
+      const nextVersion = (lastTemplate?.version ?? 0) + 1;
+
+      await tx.formTemplate.updateMany({
+        where: { categoryId, isActive: true },
+        data: { isActive: false },
+      });
+
+      const created = await tx.formTemplate.create({
+        data: {
+          categoryId,
+          version: nextVersion,
+          isActive: true,
+          blockIds,
+        },
+      });
+
+      await this.createTemplateFields(tx, created.id, fields);
+    }
+  }
+
   async createTemplate(data: {
     categoryId: number;
     name?: string;
@@ -226,6 +305,12 @@ export class AdminService {
       });
 
       await this.createTemplateFields(tx, created.id, data.fields);
+      await this.propagateTemplateToDescendants(
+        tx,
+        categoryId,
+        data.fields,
+        data.blockIds ?? [],
+      );
 
       const template = await tx.formTemplate.findUnique({
         where: { id: created.id },
@@ -363,6 +448,15 @@ export class AdminService {
         });
       }
 
+      await this.propagateTemplateToDescendants(
+        tx,
+        existing.categoryId,
+        data.fields,
+        Array.isArray((data as any).blockIds)
+          ? (data as any).blockIds
+          : this.parseBlockIds(existing.blockIds),
+      );
+
       const template = await tx.formTemplate.findUnique({
         where: { id: templateId },
         include: {
diff --git a/api/src/categories/categories.service.spec.ts b/api/src/categories/categories.service.spec.ts
new file mode 100644
index 0000000..c72b606
--- /dev/null
+++ b/api/src/categories/categories.service.spec.ts
@@ -0,0 +1,154 @@
+import { CategoriesService } from './categories.service';
+
+describe('CategoriesService.findTemplate', () => {
+  const buildPrismaMock = () => ({
+    category: {
+      findFirst: jest.fn(),
+      findUnique: jest.fn(),
+    },
+    formTemplate: {
+      findMany: jest.fn(),
+    },
+    formBlock: {
+      findMany: jest.fn(),
+    },
+  });
+
+  it('returns explicit category template before motorized fallback', async () => {
+    const prisma = buildPrismaMock();
+    const service = new CategoriesService(prisma as any);
+    prisma.formBlock.findMany.mockResolvedValue([]);
+
+    prisma.category.findFirst.mockResolvedValue({
+      id: 1n,
+      slug: 'wheel-tractors',
+      hasEngine: true,
+      marketplaceId: 10n,
+      parentId: null,
+      formTemplates: [
+        {
+          id: 11n,
+          categoryId: 1n,
+          version: 1,
+          isActive: true,
+          createdAt: new Date('2026-02-23T00:00:00Z'),
+          blockIds: [],
+          fields: [
+            {
+              id: 101n,
+              fieldKey: 'year',
+              label: 'Year',
+              fieldType: 'NUMBER',
+              required: true,
+              sortOrder: 1,
+              validations: {},
+              visibilityIf: {},
+              requiredIf: {},
+              config: { component: 'number' },
+              options: [],
+            },
+          ],
+        },
+      ],
+    });
+
+    const result = await service.findTemplate('wheel-tractors');
+
+    expect(result).toBeTruthy();
+    expect(result?.id).toBe('11');
+    expect(prisma.formTemplate.findMany).not.toHaveBeenCalled();
+  });
+
+  it('uses motorized fallback template for hasEngine category without explicit template', async () => {
+    const prisma = buildPrismaMock();
+    const service = new CategoriesService(prisma as any);
+    prisma.formBlock.findMany.mockResolvedValue([]);
+
+    prisma.category.findFirst.mockResolvedValue({
+      id: 2n,
+      slug: 'mini-excavators',
+      hasEngine: true,
+      marketplaceId: 20n,
+      parentId: 200n,
+      formTemplates: [],
+    });
+
+    prisma.formTemplate.findMany.mockResolvedValue([
+      {
+        id: 31n,
+        categoryId: 3n,
+        version: 1,
+        isActive: true,
+        createdAt: new Date('2026-02-22T00:00:00Z'),
+        blockIds: [],
+        fields: [],
+        category: {
+          id: 3n,
+          slug: 'legacy-template-source',
+          hasEngine: true,
+          marketplaceId: 21n,
+          parentId: null,
+        },
+      },
+      {
+        id: 41n,
+        categoryId: 4n,
+        version: 3,
+        isActive: true,
+        createdAt: new Date('2026-02-23T00:00:00Z'),
+        blockIds: ['engine_block'],
+        fields: [
+          {
+            id: 401n,
+            fieldKey: 'fuel_type',
+            label: 'Fuel type',
+            fieldType: 'SELECT',
+            required: false,
+            sortOrder: 1,
+            validations: {},
+            visibilityIf: {},
+            requiredIf: {},
+            config: { component: 'select', dataSource: 'static' },
+            options: [{ id: 1n, value: 'diesel', label: 'Diesel', sortOrder: 1 }],
+          },
+        ],
+        category: {
+          id: 4n,
+          slug: 'tracked-excavators',
+          hasEngine: true,
+          marketplaceId: 20n,
+          parentId: 200n,
+        },
+      },
+    ]);
+
+    const result = await service.findTemplate('mini-excavators');
+
+    expect(result).toBeTruthy();
+    expect(result?.id).toBe('41');
+    expect(result?.categoryId).toBe('2');
+    expect(result?.category?.id).toBe('2');
+    expect(result?.category?.hasEngine).toBe(true);
+    expect(prisma.category.findUnique).toHaveBeenCalled();
+  });
+
+  it('keeps existing fallback behavior for non-motorized category', async () => {
+    const prisma = buildPrismaMock();
+    const service = new CategoriesService(prisma as any);
+    prisma.formBlock.findMany.mockResolvedValue([]);
+
+    prisma.category.findFirst.mockResolvedValue({
+      id: 5n,
+      slug: 'trailers',
+      hasEngine: false,
+      marketplaceId: 30n,
+      parentId: null,
+      formTemplates: [],
+    });
+
+    const result = await service.findTemplate('trailers');
+
+    expect(result).toBeNull();
+    expect(prisma.formTemplate.findMany).not.toHaveBeenCalled();
+  });
+});
diff --git a/api/src/categories/categories.service.ts b/api/src/categories/categories.service.ts
index 201e142..2ea737a 100644
--- a/api/src/categories/categories.service.ts
+++ b/api/src/categories/categories.service.ts
@@ -17,6 +17,17 @@ export interface CategoryTreeNode {
 export class CategoriesService {
   constructor(private readonly prisma: PrismaService) {}
 
+  private readonly templateWithFieldsInclude = {
+    fields: {
+      orderBy: { sortOrder: 'asc' as const },
+      include: {
+        options: {
+          orderBy: { sortOrder: 'asc' as const },
+        },
+      },
+    },
+  };
+
   create(dto: CreateCategoryDto) {
     const parentId = dto.parentId ? BigInt(dto.parentId) : undefined;
     const { parentId: _, ...rest } = dto;
@@ -80,6 +91,70 @@ export class CategoriesService {
     return value.map((entry) => String(entry)).filter(Boolean);
   }
 
+  private scoreMotorizedTemplate(
+    template: any,
+    requestedCategory: {
+      id: bigint;
+      marketplaceId: bigint;
+      parentId: bigint | null;
+    },
+  ) {
+    const blockIds = this.parseBlockIds(template.blockIds);
+    let score = 0;
+
+    if (template.category.marketplaceId === requestedCategory.marketplaceId) {
+      score += 1000;
+    }
+    if (
+      requestedCategory.parentId &&
+      template.category.parentId === requestedCategory.parentId
+    ) {
+      score += 250;
+    }
+    if (blockIds.includes('engine_block')) {
+      score += 500;
+    }
+    score += Math.min(template.fields?.length ?? 0, 200);
+    score += template.version ?? 0;
+
+    return score;
+  }
+
+  private async findMotorizedFallbackTemplate(category: any) {
+    if (!category.hasEngine) return null;
+
+    const candidates = await this.prisma.formTemplate.findMany({
+      where: {
+        isActive: true,
+        category: { hasEngine: true },
+      },
+      include: {
+        ...this.templateWithFieldsInclude,
+        category: {
+          select: {
+            id: true,
+            slug: true,
+            hasEngine: true,
+            marketplaceId: true,
+            parentId: true,
+          },
+        },
+      },
+    });
+
+    const best = candidates
+      .filter((template) => template.categoryId !== category.id)
+      .sort(
+        (a, b) =>
+          this.scoreMotorizedTemplate(b, category) -
+          this.scoreMotorizedTemplate(a, category),
+      )[0];
+
+    if (!best) return null;
+
+    return this.mapTemplate(best, best.category, category);
+  }
+
   private async mapTemplate(template: any, category: any, requestedCategory?: any) {
     const runtimeCategory = requestedCategory ?? category;
     const blockIds = this.parseBlockIds(template.blockIds);
@@ -138,16 +213,7 @@ export class CategoriesService {
           where: { isActive: true },
           orderBy: { version: 'desc' },
           take: 1,
-          include: {
-            fields: {
-              orderBy: { sortOrder: 'asc' },
-              include: {
-                options: {
-                  orderBy: { sortOrder: 'asc' },
-                },
-              },
-            },
-          },
+          include: this.templateWithFieldsInclude,
         },
       },
     });
@@ -156,11 +222,9 @@ export class CategoriesService {
       return null;
     }
 
-    if (category.formTemplates.length > 0) {
-      return this.mapTemplate(category.formTemplates[0], category);
-    }
-
-    // Fallback: walk up parent chain and use nearest active ancestor template.
+    // Check nearest active ancestor template.
+    let nearestAncestorWithTemplate: { template: any; category: any } | null =
+      null;
     let parentId = category.parentId;
     while (parentId) {
       const parent = await this.prisma.category.findUnique({
@@ -170,27 +234,41 @@ export class CategoriesService {
             where: { isActive: true },
             orderBy: { version: 'desc' },
             take: 1,
-            include: {
-              fields: {
-                orderBy: { sortOrder: 'asc' },
-                include: {
-                  options: {
-                    orderBy: { sortOrder: 'asc' },
-                  },
-                },
-              },
-            },
+            include: this.templateWithFieldsInclude,
           },
         },
       });
 
       if (!parent) break;
       if (parent.formTemplates.length > 0) {
-        return this.mapTemplate(parent.formTemplates[0], parent, category);
+        nearestAncestorWithTemplate = {
+          template: parent.formTemplates[0],
+          category: parent,
+        };
+        break;
       }
       parentId = parent.parentId;
     }
 
+    const directTemplate = category.formTemplates[0] ?? null;
+
+    // Always prefer the category's own active template.
+    // propagateTemplateToDescendants (in admin.service) keeps it in sync
+    // with the parent whenever the admin saves, so there is no need to
+    // compare timestamps or fall back to the ancestor when a direct
+    // template exists.
+    if (directTemplate) {
+      return this.mapTemplate(directTemplate, category);
+    }
+
+    if (nearestAncestorWithTemplate) {
+      return this.mapTemplate(
+        nearestAncestorWithTemplate.template,
+        nearestAncestorWithTemplate.category,
+        category,
+      );
+    }
+
     // Fallback: use a sibling template when parent/ancestor do not have one.
     if (category.parentId) {
       const siblingTemplates = await this.prisma.formTemplate.findMany({
@@ -202,14 +280,7 @@ export class CategoriesService {
         },
         orderBy: [{ version: 'desc' }],
         include: {
-          fields: {
-            orderBy: { sortOrder: 'asc' },
-            include: {
-              options: {
-                orderBy: { sortOrder: 'asc' },
-              },
-            },
-          },
+          fields: this.templateWithFieldsInclude.fields,
         },
       });
 
@@ -237,6 +308,13 @@ export class CategoriesService {
       }
     }
 
+    // Last fallback for motorized categories when no explicit/ancestor/sibling
+    // template exists.
+    const motorizedTemplate = await this.findMotorizedFallbackTemplate(category);
+    if (motorizedTemplate) {
+      return motorizedTemplate;
+    }
+
     return null;
   }
 }
diff --git a/web/src/app/admin/categories/page.tsx b/web/src/app/admin/categories/page.tsx
index 66956f8..a304141 100644
--- a/web/src/app/admin/categories/page.tsx
+++ b/web/src/app/admin/categories/page.tsx
@@ -153,7 +153,8 @@ export default function AdminCategoriesPage() {
     const [formData, setFormData] = useState({
         name: '',
         slug: '',
-        parentId: undefined as number | undefined
+        parentId: undefined as number | undefined,
+        hasEngine: false,
     });
     const [editingId, setEditingId] = useState<number | null>(null);
 
@@ -186,6 +187,7 @@ export default function AdminCategoriesPage() {
                 name: formData.name,
                 slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
                 parentId: formData.parentId,
+                hasEngine: formData.hasEngine,
             };
 
             if (editingId) {
@@ -214,13 +216,29 @@ export default function AdminCategoriesPage() {
     }
 
     function resetForm() {
-        setFormData({ name: '', slug: '', parentId: undefined });
+        setFormData({ name: '', slug: '', parentId: undefined, hasEngine: false });
         setEditingId(null);
     }
 
+    function findCategoryById(tree: any[], id: number): any | null {
+        for (const node of tree) {
+            if (Number(node.id) === id) return node;
+            const child = findCategoryById(node.children || [], id);
+            if (child) return child;
+        }
+        return null;
+    }
+
     function openCreate(parentId?: number) {
         resetForm();
-        setFormData(prev => ({ ...prev, parentId }));
+        const parentCategory = parentId && categories
+            ? findCategoryById(categories as any[], parentId)
+            : null;
+        setFormData(prev => ({
+            ...prev,
+            parentId,
+            hasEngine: Boolean(parentCategory?.hasEngine),
+        }));
         setIsDialogOpen(true);
     }
 
@@ -228,7 +246,8 @@ export default function AdminCategoriesPage() {
         setFormData({
             name: cat.name,
             slug: cat.slug,
-            parentId: Number(cat.parentId) || undefined
+            parentId: Number(cat.parentId) || undefined,
+            hasEngine: Boolean(cat.hasEngine),
         });
         setEditingId(Number(cat.id));
         setIsDialogOpen(true);
@@ -293,6 +312,19 @@ export default function AdminCategoriesPage() {
                                 />
                                 <p className="text-xs text-muted-foreground mt-1">Leave empty to auto-generate from name.</p>
                             </div>
+                            <div className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2">
+                                <input
+                                    id="hasEngine"
+                                    type="checkbox"
+                                    checked={formData.hasEngine}
+                                    onChange={(e) =>
+                                        setFormData({ ...formData, hasEngine: e.target.checked })
+                                    }
+                                />
+                                <Label htmlFor="hasEngine" className="cursor-pointer">
+                                    Has engine (uses motorized template fallback)
+                                </Label>
+                            </div>
                             {formData.parentId && (
                                 <div className="text-sm text-muted-foreground">
                                     Creating subcategory under ID: {formData.parentId}
diff --git a/web/src/lib/api.ts b/web/src/lib/api.ts
index bd685e2..47aa12b 100644
--- a/web/src/lib/api.ts
+++ b/web/src/lib/api.ts
@@ -561,6 +561,7 @@ export interface AdminCategory {
   slug: string;
   parentId?: number;
   sortOrder?: number;
+  hasEngine?: boolean;
   children?: AdminCategory[];
 }
 
@@ -585,6 +586,7 @@ export const createAdminCategory = (data: {
   slug: string;
   parentId?: number;
   sortOrder?: number;
+  hasEngine?: boolean;
 }) =>
   fetchApi<AdminCategory>('/admin/categories', {
     method: 'POST',
@@ -596,6 +598,7 @@ export const updateAdminCategory = (id: number, data: {
   slug?: string;
   parentId?: number;
   sortOrder?: number;
+  hasEngine?: boolean;
 }) =>
   fetchApi<AdminCategory>(`/admin/categories/${id}`, {
     method: 'PATCH',
diff --git a/web/src/lib/queries.ts b/web/src/lib/queries.ts
index 46ad9d8..cd06f59 100644
--- a/web/src/lib/queries.ts
+++ b/web/src/lib/queries.ts
@@ -703,7 +703,9 @@ export function useCategoryTemplate(categoryId: string) {
     queryKey: ['category-template', categoryId],
     queryFn: () => api.getCategoryTemplate(categoryId),
     enabled: !!categoryId,
-    staleTime: 10 * 60 * 1000, // 10 minutes
+    staleTime: 0,
+    refetchOnMount: 'always',
+    refetchOnWindowFocus: true,
   });
 }
 
```
