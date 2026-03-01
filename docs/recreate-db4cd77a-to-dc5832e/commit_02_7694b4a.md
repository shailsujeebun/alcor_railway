# Commit 2: 7694b4a

## Metadata
```text
commit 7694b4a13d82bf300046aeba21092f59e4fc67e9
Author:     Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
AuthorDate: Mon Feb 23 16:04:32 2026 +0100
Commit:     Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
CommitDate: Mon Feb 23 16:04:32 2026 +0100

    fix: show full engine block fields in post-ad form
    
    - categories.service.ts mapTemplate: auto-inject engine_block for all
      hasEngine categories. effectiveBlockIds always includes engine_block
      for engine categories even if the DB template still has blockIds:[].
      Falls back to the built-in DEFAULT_ENGINE_BLOCK_FIELDS definition if
      the block does not yet exist in the form_block table, so no DB
      migration is needed. Returns effectiveBlockIds in the response so
      the admin template builder correctly shows engine_block as selected.
    - seed-all/core.ts: upsert the engine_block system block before the
      template loop; set blockIds:['engine_block'] on all motorized leaf
      category templates so fresh seeds are immediately consistent.
    
    Result: posting an ad for any engine category now shows 8 fields:
      Year, Condition, Engine hours (template) + Fuel type, Power (hp),
      Engine displacement, Engine model, Emission class (engine_block).
    
    Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## File Changes
```text
7694b4a fix: show full engine block fields in post-ad form
 api/prisma/seed-all/core.ts              | 23 +++++++++++++++++++
 api/src/categories/categories.service.ts | 39 ++++++++++++++++++++++++--------
 2 files changed, 52 insertions(+), 10 deletions(-)
```

## Full Patch
```diff
commit 7694b4a13d82bf300046aeba21092f59e4fc67e9
Author: Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
Date:   Mon Feb 23 16:04:32 2026 +0100

    fix: show full engine block fields in post-ad form
    
    - categories.service.ts mapTemplate: auto-inject engine_block for all
      hasEngine categories. effectiveBlockIds always includes engine_block
      for engine categories even if the DB template still has blockIds:[].
      Falls back to the built-in DEFAULT_ENGINE_BLOCK_FIELDS definition if
      the block does not yet exist in the form_block table, so no DB
      migration is needed. Returns effectiveBlockIds in the response so
      the admin template builder correctly shows engine_block as selected.
    - seed-all/core.ts: upsert the engine_block system block before the
      template loop; set blockIds:['engine_block'] on all motorized leaf
      category templates so fresh seeds are immediately consistent.
    
    Result: posting an ad for any engine category now shows 8 fields:
      Year, Condition, Engine hours (template) + Fuel type, Power (hp),
      Engine displacement, Engine model, Emission class (engine_block).
    
    Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

diff --git a/api/prisma/seed-all/core.ts b/api/prisma/seed-all/core.ts
index 42729b6..0db5c43 100644
--- a/api/prisma/seed-all/core.ts
+++ b/api/prisma/seed-all/core.ts
@@ -370,15 +370,38 @@ export async function seedCore(prisma: PrismaClient): Promise<CoreSeedData> {
     'suv',
   ];
 
+  // Ensure the system engine block exists before templates reference it.
+  await prisma.formBlock.upsert({
+    where: { id: 'engine_block' },
+    create: {
+      id: 'engine_block',
+      name: 'Engine Block',
+      isSystem: true,
+      fields: [
+        { key: 'fuel_type', label: 'Fuel type', component: 'select', required: false, group: 'Engine', order: 1000, dataSource: 'static',
+          staticOptions: [{ value: 'diesel', label: 'Diesel' }, { value: 'petrol', label: 'Petrol' }, { value: 'electric', label: 'Electric' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'lpg', label: 'LPG' }] },
+        { key: 'power_hp', label: 'Power (hp)', component: 'number', required: false, group: 'Engine', order: 1010, validationRules: { min: 1, max: 5000, unit: 'hp' } },
+        { key: 'engine_displacement_cm3', label: 'Engine displacement', component: 'number', required: false, group: 'Engine', order: 1020, validationRules: { min: 1, max: 100000, unit: 'cm³' } },
+        { key: 'engine_model', label: 'Engine model', component: 'text', required: false, group: 'Engine', order: 1030 },
+        { key: 'emission_class', label: 'Emission class', component: 'select', required: false, group: 'Engine', order: 1040, dataSource: 'static',
+          staticOptions: [{ value: 'euro_1', label: 'Euro 1' }, { value: 'euro_2', label: 'Euro 2' }, { value: 'euro_3', label: 'Euro 3' }, { value: 'euro_4', label: 'Euro 4' }, { value: 'euro_5', label: 'Euro 5' }, { value: 'euro_6', label: 'Euro 6' }, { value: 'tier_4', label: 'Tier 4' }, { value: 'stage_v', label: 'Stage V' }] },
+      ] as Prisma.InputJsonValue,
+    },
+    update: { name: 'Engine Block', isSystem: true },
+  });
+
   for (const slug of leafCategorySlugs) {
     const category = categoriesBySlug.get(slug);
     if (!category) continue;
 
+    const blockIds = isLikelyMotorizedSlug(slug) ? ['engine_block'] : [];
+
     await prisma.formTemplate.create({
       data: {
         categoryId: category.id,
         version: 1,
         isActive: true,
+        blockIds,
         fields: {
           create: [
             {
diff --git a/api/src/categories/categories.service.ts b/api/src/categories/categories.service.ts
index 2ea737a..36d45d7 100644
--- a/api/src/categories/categories.service.ts
+++ b/api/src/categories/categories.service.ts
@@ -1,7 +1,7 @@
 import { Injectable } from '@nestjs/common';
 import { PrismaService } from '../prisma/prisma.service';
 import { CreateCategoryDto } from './dto/create-category.dto';
-import { mergeTemplateFieldsWithBlocks } from '../templates/template-schema';
+import { mergeTemplateFieldsWithBlocks, getBuiltInEngineBlock } from '../templates/template-schema';
 
 export interface CategoryTreeNode {
   id: string;
@@ -158,23 +158,42 @@ export class CategoriesService {
   private async mapTemplate(template: any, category: any, requestedCategory?: any) {
     const runtimeCategory = requestedCategory ?? category;
     const blockIds = this.parseBlockIds(template.blockIds);
-    const blocks =
-      blockIds.length === 0
+
+    // For engine categories, always include engine_block even if not yet
+    // stored on the template — this ensures the posting form always shows
+    // the full set of engine-specific fields (Fuel type, Power, etc.).
+    const effectiveBlockIds =
+      runtimeCategory.hasEngine && !blockIds.includes('engine_block')
+        ? ['engine_block', ...blockIds]
+        : blockIds;
+
+    const dbBlocks =
+      effectiveBlockIds.length === 0
         ? []
         : await this.prisma.formBlock.findMany({
-            where: { id: { in: blockIds } },
+            where: { id: { in: effectiveBlockIds } },
             orderBy: { name: 'asc' },
           });
 
-    const mergedFields = mergeTemplateFieldsWithBlocks(
-      template.fields ?? [],
-      blocks.map((block) => ({
+    const dbBlockIdSet = new Set(dbBlocks.map((b: any) => b.id));
+
+    // If engine_block is needed but not yet in DB, use the built-in definition.
+    const extraBlocks: any[] =
+      effectiveBlockIds.includes('engine_block') && !dbBlockIdSet.has('engine_block')
+        ? [getBuiltInEngineBlock()]
+        : [];
+
+    const blocks = [
+      ...dbBlocks.map((block: any) => ({
         id: block.id,
         name: block.name,
         isSystem: block.isSystem,
         fields: (block.fields as any[]) ?? [],
       })),
-    );
+      ...extraBlocks,
+    ];
+
+    const mergedFields = mergeTemplateFieldsWithBlocks(template.fields ?? [], blocks);
 
     return {
       id: template.id.toString(),
@@ -182,11 +201,11 @@ export class CategoriesService {
       version: template.version,
       isActive: template.isActive,
       createdAt: template.createdAt,
-      blockIds,
+      blockIds: effectiveBlockIds,
       blocks: blocks.map((block) => ({
         id: block.id,
         name: block.name,
-        isSystem: block.isSystem,
+        isSystem: Boolean(block.isSystem),
       })),
       category: {
         id: runtimeCategory.id.toString(),
```
