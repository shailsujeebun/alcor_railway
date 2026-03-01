# Commit 4: 669a47b

## Metadata
```text
commit 669a47bde65561f662f321f7aef0a7271aa92ae2
Author:     Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
AuthorDate: Tue Feb 24 09:28:40 2026 +0100
Commit:     Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
CommitDate: Tue Feb 24 09:28:40 2026 +0100

    restore: recover Feb 23 marketplace updates after reset
```

## File Changes
```text
669a47b restore: recover Feb 23 marketplace updates after reset
 api/prisma/seed-all/core.ts                        |  98 +--
 api/src/admin/admin.controller.ts                  |   4 +-
 api/src/admin/admin.service.ts                     |  10 +-
 api/src/auth/auth.controller.ts                    |   6 +-
 api/src/auth/auth.service.ts                       |  18 +-
 api/src/categories/categories.service.spec.ts      |   4 +-
 api/src/categories/categories.service.ts           |  22 +-
 api/src/common/rule-tree.spec.ts                   |   1 -
 api/src/common/rule-tree.ts                        |   7 +-
 api/src/config/configuration.spec.ts               |   4 +-
 api/src/config/configuration.ts                    |   6 +-
 api/src/listings/listings.service.ts               |  28 +-
 api/src/options/options.controller.ts              |   5 +-
 api/src/options/options.module.ts                  |   1 -
 api/src/options/options.service.ts                 |  29 +-
 api/src/templates/template-schema.ts               | 648 ++++++++++++++++++--
 api/src/upload/upload.controller.ts                |  39 +-
 api/src/upload/upload.security.spec.ts             |  12 +-
 api/src/upload/upload.service.ts                   |  41 +-
 docs/AD.MD                                         |   1 +
 docs/ADMIN.MD                                      |   1 +
 docs/CLAUDE.md                                     |   1 +
 docs/DB_ER_DIAGRAM.MD                              |   1 +
 docs/README.md                                     |  13 +
 docs/plan.md                                       |  21 +
 docs/production-test.md                            |   1 +
 docs/project_status.md                             |  25 +
 docs/secret-rotation-runbook.md                    |   1 +
 docs/security-hardening.md                         |   1 +
 docs/security-signoff-evidence.md                  |   1 +
 docs/task.md                                       |  16 +
 docs/translation-privacy-policy.md                 |   1 +
 web/src/app/admin/templates/builder/page.tsx       | 468 ++++++++++-----
 web/src/components/listings/dynamic-form.tsx       | 102 ++--
 web/src/components/listings/listing-detail.tsx     | 660 +++++++++++++++------
 web/src/components/listings/media-uploader.tsx     |  19 +-
 .../components/listings/wizard/contact-step.tsx    |   4 +-
 web/src/components/ui/price-display.tsx            |   4 +
 web/src/lib/api.ts                                 |  84 ++-
 39 files changed, 1883 insertions(+), 525 deletions(-)
```

## Full Patch
```diff
commit 669a47bde65561f662f321f7aef0a7271aa92ae2
Author: Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
Date:   Tue Feb 24 09:28:40 2026 +0100

    restore: recover Feb 23 marketplace updates after reset

diff --git a/api/prisma/seed-all/core.ts b/api/prisma/seed-all/core.ts
index 0db5c43..0cbc7f4 100644
--- a/api/prisma/seed-all/core.ts
+++ b/api/prisma/seed-all/core.ts
@@ -1,6 +1,7 @@
 import { Prisma, PrismaClient } from '@prisma/client';
 import * as bcrypt from 'bcrypt';
 import { daysAgo, daysFromNow, type SeedCatalog, type SeedGeo, type SeedPlans, type SeedUsers } from './shared';
+import { DEFAULT_MOTORIZED_BLOCK_FIELDS } from '../../src/templates/template-schema';
 
 export type CoreSeedData = {
   users: SeedUsers;
@@ -375,26 +376,23 @@ export async function seedCore(prisma: PrismaClient): Promise<CoreSeedData> {
     where: { id: 'engine_block' },
     create: {
       id: 'engine_block',
-      name: 'Engine Block',
+      name: 'Motorized Vehicle Block',
       isSystem: true,
-      fields: [
-        { key: 'fuel_type', label: 'Fuel type', component: 'select', required: false, group: 'Engine', order: 1000, dataSource: 'static',
-          staticOptions: [{ value: 'diesel', label: 'Diesel' }, { value: 'petrol', label: 'Petrol' }, { value: 'electric', label: 'Electric' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'lpg', label: 'LPG' }] },
-        { key: 'power_hp', label: 'Power (hp)', component: 'number', required: false, group: 'Engine', order: 1010, validationRules: { min: 1, max: 5000, unit: 'hp' } },
-        { key: 'engine_displacement_cm3', label: 'Engine displacement', component: 'number', required: false, group: 'Engine', order: 1020, validationRules: { min: 1, max: 100000, unit: 'cm³' } },
-        { key: 'engine_model', label: 'Engine model', component: 'text', required: false, group: 'Engine', order: 1030 },
-        { key: 'emission_class', label: 'Emission class', component: 'select', required: false, group: 'Engine', order: 1040, dataSource: 'static',
-          staticOptions: [{ value: 'euro_1', label: 'Euro 1' }, { value: 'euro_2', label: 'Euro 2' }, { value: 'euro_3', label: 'Euro 3' }, { value: 'euro_4', label: 'Euro 4' }, { value: 'euro_5', label: 'Euro 5' }, { value: 'euro_6', label: 'Euro 6' }, { value: 'tier_4', label: 'Tier 4' }, { value: 'stage_v', label: 'Stage V' }] },
-      ] as Prisma.InputJsonValue,
+      fields: DEFAULT_MOTORIZED_BLOCK_FIELDS as unknown as Prisma.InputJsonValue,
+    },
+    update: {
+      name: 'Motorized Vehicle Block',
+      isSystem: true,
+      fields: DEFAULT_MOTORIZED_BLOCK_FIELDS as unknown as Prisma.InputJsonValue,
     },
-    update: { name: 'Engine Block', isSystem: true },
   });
 
   for (const slug of leafCategorySlugs) {
     const category = categoriesBySlug.get(slug);
     if (!category) continue;
 
-    const blockIds = isLikelyMotorizedSlug(slug) ? ['engine_block'] : [];
+    const isMotorizedCategory = isLikelyMotorizedSlug(slug);
+    const blockIds = isMotorizedCategory ? ['engine_block'] : [];
 
     await prisma.formTemplate.create({
       data: {
@@ -402,44 +400,46 @@ export async function seedCore(prisma: PrismaClient): Promise<CoreSeedData> {
         version: 1,
         isActive: true,
         blockIds,
-        fields: {
-          create: [
-            {
-              fieldKey: 'year',
-              label: 'Year',
-              fieldType: 'NUMBER',
-              required: true,
-              sortOrder: 1,
-              section: 'General',
-              validations: { min: 1990, max: 2030 },
-            },
-            {
-              fieldKey: 'condition',
-              label: 'Condition',
-              fieldType: 'SELECT',
-              required: true,
-              sortOrder: 2,
-              section: 'General',
-              validations: {},
-              options: {
-                create: [
-                  { value: 'NEW', label: 'New', sortOrder: 1 },
-                  { value: 'USED', label: 'Used', sortOrder: 2 },
-                  { value: 'DEMO', label: 'Demo', sortOrder: 3 },
-                ],
-              },
-            },
-            {
-              fieldKey: 'hours',
-              label: 'Engine hours',
-              fieldType: 'NUMBER',
-              required: false,
-              sortOrder: 3,
-              section: 'Technical',
-              validations: { min: 0, max: 200000, unit: 'h' },
+        fields: isMotorizedCategory
+          ? undefined
+          : {
+              create: [
+                {
+                  fieldKey: 'year',
+                  label: 'Year',
+                  fieldType: 'NUMBER',
+                  required: true,
+                  sortOrder: 1,
+                  section: 'General',
+                  validations: { min: 1990, max: 2030 },
+                },
+                {
+                  fieldKey: 'condition',
+                  label: 'Condition',
+                  fieldType: 'SELECT',
+                  required: true,
+                  sortOrder: 2,
+                  section: 'General',
+                  validations: {},
+                  options: {
+                    create: [
+                      { value: 'NEW', label: 'New', sortOrder: 1 },
+                      { value: 'USED', label: 'Used', sortOrder: 2 },
+                      { value: 'DEMO', label: 'Demo', sortOrder: 3 },
+                    ],
+                  },
+                },
+                {
+                  fieldKey: 'hours',
+                  label: 'Engine hours',
+                  fieldType: 'NUMBER',
+                  required: false,
+                  sortOrder: 3,
+                  section: 'Technical',
+                  validations: { min: 0, max: 200000, unit: 'h' },
+                },
+              ],
             },
-          ],
-        },
       },
     });
   }
diff --git a/api/src/admin/admin.controller.ts b/api/src/admin/admin.controller.ts
index 180e146..8b28c9b 100644
--- a/api/src/admin/admin.controller.ts
+++ b/api/src/admin/admin.controller.ts
@@ -134,7 +134,9 @@ export class AdminController {
   }
 
   @Post('blocks')
-  createBlock(@Body() body: { name: string; fields: any[]; isSystem?: boolean }) {
+  createBlock(
+    @Body() body: { name: string; fields: any[]; isSystem?: boolean },
+  ) {
     return this.adminService.createBlock(body);
   }
 
diff --git a/api/src/admin/admin.service.ts b/api/src/admin/admin.service.ts
index 98da51b..e2ea7d5 100644
--- a/api/src/admin/admin.service.ts
+++ b/api/src/admin/admin.service.ts
@@ -137,7 +137,10 @@ export class AdminService {
     const localFields = (template.fields ?? []).map((field: any) =>
       mapFieldToResponse(field),
     );
-    const mergedFields = mergeTemplateFieldsWithBlocks(template.fields ?? [], blocks);
+    const mergedFields = mergeTemplateFieldsWithBlocks(
+      template.fields ?? [],
+      blocks,
+    );
 
     return {
       id: template.id.toString(),
@@ -426,7 +429,10 @@ export class AdminService {
     });
   }
 
-  async updateTemplate(id: number, data: { fields: any[]; blockIds?: string[] }) {
+  async updateTemplate(
+    id: number,
+    data: { fields: any[]; blockIds?: string[] },
+  ) {
     const templateId = BigInt(id);
 
     return this.prisma.$transaction(async (tx) => {
diff --git a/api/src/auth/auth.controller.ts b/api/src/auth/auth.controller.ts
index c33cc25..12d163d 100644
--- a/api/src/auth/auth.controller.ts
+++ b/api/src/auth/auth.controller.ts
@@ -207,7 +207,11 @@ export class AuthController {
       maxAge,
     };
 
-    response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, refreshCookieOptions);
+    response.cookie(
+      REFRESH_TOKEN_COOKIE_NAME,
+      refreshToken,
+      refreshCookieOptions,
+    );
     response.cookie(CSRF_TOKEN_COOKIE_NAME, randomUUID(), csrfCookieOptions);
   }
 
diff --git a/api/src/auth/auth.service.ts b/api/src/auth/auth.service.ts
index 5e10b1e..38e7f69 100644
--- a/api/src/auth/auth.service.ts
+++ b/api/src/auth/auth.service.ts
@@ -205,7 +205,10 @@ export class AuthService {
     }
 
     if (user.emailVerified) {
-      await this.clearVerificationFailureState(normalizedEmail, normalizedClientKey);
+      await this.clearVerificationFailureState(
+        normalizedEmail,
+        normalizedClientKey,
+      );
       const tokens = await this.generateTokens(user.id, user.email, user.role);
       return { user: this.usersService.sanitize(user), ...tokens };
     }
@@ -247,7 +250,10 @@ export class AuthService {
     ]);
 
     const updatedUser = await this.usersService.findById(user.id);
-    await this.clearVerificationFailureState(normalizedEmail, normalizedClientKey);
+    await this.clearVerificationFailureState(
+      normalizedEmail,
+      normalizedClientKey,
+    );
     const tokens = await this.generateTokens(
       updatedUser.id,
       updatedUser.email,
@@ -340,10 +346,14 @@ export class AuthService {
       keys.push(this.getVerificationAttemptIpKey(normalizedClientKey));
     }
 
-    const values = await Promise.all(keys.map((key) => this.redisService.get(key)));
+    const values = await Promise.all(
+      keys.map((key) => this.redisService.get(key)),
+    );
     const maxAttempts = values.reduce((currentMax, value) => {
       const parsed = parseInt(value ?? '0', 10);
-      return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
+      return Number.isFinite(parsed)
+        ? Math.max(currentMax, parsed)
+        : currentMax;
     }, 0);
 
     if (maxAttempts >= this.verificationAttemptLimit) {
diff --git a/api/src/categories/categories.service.spec.ts b/api/src/categories/categories.service.spec.ts
index c72b606..30d7968 100644
--- a/api/src/categories/categories.service.spec.ts
+++ b/api/src/categories/categories.service.spec.ts
@@ -109,7 +109,9 @@ describe('CategoriesService.findTemplate', () => {
             visibilityIf: {},
             requiredIf: {},
             config: { component: 'select', dataSource: 'static' },
-            options: [{ id: 1n, value: 'diesel', label: 'Diesel', sortOrder: 1 }],
+            options: [
+              { id: 1n, value: 'diesel', label: 'Diesel', sortOrder: 1 },
+            ],
           },
         ],
         category: {
diff --git a/api/src/categories/categories.service.ts b/api/src/categories/categories.service.ts
index 36d45d7..d42e5af 100644
--- a/api/src/categories/categories.service.ts
+++ b/api/src/categories/categories.service.ts
@@ -1,7 +1,10 @@
 import { Injectable } from '@nestjs/common';
 import { PrismaService } from '../prisma/prisma.service';
 import { CreateCategoryDto } from './dto/create-category.dto';
-import { mergeTemplateFieldsWithBlocks, getBuiltInEngineBlock } from '../templates/template-schema';
+import {
+  mergeTemplateFieldsWithBlocks,
+  getBuiltInEngineBlock,
+} from '../templates/template-schema';
 
 export interface CategoryTreeNode {
   id: string;
@@ -155,7 +158,11 @@ export class CategoriesService {
     return this.mapTemplate(best, best.category, category);
   }
 
-  private async mapTemplate(template: any, category: any, requestedCategory?: any) {
+  private async mapTemplate(
+    template: any,
+    category: any,
+    requestedCategory?: any,
+  ) {
     const runtimeCategory = requestedCategory ?? category;
     const blockIds = this.parseBlockIds(template.blockIds);
 
@@ -179,7 +186,8 @@ export class CategoriesService {
 
     // If engine_block is needed but not yet in DB, use the built-in definition.
     const extraBlocks: any[] =
-      effectiveBlockIds.includes('engine_block') && !dbBlockIdSet.has('engine_block')
+      effectiveBlockIds.includes('engine_block') &&
+      !dbBlockIdSet.has('engine_block')
         ? [getBuiltInEngineBlock()]
         : [];
 
@@ -193,7 +201,10 @@ export class CategoriesService {
       ...extraBlocks,
     ];
 
-    const mergedFields = mergeTemplateFieldsWithBlocks(template.fields ?? [], blocks);
+    const mergedFields = mergeTemplateFieldsWithBlocks(
+      template.fields ?? [],
+      blocks,
+    );
 
     return {
       id: template.id.toString(),
@@ -329,7 +340,8 @@ export class CategoriesService {
 
     // Last fallback for motorized categories when no explicit/ancestor/sibling
     // template exists.
-    const motorizedTemplate = await this.findMotorizedFallbackTemplate(category);
+    const motorizedTemplate =
+      await this.findMotorizedFallbackTemplate(category);
     if (motorizedTemplate) {
       return motorizedTemplate;
     }
diff --git a/api/src/common/rule-tree.spec.ts b/api/src/common/rule-tree.spec.ts
index 2564f6a..dd4efc4 100644
--- a/api/src/common/rule-tree.spec.ts
+++ b/api/src/common/rule-tree.spec.ts
@@ -51,4 +51,3 @@ describe('evaluateRuleTree', () => {
     ).toBe(true);
   });
 });
-
diff --git a/api/src/common/rule-tree.ts b/api/src/common/rule-tree.ts
index 3f0f822..253e971 100644
--- a/api/src/common/rule-tree.ts
+++ b/api/src/common/rule-tree.ts
@@ -61,7 +61,9 @@ function evaluateLeaf(
     case 'notIn':
       return Array.isArray(leaf.value) && !leaf.value.includes(actualValue);
     case 'exists':
-      return actualValue !== undefined && actualValue !== null && actualValue !== '';
+      return (
+        actualValue !== undefined && actualValue !== null && actualValue !== ''
+      );
     case 'gt':
       return Number(actualValue) > Number(leaf.value);
     case 'gte':
@@ -92,6 +94,5 @@ export function evaluateRuleTree(
     return !evaluateRuleTree(tree.not, state, context);
   }
 
-  return evaluateLeaf(tree as RuleLeaf, state, context);
+  return evaluateLeaf(tree, state, context);
 }
-
diff --git a/api/src/config/configuration.spec.ts b/api/src/config/configuration.spec.ts
index c315156..99af6ee 100644
--- a/api/src/config/configuration.spec.ts
+++ b/api/src/config/configuration.spec.ts
@@ -34,7 +34,9 @@ describe('configuration security validation', () => {
     process.env.S3_ACCESS_KEY_ID = 'prod-access-key';
     process.env.S3_SECRET_ACCESS_KEY = STRONG_S3_SECRET;
 
-    expect(() => configuration()).toThrow('Missing required secret: JWT_SECRET');
+    expect(() => configuration()).toThrow(
+      'Missing required secret: JWT_SECRET',
+    );
   });
 
   it('fails in production when upload secret matches JWT secret', () => {
diff --git a/api/src/config/configuration.ts b/api/src/config/configuration.ts
index e8b8bc0..d486302 100644
--- a/api/src/config/configuration.ts
+++ b/api/src/config/configuration.ts
@@ -69,7 +69,7 @@ export default () => {
     process.env.UPLOAD_GUEST_TOKEN_SECRET ??
     (isProduction
       ? undefined
-      : process.env.JWT_SECRET ?? DEV_DEFAULT_UPLOAD_GUEST_SECRET);
+      : (process.env.JWT_SECRET ?? DEV_DEFAULT_UPLOAD_GUEST_SECRET));
 
   const s3AccessKeyId =
     process.env.S3_ACCESS_KEY_ID ??
@@ -82,7 +82,9 @@ export default () => {
   if (isProduction) {
     assertStrongSecret('JWT_SECRET', jwtSecret, 32);
     assertStrongSecret('UPLOAD_GUEST_TOKEN_SECRET', uploadGuestTokenSecret, 32);
-    assertNonDefaultCredential('S3_ACCESS_KEY_ID', s3AccessKeyId, ['minioadmin']);
+    assertNonDefaultCredential('S3_ACCESS_KEY_ID', s3AccessKeyId, [
+      'minioadmin',
+    ]);
     assertStrongSecret('S3_SECRET_ACCESS_KEY', s3SecretAccessKey, 24);
 
     if (jwtSecret === uploadGuestTokenSecret) {
diff --git a/api/src/listings/listings.service.ts b/api/src/listings/listings.service.ts
index 548dd93..83f6183 100644
--- a/api/src/listings/listings.service.ts
+++ b/api/src/listings/listings.service.ts
@@ -725,13 +725,12 @@ export class ListingsService {
         attributes,
         context,
       );
-      const required = Boolean(field.required || field.isRequired || requiredByRule);
+      const required = Boolean(
+        field.required || field.isRequired || requiredByRule,
+      );
 
       // Check required
-      if (
-        required &&
-        (value === undefined || value === null || value === '')
-      ) {
+      if (required && (value === undefined || value === null || value === '')) {
         errors.push({
           field: field.key,
           message: 'This field is required',
@@ -749,16 +748,33 @@ export class ListingsService {
         }
         if (
           field.component === 'checkbox' &&
+          String(field.type ?? '').toUpperCase() !== 'CHECKBOX_GROUP' &&
           typeof value !== 'boolean' &&
           value !== 'true' &&
           value !== 'false'
         ) {
           errors.push({ field: field.key, message: 'Must be a boolean' });
         }
+        if (
+          field.component === 'checkbox' &&
+          String(field.type ?? '').toUpperCase() === 'CHECKBOX_GROUP'
+        ) {
+          const isValidGroupValue =
+            Array.isArray(value) ||
+            typeof value === 'string' ||
+            value === null ||
+            value === undefined;
+          if (!isValidGroupValue) {
+            errors.push({
+              field: field.key,
+              message: 'Must be a comma-separated list or array',
+            });
+          }
+        }
 
         // Custom validations (min/max)
         if (field.validationRules) {
-          const rules = field.validationRules as Record<string, any>;
+          const rules = field.validationRules;
           if (rules.min !== undefined && Number(value) < rules.min) {
             errors.push({
               field: field.key,
diff --git a/api/src/options/options.controller.ts b/api/src/options/options.controller.ts
index 4571853..ede008b 100644
--- a/api/src/options/options.controller.ts
+++ b/api/src/options/options.controller.ts
@@ -25,7 +25,10 @@ export class OptionsController {
       depends?: Record<string, any>;
     },
   ) {
-    return this.optionsService.resolveDbOptions(body.optionsQuery, body.depends);
+    return this.optionsService.resolveDbOptions(
+      body.optionsQuery,
+      body.depends,
+    );
   }
 
   @Post('brands')
diff --git a/api/src/options/options.module.ts b/api/src/options/options.module.ts
index 7b591ad..25b07e8 100644
--- a/api/src/options/options.module.ts
+++ b/api/src/options/options.module.ts
@@ -8,4 +8,3 @@ import { OptionsService } from './options.service';
   exports: [OptionsService],
 })
 export class OptionsModule {}
-
diff --git a/api/src/options/options.service.ts b/api/src/options/options.service.ts
index edf50ae..e372109 100644
--- a/api/src/options/options.service.ts
+++ b/api/src/options/options.service.ts
@@ -114,7 +114,11 @@ export class OptionsService {
     return { value: brand.id, label: brand.name };
   }
 
-  async createModel(name: string, brandId?: string, categoryId?: string): Promise<OptionItem> {
+  async createModel(
+    name: string,
+    brandId?: string,
+    categoryId?: string,
+  ): Promise<OptionItem> {
     const normalizedName = name.trim();
     if (!normalizedName) {
       throw new BadRequestException('Model name is required');
@@ -213,18 +217,17 @@ export class OptionsService {
           })
         : [];
 
-    const siblingTemplate = siblingTemplates
-      .slice()
-      .sort((a: any, b: any) => {
-        const aBlocks = Array.isArray(a.blockIds) ? a.blockIds : [];
-        const bBlocks = Array.isArray(b.blockIds) ? b.blockIds : [];
-        const aHasEngineBlock = aBlocks.includes('engine_block') ? 1 : 0;
-        const bHasEngineBlock = bBlocks.includes('engine_block') ? 1 : 0;
-        if (aHasEngineBlock !== bHasEngineBlock) return bHasEngineBlock - aHasEngineBlock;
-        return (b.fields?.length ?? 0) - (a.fields?.length ?? 0);
-      })[0];
-
-    let baseSlug = this.slugify(normalizedName);
+    const siblingTemplate = siblingTemplates.slice().sort((a: any, b: any) => {
+      const aBlocks = Array.isArray(a.blockIds) ? a.blockIds : [];
+      const bBlocks = Array.isArray(b.blockIds) ? b.blockIds : [];
+      const aHasEngineBlock = aBlocks.includes('engine_block') ? 1 : 0;
+      const bHasEngineBlock = bBlocks.includes('engine_block') ? 1 : 0;
+      if (aHasEngineBlock !== bHasEngineBlock)
+        return bHasEngineBlock - aHasEngineBlock;
+      return (b.fields?.length ?? 0) - (a.fields?.length ?? 0);
+    })[0];
+
+    const baseSlug = this.slugify(normalizedName);
     let slug = baseSlug;
     let attempt = 1;
     while (
diff --git a/api/src/templates/template-schema.ts b/api/src/templates/template-schema.ts
index 7eb2b85..9e16cfa 100644
--- a/api/src/templates/template-schema.ts
+++ b/api/src/templates/template-schema.ts
@@ -27,14 +27,300 @@ type RawBlock = {
   fields: any[];
 };
 
-const DEFAULT_ENGINE_BLOCK_FIELDS = [
+const YEAR_OPTIONS = Array.from({ length: 77 }, (_, index) => {
+  const year = 2026 - index;
+  return { value: String(year), label: String(year) };
+});
+
+const MONTH_OPTIONS = [
+  { value: '01', label: 'January' },
+  { value: '02', label: 'February' },
+  { value: '03', label: 'March' },
+  { value: '04', label: 'April' },
+  { value: '05', label: 'May' },
+  { value: '06', label: 'June' },
+  { value: '07', label: 'July' },
+  { value: '08', label: 'August' },
+  { value: '09', label: 'September' },
+  { value: '10', label: 'October' },
+  { value: '11', label: 'November' },
+  { value: '12', label: 'December' },
+];
+
+export const DEFAULT_MOTORIZED_BLOCK_FIELDS = [
   {
-    key: 'fuel_type',
-    label: 'Fuel type',
+    key: 'brand',
+    label: 'Brand',
+    type: 'SELECT',
     component: 'select',
-    required: false,
-    group: 'Engine',
+    group: 'Basic Characteristics',
     order: 1000,
+    dataSource: 'api',
+  },
+  {
+    key: 'model',
+    label: 'Model',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Basic Characteristics',
+    order: 1010,
+    dataSource: 'api',
+    dependsOn: ['brand'],
+    resetOnChange: [],
+  },
+  {
+    key: 'right_hand_drive',
+    label: 'Right hand drive',
+    type: 'BOOLEAN',
+    component: 'checkbox',
+    group: 'Basic Characteristics',
+    order: 1020,
+  },
+  {
+    key: 'year_of_manufacture',
+    label: 'Year of manufacture',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Basic Characteristics',
+    order: 1030,
+    dataSource: 'static',
+    staticOptions: YEAR_OPTIONS,
+  },
+  {
+    key: 'month_of_manufacture',
+    label: 'Month of manufacture',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Basic Characteristics',
+    order: 1040,
+    dataSource: 'static',
+    staticOptions: MONTH_OPTIONS,
+  },
+  {
+    key: 'first_registration_year',
+    label: 'First registration (year)',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Basic Characteristics',
+    order: 1050,
+    dataSource: 'static',
+    staticOptions: YEAR_OPTIONS,
+  },
+  {
+    key: 'first_registration_month',
+    label: 'First registration (month)',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Basic Characteristics',
+    order: 1060,
+    dataSource: 'static',
+    staticOptions: MONTH_OPTIONS,
+  },
+  {
+    key: 'inspection_valid_till_year',
+    label: 'Technical inspection valid till (year)',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Basic Characteristics',
+    order: 1070,
+    dataSource: 'static',
+    staticOptions: YEAR_OPTIONS,
+  },
+  {
+    key: 'inspection_valid_till_month',
+    label: 'Technical inspection valid till (month)',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Basic Characteristics',
+    order: 1080,
+    dataSource: 'static',
+    staticOptions: MONTH_OPTIONS,
+  },
+  {
+    key: 'vin',
+    label: 'VIN',
+    type: 'TEXT',
+    component: 'text',
+    group: 'Basic Characteristics',
+    order: 1090,
+    validationRules: { minLength: 8, maxLength: 32 },
+  },
+  {
+    key: 'condition',
+    label: 'Condition',
+    type: 'RADIO',
+    component: 'radio',
+    group: 'Basic Characteristics',
+    order: 1100,
+    dataSource: 'static',
+    staticOptions: [
+      { value: 'new', label: 'New' },
+      { value: 'used', label: 'Used' },
+      { value: 'with_defect', label: 'With a defect' },
+      { value: 'remanufactured', label: 'Remanufactured' },
+      { value: 'crashed', label: 'Crashed' },
+      { value: 'demonstration', label: 'Demonstration' },
+      { value: 'for_parts', label: 'For parts' },
+    ],
+  },
+  {
+    key: 'technical_condition',
+    label: 'Technical condition',
+    type: 'CHECKBOX_GROUP',
+    component: 'checkbox',
+    group: 'Basic Characteristics',
+    order: 1110,
+    dataSource: 'static',
+    staticOptions: [
+      { value: 'garage_storage', label: 'Garage storage' },
+      { value: 'running_good', label: 'Running in good working order' },
+      { value: 'hasnt_been_hit', label: "Hasn't been hit" },
+      { value: 'hasnt_been_repainted', label: "Hasn't been repainted" },
+      { value: 'service_booklet', label: 'Service booklet' },
+      { value: 'not_working', label: 'Not in working order' },
+      { value: 'needs_bodywork', label: 'Needs bodywork' },
+      { value: 'needs_engine_overhaul', label: 'Needs engine overhaul' },
+      {
+        value: 'needs_undercarriage_repair',
+        label: 'Needs undercarriage repair',
+      },
+    ],
+  },
+  {
+    key: 'previous_owners',
+    label: 'Number of previous owners',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Basic Characteristics',
+    order: 1120,
+    dataSource: 'static',
+    staticOptions: [
+      { value: '0', label: '0' },
+      { value: '1', label: '1' },
+      { value: '2', label: '2' },
+      { value: '3', label: '3' },
+      { value: '4', label: '4' },
+      { value: '5_plus', label: '5+' },
+    ],
+  },
+  {
+    key: 'mileage',
+    label: 'Mileage',
+    type: 'NUMBER',
+    component: 'number',
+    group: 'Basic Characteristics',
+    order: 1130,
+    validationRules: { min: 0, max: 5000000, unit: 'km' },
+  },
+  {
+    key: 'body_type',
+    label: 'Body type',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Basic Characteristics',
+    order: 1140,
+    dataSource: 'static',
+    staticOptions: [
+      { value: 'sedan', label: 'Sedan' },
+      { value: 'suv', label: 'SUV' },
+      { value: 'hatchback', label: 'Hatchback' },
+      { value: 'wagon', label: 'Wagon' },
+      { value: 'pickup', label: 'Pickup' },
+      { value: 'tractor_unit', label: 'Tractor unit' },
+      { value: 'dump', label: 'Dump' },
+      { value: 'box', label: 'Box' },
+      { value: 'flatbed', label: 'Flatbed' },
+      { value: 'other', label: 'Other' },
+    ],
+  },
+  {
+    key: 'color',
+    label: 'Colour',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Basic Characteristics',
+    order: 1150,
+    dataSource: 'static',
+    staticOptions: [
+      { value: 'white', label: 'White' },
+      { value: 'black', label: 'Black' },
+      { value: 'silver', label: 'Silver' },
+      { value: 'grey', label: 'Grey' },
+      { value: 'blue', label: 'Blue' },
+      { value: 'red', label: 'Red' },
+      { value: 'green', label: 'Green' },
+      { value: 'yellow', label: 'Yellow' },
+      { value: 'orange', label: 'Orange' },
+      { value: 'brown', label: 'Brown' },
+      { value: 'beige', label: 'Beige' },
+      { value: 'other', label: 'Other' },
+    ],
+  },
+  {
+    key: 'doors',
+    label: 'Number of doors',
+    type: 'RADIO',
+    component: 'radio',
+    group: 'Basic Characteristics',
+    order: 1160,
+    dataSource: 'static',
+    staticOptions: [
+      { value: '2_3', label: '2/3' },
+      { value: '4_5', label: '4/5' },
+      { value: '6_7', label: '6/7' },
+    ],
+  },
+  {
+    key: 'seats',
+    label: 'Number of seats',
+    type: 'NUMBER',
+    component: 'number',
+    group: 'Basic Characteristics',
+    order: 1170,
+    validationRules: { min: 1, max: 100 },
+  },
+  {
+    key: 'net_weight_kg',
+    label: 'Net weight',
+    type: 'NUMBER',
+    component: 'number',
+    group: 'Basic Characteristics',
+    order: 1180,
+    validationRules: { min: 1, max: 200000, unit: 'kg' },
+  },
+
+  {
+    key: 'engine_mark',
+    label: 'Engine mark',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Engine, Gearbox',
+    order: 2000,
+    dataSource: 'static',
+    staticOptions: [
+      { value: 'cummins', label: 'Cummins' },
+      { value: 'deutz', label: 'Deutz' },
+      { value: 'perkins', label: 'Perkins' },
+      { value: 'man', label: 'MAN' },
+      { value: 'mercedes', label: 'Mercedes-Benz' },
+      { value: 'other', label: 'Other' },
+    ],
+  },
+  {
+    key: 'engine_model',
+    label: 'Engine model',
+    type: 'TEXT',
+    component: 'text',
+    group: 'Engine, Gearbox',
+    order: 2010,
+  },
+  {
+    key: 'fuel',
+    label: 'Fuel',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Engine, Gearbox',
+    order: 2020,
     dataSource: 'static',
     staticOptions: [
       { value: 'diesel', label: 'Diesel' },
@@ -42,41 +328,63 @@ const DEFAULT_ENGINE_BLOCK_FIELDS = [
       { value: 'electric', label: 'Electric' },
       { value: 'hybrid', label: 'Hybrid' },
       { value: 'lpg', label: 'LPG' },
+      { value: 'cng', label: 'CNG' },
     ],
   },
   {
-    key: 'power_hp',
+    key: 'turbo',
+    label: 'Turbo',
+    type: 'BOOLEAN',
+    component: 'checkbox',
+    group: 'Engine, Gearbox',
+    order: 2030,
+  },
+  {
+    key: 'intercooler',
+    label: 'Intercooler',
+    type: 'BOOLEAN',
+    component: 'checkbox',
+    group: 'Engine, Gearbox',
+    order: 2040,
+  },
+  {
+    key: 'power',
     label: 'Power',
+    type: 'NUMBER',
     component: 'number',
-    required: false,
-    group: 'Engine',
-    order: 1010,
-    validationRules: { min: 1, max: 5000, unit: 'hp' },
+    group: 'Engine, Gearbox',
+    order: 2050,
+    validationRules: { min: 1, max: 5000 },
   },
   {
-    key: 'engine_displacement_cm3',
-    label: 'Engine displacement',
-    component: 'number',
-    required: false,
-    group: 'Engine',
-    order: 1020,
-    validationRules: { min: 1, max: 100000, unit: 'cm3' },
+    key: 'power_unit',
+    label: 'Power unit',
+    type: 'RADIO',
+    component: 'radio',
+    group: 'Engine, Gearbox',
+    order: 2060,
+    dataSource: 'static',
+    staticOptions: [
+      { value: 'hp', label: 'HP' },
+      { value: 'kw', label: 'kW' },
+    ],
   },
   {
-    key: 'engine_model',
-    label: 'Engine model',
-    component: 'text',
-    required: false,
-    group: 'Engine',
-    order: 1030,
+    key: 'engine_volume_cm3',
+    label: 'Engine volume',
+    type: 'NUMBER',
+    component: 'number',
+    group: 'Engine, Gearbox',
+    order: 2070,
+    validationRules: { min: 1, max: 100000, unit: 'cm3' },
   },
   {
-    key: 'emission_class',
-    label: 'Emission class',
-    component: 'select',
-    required: false,
-    group: 'Engine',
-    order: 1040,
+    key: 'euro',
+    label: 'Euro',
+    type: 'RADIO',
+    component: 'radio',
+    group: 'Engine, Gearbox',
+    order: 2080,
     dataSource: 'static',
     staticOptions: [
       { value: 'euro_1', label: 'Euro 1' },
@@ -85,8 +393,243 @@ const DEFAULT_ENGINE_BLOCK_FIELDS = [
       { value: 'euro_4', label: 'Euro 4' },
       { value: 'euro_5', label: 'Euro 5' },
       { value: 'euro_6', label: 'Euro 6' },
-      { value: 'tier_4', label: 'Tier 4' },
-      { value: 'stage_v', label: 'Stage V' },
+      { value: 'euro_7', label: 'Euro 7' },
+    ],
+  },
+  {
+    key: 'particulate_filter',
+    label: 'Particulate filter',
+    type: 'BOOLEAN',
+    component: 'checkbox',
+    group: 'Engine, Gearbox',
+    order: 2090,
+  },
+  {
+    key: 'eev',
+    label: 'EEV',
+    type: 'BOOLEAN',
+    component: 'checkbox',
+    group: 'Engine, Gearbox',
+    order: 2100,
+  },
+  {
+    key: 'fuel_consumption',
+    label: 'Fuel consumption',
+    type: 'NUMBER',
+    component: 'number',
+    group: 'Engine, Gearbox',
+    order: 2110,
+    validationRules: { min: 0, max: 500 },
+  },
+  {
+    key: 'fuel_consumption_unit',
+    label: 'Fuel consumption unit',
+    type: 'RADIO',
+    component: 'radio',
+    group: 'Engine, Gearbox',
+    order: 2120,
+    dataSource: 'static',
+    staticOptions: [
+      { value: 'l_100km', label: 'l/100km' },
+      { value: 'l_h', label: 'l/h' },
+    ],
+  },
+  {
+    key: 'gearbox_type',
+    label: 'Gearbox type',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Engine, Gearbox',
+    order: 2130,
+    dataSource: 'static',
+    staticOptions: [
+      { value: 'manual', label: 'Manual' },
+      { value: 'automatic', label: 'Automatic' },
+      { value: 'semi_automatic', label: 'Semi-automatic' },
+      { value: 'cvt', label: 'CVT' },
+    ],
+  },
+  {
+    key: 'reverse_gear',
+    label: 'Reverse gear',
+    type: 'BOOLEAN',
+    component: 'checkbox',
+    group: 'Engine, Gearbox',
+    order: 2140,
+  },
+  {
+    key: 'number_of_gears',
+    label: 'Number of gears',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Engine, Gearbox',
+    order: 2150,
+    dataSource: 'static',
+    staticOptions: [
+      { value: '4', label: '4' },
+      { value: '5', label: '5' },
+      { value: '6', label: '6' },
+      { value: '7', label: '7' },
+      { value: '8', label: '8' },
+      { value: '9', label: '9' },
+      { value: '10', label: '10' },
+      { value: '12', label: '12' },
+      { value: '16', label: '16' },
+    ],
+  },
+  {
+    key: 'gearbox_brand',
+    label: 'Gearbox brand',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Engine, Gearbox',
+    order: 2160,
+    dataSource: 'static',
+    staticOptions: [
+      { value: 'zf', label: 'ZF' },
+      { value: 'aisin', label: 'Aisin' },
+      { value: 'allison', label: 'Allison' },
+      { value: 'eaton', label: 'Eaton' },
+      { value: 'other', label: 'Other' },
+    ],
+  },
+  {
+    key: 'gearbox_model',
+    label: 'Gearbox model',
+    type: 'TEXT',
+    component: 'text',
+    group: 'Engine, Gearbox',
+    order: 2170,
+  },
+  {
+    key: 'drive_type',
+    label: 'Drive type',
+    type: 'RADIO',
+    component: 'radio',
+    group: 'Engine, Gearbox',
+    order: 2180,
+    dataSource: 'static',
+    staticOptions: [
+      { value: 'awd', label: 'All-Wheel Drive' },
+      { value: 'fwd', label: 'Front-Wheel Drive' },
+      { value: 'rwd', label: 'Rear-Wheel Drive' },
+    ],
+  },
+
+  {
+    key: 'axle_configuration',
+    label: 'Axle configuration',
+    type: 'SELECT',
+    component: 'select',
+    group: 'Axles, Brakes',
+    order: 3000,
+    dataSource: 'static',
+    staticOptions: [
+      { value: '4x2', label: '4x2' },
+      { value: '4x4', label: '4x4' },
+      { value: '6x2', label: '6x2' },
+      { value: '6x4', label: '6x4' },
+      { value: '6x6', label: '6x6' },
+      { value: '8x4', label: '8x4' },
+      { value: '8x8', label: '8x8' },
+    ],
+  },
+  {
+    key: 'tyre_size',
+    label: 'Tyre size',
+    type: 'TEXT',
+    component: 'text',
+    group: 'Axles, Brakes',
+    order: 3010,
+  },
+  {
+    key: 'tyre_condition_percent',
+    label: 'Tyre condition',
+    type: 'NUMBER',
+    component: 'number',
+    group: 'Axles, Brakes',
+    order: 3020,
+    validationRules: { min: 0, max: 100, unit: '%' },
+  },
+  {
+    key: 'tyre_condition_mm',
+    label: 'Tyre condition (tread)',
+    type: 'NUMBER',
+    component: 'number',
+    group: 'Axles, Brakes',
+    order: 3030,
+    validationRules: { min: 0, max: 120, unit: 'mm' },
+  },
+  {
+    key: 'enter_by_axles',
+    label: 'Enter by axles',
+    type: 'BOOLEAN',
+    component: 'checkbox',
+    group: 'Axles, Brakes',
+    order: 3040,
+  },
+
+  {
+    key: 'air_conditioning',
+    label: 'Air conditioning',
+    type: 'BOOLEAN',
+    component: 'checkbox',
+    group: 'Additional Options',
+    order: 4000,
+  },
+  {
+    key: 'air_conditioning_type',
+    label: 'Air conditioning type',
+    type: 'RADIO',
+    component: 'radio',
+    group: 'Additional Options',
+    order: 4010,
+    dataSource: 'static',
+    visibleIf: { field: 'air_conditioning', op: 'eq', value: 'true' },
+    requiredIf: { field: 'air_conditioning', op: 'eq', value: 'true' },
+    staticOptions: [
+      { value: 'climate_control', label: 'Climate control' },
+      { value: 'dual_zone', label: 'Dual-zone' },
+      { value: 'multi_zone', label: 'Multi-zone' },
+    ],
+  },
+  {
+    key: 'powered_windows',
+    label: 'Powered windows',
+    type: 'BOOLEAN',
+    component: 'checkbox',
+    group: 'Additional Options',
+    order: 4020,
+  },
+  {
+    key: 'powered_windows_scope',
+    label: 'Powered windows scope',
+    type: 'RADIO',
+    component: 'radio',
+    group: 'Additional Options',
+    order: 4030,
+    dataSource: 'static',
+    visibleIf: { field: 'powered_windows', op: 'eq', value: 'true' },
+    requiredIf: { field: 'powered_windows', op: 'eq', value: 'true' },
+    staticOptions: [
+      { value: 'front', label: 'Front' },
+      { value: 'front_rear', label: 'Front and rear' },
+    ],
+  },
+  {
+    key: 'interior_material',
+    label: 'Interior material',
+    type: 'CHECKBOX_GROUP',
+    component: 'checkbox',
+    group: 'Additional Options',
+    order: 4040,
+    dataSource: 'static',
+    staticOptions: [
+      { value: 'alcantara', label: 'Alcantara' },
+      { value: 'faux_leather', label: 'Faux leather' },
+      { value: 'leather', label: 'Leather' },
+      { value: 'fabric', label: 'Fabric' },
+      { value: 'velour', label: 'Velour' },
     ],
   },
 ];
@@ -174,9 +717,9 @@ export function sanitizeFieldPayload(inputField: any, index: number) {
     fieldType: normalizedType,
     required: Boolean(
       inputField.required ??
-        inputField.isRequired ??
-        inputField.baseRequired ??
-        false,
+      inputField.isRequired ??
+      inputField.baseRequired ??
+      false,
     ),
     sortOrder,
     section,
@@ -210,16 +753,18 @@ export function mapFieldToResponse(rawField: RawField) {
     'text'
   ).toLowerCase();
 
-  const dataSource = config.dataSource ?? (options.length > 0 ? 'static' : 'api');
+  const dataSource =
+    config.dataSource ?? (options.length > 0 ? 'static' : 'api');
   const staticOptions =
     dataSource === 'static'
-      ? (Array.isArray(config.staticOptions) ? config.staticOptions : options).map(
-          (option: any, index: number) => ({
-            id: option.id ? String(option.id) : `${index}`,
-            value: String(option.value),
-            label: String(option.label),
-          }),
-        )
+      ? (Array.isArray(config.staticOptions)
+          ? config.staticOptions
+          : options
+        ).map((option: any, index: number) => ({
+          id: option.id ? String(option.id) : `${index}`,
+          value: String(option.value),
+          label: String(option.label),
+        }))
       : [];
 
   return {
@@ -253,9 +798,9 @@ export function mapFieldToResponse(rawField: RawField) {
 export function getBuiltInEngineBlock(): RawBlock {
   return {
     id: 'engine_block',
-    name: 'Engine Block',
+    name: 'Motorized Vehicle Block',
     isSystem: true,
-    fields: DEFAULT_ENGINE_BLOCK_FIELDS,
+    fields: DEFAULT_MOTORIZED_BLOCK_FIELDS,
   };
 }
 
@@ -287,12 +832,14 @@ export function mergeTemplateFieldsWithBlocks(
         visibilityIf: normalized.visibilityIf,
         requiredIf: normalized.requiredIf,
         config: normalized.config,
-        options: (normalized.staticOptions ?? []).map((option, optionIndex) => ({
-          id: `${block.id}:${normalized.fieldKey}:${optionIndex}`,
-          value: option.value,
-          label: option.label,
-          sortOrder: optionIndex,
-        })),
+        options: (normalized.staticOptions ?? []).map(
+          (option, optionIndex) => ({
+            id: `${block.id}:${normalized.fieldKey}:${optionIndex}`,
+            value: option.value,
+            label: option.label,
+            sortOrder: optionIndex,
+          }),
+        ),
       });
     }),
   );
@@ -306,4 +853,3 @@ export function mergeTemplateFieldsWithBlocks(
     (a, b) => (a.order ?? 0) - (b.order ?? 0),
   );
 }
-
diff --git a/api/src/upload/upload.controller.ts b/api/src/upload/upload.controller.ts
index e4b0fea..6d23d6c 100644
--- a/api/src/upload/upload.controller.ts
+++ b/api/src/upload/upload.controller.ts
@@ -1,11 +1,15 @@
 import {
   BadRequestException,
   Controller,
+  Header,
   Get,
   Headers,
+  Param,
   Post,
   Query,
   Req,
+  Res,
+  StreamableFile,
   UseGuards,
   UseInterceptors,
   UploadedFiles,
@@ -13,6 +17,7 @@ import {
 import { FilesInterceptor } from '@nestjs/platform-express';
 import { Throttle } from '@nestjs/throttler';
 import type { Request } from 'express';
+import type { Response } from 'express';
 import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
 import { UploadService } from './upload.service';
 
@@ -67,7 +72,11 @@ export class UploadController {
       clientKey,
     );
     const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
-    this.uploadService.enforceUploadQuota(actor.actorKey, files.length, totalBytes);
+    this.uploadService.enforceUploadQuota(
+      actor.actorKey,
+      files.length,
+      totalBytes,
+    );
 
     for (const file of files) {
       if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
@@ -77,7 +86,10 @@ export class UploadController {
       }
 
       const detectedMime = this.uploadService.detectImageMime(file.buffer);
-      if (!detectedMime || !this.uploadService.isAllowedImageMime(detectedMime)) {
+      if (
+        !detectedMime ||
+        !this.uploadService.isAllowedImageMime(detectedMime)
+      ) {
         throw new BadRequestException(
           'Invalid file signature. Only JPEG, PNG, WEBP, GIF are allowed.',
         );
@@ -90,15 +102,36 @@ export class UploadController {
       }
     }
 
-    const urls = await Promise.all(
+    const uploaded = await Promise.all(
       files.map((file) =>
         this.uploadService.uploadFile(file, 'listings', file.mimetype),
       ),
     );
 
+    const origin = `${req.protocol}://${req.get('host')}`;
+    const urls = uploaded.map(({ key }) => `${origin}/upload/files/${key}`);
+
     return { urls };
   }
 
+  @Get('files/:folder/:filename')
+  @Header('Cache-Control', 'public, max-age=31536000, immutable')
+  async getFile(
+    @Param('folder') folder: string,
+    @Param('filename') filename: string,
+    @Res({ passthrough: true }) res: Response,
+  ) {
+    const { body, contentType, contentLength } =
+      await this.uploadService.getFileStream(folder, filename);
+
+    res.setHeader('Content-Type', contentType);
+    if (contentLength !== undefined) {
+      res.setHeader('Content-Length', String(contentLength));
+    }
+
+    return new StreamableFile(body);
+  }
+
   @Get('presigned')
   @UseGuards(JwtAuthGuard)
   getPresignedUrl(
diff --git a/api/src/upload/upload.security.spec.ts b/api/src/upload/upload.security.spec.ts
index 8098e69..c909e71 100644
--- a/api/src/upload/upload.security.spec.ts
+++ b/api/src/upload/upload.security.spec.ts
@@ -1,4 +1,8 @@
-import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
+import {
+  HttpException,
+  HttpStatus,
+  UnauthorizedException,
+} from '@nestjs/common';
 import { UploadService } from './upload.service';
 
 describe('UploadService security controls', () => {
@@ -52,11 +56,7 @@ describe('UploadService security controls', () => {
     });
 
     expect(() =>
-      service.resolveUploadActor(
-        undefined,
-        'guest-token',
-        '198.51.100.20',
-      ),
+      service.resolveUploadActor(undefined, 'guest-token', '198.51.100.20'),
     ).toThrow(UnauthorizedException);
   });
 
diff --git a/api/src/upload/upload.service.ts b/api/src/upload/upload.service.ts
index 210f1b2..cc998ee 100644
--- a/api/src/upload/upload.service.ts
+++ b/api/src/upload/upload.service.ts
@@ -16,9 +16,11 @@ import {
   CreateBucketCommand,
   HeadBucketCommand,
   PutBucketPolicyCommand,
+  GetObjectCommand,
 } from '@aws-sdk/client-s3';
 import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
 import { randomUUID } from 'crypto';
+import { Readable } from 'stream';
 
 const RATE_WINDOW_MS = 60_000;
 const ALLOWED_IMAGE_MIME_TYPES = [
@@ -88,9 +90,8 @@ export class UploadService implements OnModuleInit {
     this.guestTokenTtlSeconds =
       this.configService.get<number>('upload.guestTokenTtlSeconds') ?? 900;
     this.guestTokenRateLimitPerMinute =
-      this.configService.get<number>(
-        'upload.guestTokenRateLimitPerMinute',
-      ) ?? 10;
+      this.configService.get<number>('upload.guestTokenRateLimitPerMinute') ??
+      10;
     this.requestLimitPerMinute =
       this.configService.get<number>('upload.requestLimitPerMinute') ?? 15;
     this.filesLimitPerMinute =
@@ -369,7 +370,7 @@ export class UploadService implements OnModuleInit {
     file: Express.Multer.File,
     folder: string = 'images',
     detectedMimeType?: string,
-  ): Promise<string> {
+  ): Promise<{ key: string; url: string }> {
     const safeFolder = this.sanitizeFolder(folder);
     const mimeType = detectedMimeType
       ? this.normalizeImageMime(detectedMimeType)
@@ -390,7 +391,10 @@ export class UploadService implements OnModuleInit {
       }),
     );
 
-    return `${this.publicUrl}/${key}`;
+    return {
+      key,
+      url: `${this.publicUrl}/${key}`,
+    };
   }
 
   async deleteFile(url: string): Promise<void> {
@@ -426,6 +430,33 @@ export class UploadService implements OnModuleInit {
     };
   }
 
+  async getFileStream(folder: string, filename: string) {
+    const safeFolder = this.sanitizeFolder(folder);
+    const safeFilename = filename.trim();
+
+    if (!/^[A-Za-z0-9._-]+$/.test(safeFilename)) {
+      throw new BadRequestException('Invalid file name');
+    }
+
+    const key = `${safeFolder}/${safeFilename}`;
+    const response = await this.s3.send(
+      new GetObjectCommand({
+        Bucket: this.bucket,
+        Key: key,
+      }),
+    );
+
+    if (!response.Body) {
+      throw new BadRequestException('File not found');
+    }
+
+    return {
+      body: response.Body as Readable,
+      contentType: response.ContentType ?? 'application/octet-stream',
+      contentLength: response.ContentLength ?? undefined,
+    };
+  }
+
   private parseBearerToken(authorizationHeader: string | undefined) {
     if (!authorizationHeader) return null;
     const prefix = 'bearer ';
diff --git a/docs/AD.MD b/docs/AD.MD
index d183d47..48cd217 100644
--- a/docs/AD.MD
+++ b/docs/AD.MD
@@ -162,6 +162,7 @@ web/src/components/listings/
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
diff --git a/docs/ADMIN.MD b/docs/ADMIN.MD
index 95fc470..a19cd96 100644
--- a/docs/ADMIN.MD
+++ b/docs/ADMIN.MD
@@ -151,6 +151,7 @@ Updated `web/src/app/admin/layout.tsx` to include sidebar links:
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
diff --git a/docs/CLAUDE.md b/docs/CLAUDE.md
index a4cbafb..6f878a5 100644
--- a/docs/CLAUDE.md
+++ b/docs/CLAUDE.md
@@ -903,6 +903,7 @@ cd api && npx nest build
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
diff --git a/docs/DB_ER_DIAGRAM.MD b/docs/DB_ER_DIAGRAM.MD
index 82f7bad..b8499ab 100644
--- a/docs/DB_ER_DIAGRAM.MD
+++ b/docs/DB_ER_DIAGRAM.MD
@@ -240,6 +240,7 @@ erDiagram
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
diff --git a/docs/README.md b/docs/README.md
index 4b3365e..c40e9b7 100644
--- a/docs/README.md
+++ b/docs/README.md
@@ -168,7 +168,20 @@ For more information, please refer to the detailed documentation files listed ab
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
 - Completed validation checks and build/test verification; local infrastructure (Postgres/Redis/MinIO) confirmed working for this flow.
+
+## Update - 2026-02-23 (Listing Experience + Media Stability)
+- Listing detail page redesigned to a professional marketplace structure with improved animation and section flow.
+- Dynamic form values are now consistently displayed in listing details (with template option label mapping and grouped accordion sections).
+- Pricing and details cleanup:
+  - request-price cases render correctly
+  - placeholder-only descriptions are hidden from public listing details.
+- Upload/media reliability improvements:
+  - added API-backed file serving route (`/upload/files/:folder/:filename`)
+  - upload endpoint now returns stable API URLs
+  - frontend normalizes older MinIO URLs into API file URLs
+  - added client-side type/size validation for image uploads.
diff --git a/docs/plan.md b/docs/plan.md
index 062800f..f1e5e6b 100644
--- a/docs/plan.md
+++ b/docs/plan.md
@@ -1,5 +1,25 @@
 # Marketplace Ad-Posting System Plan
 
+## Execution Update - 2026-02-23
+
+- Completed a production-focused pass on listing detail UX and data fidelity for Autoline-style categories.
+- Implemented full detail-page UI refinement:
+  - professional 3-column listing hero layout
+  - animated section cards
+  - accordion characteristics aligned to form-building groups.
+- Closed data display gaps between form submission and public listing view:
+  - normalized backend attribute payloads into display-ready attributes
+  - mapped dynamic option values to human-readable labels
+  - ensured summary card uses real listing data and filled characteristics.
+- Implemented pricing/details cleanup:
+  - consistent request-price rendering
+  - filtered placeholder description values from display output.
+- Stabilized media delivery for uploaded listing photos:
+  - added API proxy route for uploaded files (`/upload/files/:folder/:filename`)
+  - switched upload response URLs to API-served paths
+  - added frontend URL normalization for previously uploaded MinIO URLs
+  - added upload pre-validation (mime + max size).
+
 ## 1. Product Scope and UX Flow
 
 ### A. Entry
@@ -336,6 +356,7 @@ CREATE TABLE listing_wizard_state (
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
diff --git a/docs/production-test.md b/docs/production-test.md
index 3ad04d2..ca38389 100644
--- a/docs/production-test.md
+++ b/docs/production-test.md
@@ -140,6 +140,7 @@ This is the best approach because it catches issues early, then validates real-w
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
diff --git a/docs/project_status.md b/docs/project_status.md
index d5ffbe0..6a9d614 100644
--- a/docs/project_status.md
+++ b/docs/project_status.md
@@ -153,7 +153,32 @@ The API is failing to start due to two critical issues identified from the termi
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
 - Completed validation checks and build/test verification; local infrastructure (Postgres/Redis/MinIO) confirmed working for this flow.
+
+## 5. Update - 2026-02-23 (Listing UI + Attributes + Media Reliability)
+
+- Restored and stabilized Category Autoline listing details rendering so submitted dynamic form values are visible in the ad view.
+- Upgraded listing details page structure to a professional marketplace layout:
+  - 3-column hero area (summary/price, gallery, seller contacts)
+  - sectioned details cards
+  - accordion-based characteristics that mirror form sections
+  - improved motion/visual polish (animated expansion, staged reveal, hover states).
+- Fixed value-label mapping for template options so displayed characteristics match selected dropdown labels.
+- Improved summary behavior:
+  - shows meaningful listing data and top filled characteristics
+  - no placeholder-only rows where avoidable.
+- Fixed pricing display fallback behavior:
+  - `ON_REQUEST` and missing amount now consistently render as request-based pricing text instead of generic placeholders.
+- Cleaned details output by suppressing placeholder descriptions (`-`, `—`, `n/a`, `none`, `null`).
+- Hardened media pipeline end-to-end:
+  - added API-backed media serving route `GET /upload/files/:folder/:filename`
+  - upload endpoint now returns stable API URLs
+  - frontend normalizes legacy MinIO URLs to API file URLs
+  - added client-side upload validation (allowed mime types and 10MB/file limit).
+- Verification completed:
+  - `api`: `pnpm build` passing
+  - `web`: eslint passing for changed files (`listing-detail.tsx`, `price-display.tsx`, `media-uploader.tsx`, `lib/api.ts`).
diff --git a/docs/secret-rotation-runbook.md b/docs/secret-rotation-runbook.md
index 0f192d9..9b5450a 100644
--- a/docs/secret-rotation-runbook.md
+++ b/docs/secret-rotation-runbook.md
@@ -52,6 +52,7 @@ This runbook covers rotation for:
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
diff --git a/docs/security-hardening.md b/docs/security-hardening.md
index 743249d..023e2b7 100644
--- a/docs/security-hardening.md
+++ b/docs/security-hardening.md
@@ -606,6 +606,7 @@ This document turns the current security review into an implementation backlog w
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
diff --git a/docs/security-signoff-evidence.md b/docs/security-signoff-evidence.md
index 31b64be..0503c04 100644
--- a/docs/security-signoff-evidence.md
+++ b/docs/security-signoff-evidence.md
@@ -38,6 +38,7 @@ This document captures the evidence required by `docs/security-hardening.md` for
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
diff --git a/docs/task.md b/docs/task.md
index 194cfd6..51b97b5 100644
--- a/docs/task.md
+++ b/docs/task.md
@@ -61,7 +61,23 @@
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
 - Completed validation checks and build/test verification; local infrastructure (Postgres/Redis/MinIO) confirmed working for this flow.
+
+## Update - 2026-02-23 (Listing Detail Delivery)
+- Listing detail now renders submitted dynamic attributes reliably (including section grouping + option label resolution).
+- Listing detail page redesigned into marketplace-style structure with animated accordion characteristics.
+- Price fallback logic updated to avoid placeholder dash output and align with request-price scenarios.
+- Description normalization added to suppress placeholder content values (`-`, `—`, `n/a`, `none`, `null`).
+- Upload reliability improvements delivered:
+  - API file proxy route for uploaded assets
+  - upload response now returns API-backed asset URLs
+  - frontend media URL normalization for existing listings
+  - stricter client-side image type/size validation before upload.
+
+## Test Status (Latest)
+- 2026-02-23: `api` build passing (`pnpm build`)
+- 2026-02-23: `web` eslint passing for changed listing/media files
diff --git a/docs/translation-privacy-policy.md b/docs/translation-privacy-policy.md
index 620b136..ee3f2fa 100644
--- a/docs/translation-privacy-policy.md
+++ b/docs/translation-privacy-policy.md
@@ -38,6 +38,7 @@ This policy defines what text is allowed to be sent to external translation prov
 
 ## Update - 2026-02-17 (Fix_download)
 - Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
+- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
 - Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
 - Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
 - Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
diff --git a/web/src/app/admin/templates/builder/page.tsx b/web/src/app/admin/templates/builder/page.tsx
index 618cb38..410ab2a 100644
--- a/web/src/app/admin/templates/builder/page.tsx
+++ b/web/src/app/admin/templates/builder/page.tsx
@@ -24,7 +24,7 @@ import {
     SelectTrigger,
     SelectValue,
 } from '@/components/ui/select';
-import { Plus, Save, Trash } from 'lucide-react';
+import { ChevronDown, Plus, Save, Trash } from 'lucide-react';
 import { useRouter, useSearchParams } from 'next/navigation';
 import type { TemplateBlockSchema } from '@/lib/schemaTypes';
 
@@ -48,6 +48,9 @@ export default function AdminTemplatesPage() {
     const [newBlockName, setNewBlockName] = useState('');
 
     const [isLoading, setIsLoading] = useState(false);
+    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
+    const [collapsedFields, setCollapsedFields] = useState<Record<number, boolean>>({});
+    const [collapsedAdvancedFields, setCollapsedAdvancedFields] = useState<Record<number, boolean>>({});
 
     const router = useRouter();
     const searchParams = useSearchParams();
@@ -71,10 +74,18 @@ export default function AdminTemplatesPage() {
         setFields([]);
         setSections([DEFAULT_SECTION]);
         setSelectedBlockIds([]);
+        setCollapsedSections({});
+        setCollapsedFields({});
+        setCollapsedAdvancedFields({});
     };
 
     const applyTemplateToEditor = (template: FormTemplate) => {
-        const loadedFields: Partial<FormField>[] = (template.fields ?? []).map((field) => ({
+        const sourceFields =
+            template.fields && template.fields.length > 0
+                ? template.fields
+                : (template.resolvedFields ?? []);
+
+        const loadedFields: Partial<FormField>[] = sourceFields.map((field) => ({
             id: field.id,
             key: field.key,
             label: field.label,
@@ -103,8 +114,27 @@ export default function AdminTemplatesPage() {
         setTemplateName(`Template v${template.version}`);
         setSelectedCategory(template.categoryId.toString());
         setFields(loadedFields);
-        setSections(getSectionsFromFields(loadedFields));
+        const nextSections = getSectionsFromFields(loadedFields);
+        setSections(nextSections);
         setSelectedBlockIds(template.blockIds ?? []);
+        setCollapsedSections(
+            nextSections.reduce<Record<string, boolean>>((acc, section, index) => {
+                acc[section] = index > 0;
+                return acc;
+            }, {}),
+        );
+        setCollapsedFields(
+            loadedFields.reduce<Record<number, boolean>>((acc, _field, index) => {
+                acc[index] = false;
+                return acc;
+            }, {}),
+        );
+        setCollapsedAdvancedFields(
+            loadedFields.reduce<Record<number, boolean>>((acc, _field, index) => {
+                acc[index] = true;
+                return acc;
+            }, {}),
+        );
     };
 
     const findPath = (nodes: CategoryNode[], targetId: string): string[] | null => {
@@ -229,6 +259,7 @@ export default function AdminTemplatesPage() {
         const name = prompt('Enter section name (e.g., Engine Options, Dimensions):');
         if (name && !sections.includes(name)) {
             setSections([...sections, name]);
+            setCollapsedSections((prev) => ({ ...prev, [name]: false }));
         }
     }
 
@@ -236,10 +267,18 @@ export default function AdminTemplatesPage() {
         if (confirm(`Delete section "${sectionName}" and all its fields?`)) {
             setSections(sections.filter((section) => section !== sectionName));
             setFields(fields.filter((field) => field.section !== sectionName));
+            setCollapsedSections((prev) => {
+                const next = { ...prev };
+                delete next[sectionName];
+                return next;
+            });
         }
     }
 
     function addField(section: string) {
+        const nextIndex = fields.length;
+        setCollapsedFields((prev) => ({ ...prev, [nextIndex]: false }));
+        setCollapsedAdvancedFields((prev) => ({ ...prev, [nextIndex]: true }));
         setFields([
             ...fields,
             {
@@ -269,6 +308,45 @@ export default function AdminTemplatesPage() {
 
     function removeField(index: number) {
         setFields(fields.filter((_, fieldIndex) => fieldIndex !== index));
+        setCollapsedFields((prev) => {
+            const next: Record<number, boolean> = {};
+            Object.entries(prev).forEach(([rawKey, value]) => {
+                const key = Number(rawKey);
+                if (key < index) next[key] = value;
+                if (key > index) next[key - 1] = value;
+            });
+            return next;
+        });
+        setCollapsedAdvancedFields((prev) => {
+            const next: Record<number, boolean> = {};
+            Object.entries(prev).forEach(([rawKey, value]) => {
+                const key = Number(rawKey);
+                if (key < index) next[key] = value;
+                if (key > index) next[key - 1] = value;
+            });
+            return next;
+        });
+    }
+
+    function toggleSection(section: string) {
+        setCollapsedSections((prev) => ({
+            ...prev,
+            [section]: !prev[section],
+        }));
+    }
+
+    function toggleField(index: number) {
+        setCollapsedFields((prev) => ({
+            ...prev,
+            [index]: !prev[index],
+        }));
+    }
+
+    function toggleAdvancedField(index: number) {
+        setCollapsedAdvancedFields((prev) => ({
+            ...prev,
+            [index]: !prev[index],
+        }));
     }
 
     function addOption(fieldIndex: number) {
@@ -598,10 +676,26 @@ export default function AdminTemplatesPage() {
                         </div>
                     )}
 
-                    {sections.map((section) => (
+                    {sections.map((section) => {
+                        const sectionFields = fields.filter((field) => field.section === section);
+                        const isSectionCollapsed = Boolean(collapsedSections[section]);
+
+                        return (
                         <div key={section} className="glass-card rounded-xl border border-white/10 overflow-hidden">
                             <div className="bg-white/5 p-4 flex justify-between items-center border-b border-white/10">
-                                <h3 className="font-bold text-white">{section}</h3>
+                                <button
+                                    type="button"
+                                    onClick={() => toggleSection(section)}
+                                    className="flex items-center gap-2 text-left text-white font-bold"
+                                >
+                                    <ChevronDown
+                                        className={`h-4 w-4 transition-transform ${isSectionCollapsed ? '-rotate-90' : 'rotate-0'}`}
+                                    />
+                                    <span>{section}</span>
+                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted-foreground">
+                                        {sectionFields.length}
+                                    </span>
+                                </button>
                                 <Button
                                     variant="ghost"
                                     size="sm"
@@ -612,18 +706,56 @@ export default function AdminTemplatesPage() {
                                 </Button>
                             </div>
 
-                            <div className="p-4 space-y-4 bg-black/20">
+                            <div
+                                className={`p-4 space-y-4 bg-black/20 overflow-hidden transition-all duration-300 ease-out ${
+                                    isSectionCollapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-[5000px] opacity-100'
+                                }`}
+                            >
                                 {fields
                                     .map((field, index) => ({ ...field, originalIndex: index }))
                                     .filter((field) => field.section === section)
                                     .map((field) => {
                                         const index = field.originalIndex;
+                                        const isFieldCollapsed = Boolean(collapsedFields[index]);
+                                        const isAdvancedCollapsed = Boolean(collapsedAdvancedFields[index]);
                                         return (
                                             <div
                                                 key={index}
-                                                className="group relative bg-card/80 hover:bg-card border border-white/5 hover:border-blue-500/50 rounded-xl p-6 transition-all duration-200"
+                                                className="group relative bg-card/80 hover:bg-card border border-white/5 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200"
                                             >
-                                                <div className="pl-2 space-y-6">
+                                                <div className="flex items-center justify-between gap-3">
+                                                    <button
+                                                        type="button"
+                                                        onClick={() => toggleField(index)}
+                                                        className="flex items-center gap-2 text-left min-w-0"
+                                                    >
+                                                        <ChevronDown
+                                                            className={`h-4 w-4 transition-transform ${isFieldCollapsed ? '-rotate-90' : 'rotate-0'}`}
+                                                        />
+                                                        <span className="truncate text-sm font-semibold text-white">
+                                                            {field.label || 'Untitled field'}
+                                                        </span>
+                                                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
+                                                            {field.type || 'TEXT'}
+                                                        </span>
+                                                    </button>
+                                                    <Button
+                                                        variant="ghost"
+                                                        size="sm"
+                                                        className="text-muted-foreground hover:text-red-400 hover:bg-red-950/20"
+                                                        onClick={() => removeField(index)}
+                                                    >
+                                                        <Trash className="w-4 h-4 mr-2" />
+                                                        Remove
+                                                    </Button>
+                                                </div>
+
+                                                <div
+                                                    className={`pl-2 mt-4 overflow-hidden border-t border-white/5 transition-all duration-300 ease-out ${
+                                                        isFieldCollapsed ? 'max-h-0 opacity-0 pt-0' : 'max-h-[4200px] opacity-100 pt-4'
+                                                    }`}
+                                                >
+                                                    <div className="space-y-6">
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                         <div className="space-y-2">
                                                             <Label className="text-xs uppercase text-muted-foreground">Field Label</Label>
@@ -714,147 +846,171 @@ export default function AdminTemplatesPage() {
                                                         </div>
                                                     </div>
 
-                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
-                                                        <div className="space-y-2">
-                                                            <Label className="text-xs uppercase text-muted-foreground">Depends On</Label>
-                                                            <div className="rounded-lg border border-white/10 p-2 max-h-28 overflow-y-auto">
-                                                                {fields
-                                                                    .map((candidate, candidateIndex) => ({
-                                                                        key: candidate.key,
-                                                                        label: candidate.label,
-                                                                        candidateIndex,
-                                                                    }))
-                                                                    .filter((candidate) => candidate.candidateIndex !== index && candidate.key)
-                                                                    .map((candidate) => {
-                                                                        const dependsOn = (field.dependsOn as string[]) || [];
-                                                                        const checked = dependsOn.includes(candidate.key as string);
-                                                                        return (
-                                                                            <label
-                                                                                key={`${index}-${candidate.key}`}
-                                                                                className="flex items-center gap-2 text-xs text-white/90 py-0.5"
-                                                                            >
-                                                                                <input
-                                                                                    type="checkbox"
-                                                                                    checked={checked}
-                                                                                    onChange={(event) => {
-                                                                                        const next = new Set(dependsOn);
-                                                                                        if (event.target.checked) next.add(candidate.key as string);
-                                                                                        else next.delete(candidate.key as string);
-                                                                                        updateField(index, { dependsOn: Array.from(next) });
-                                                                                    }}
-                                                                                />
-                                                                                <span>{candidate.label || candidate.key}</span>
-                                                                            </label>
-                                                                        );
-                                                                    })}
-                                                            </div>
-                                                        </div>
-                                                        <div className="space-y-2">
-                                                            <Label className="text-xs uppercase text-muted-foreground">Reset On Change</Label>
-                                                            <div className="rounded-lg border border-white/10 p-2 max-h-28 overflow-y-auto">
-                                                                {fields
-                                                                    .map((candidate, candidateIndex) => ({
-                                                                        key: candidate.key,
-                                                                        label: candidate.label,
-                                                                        candidateIndex,
-                                                                    }))
-                                                                    .filter((candidate) => candidate.candidateIndex !== index && candidate.key)
-                                                                    .map((candidate) => {
-                                                                        const resetOnChange = (field.resetOnChange as string[]) || [];
-                                                                        const checked = resetOnChange.includes(candidate.key as string);
-                                                                        return (
-                                                                            <label
-                                                                                key={`reset-${index}-${candidate.key}`}
-                                                                                className="flex items-center gap-2 text-xs text-white/90 py-0.5"
-                                                                            >
-                                                                                <input
-                                                                                    type="checkbox"
-                                                                                    checked={checked}
-                                                                                    onChange={(event) => {
-                                                                                        const next = new Set(resetOnChange);
-                                                                                        if (event.target.checked) next.add(candidate.key as string);
-                                                                                        else next.delete(candidate.key as string);
-                                                                                        updateField(index, { resetOnChange: Array.from(next) });
-                                                                                    }}
-                                                                                />
-                                                                                <span>{candidate.label || candidate.key}</span>
-                                                                            </label>
-                                                                        );
-                                                                    })}
-                                                            </div>
-                                                        </div>
-                                                    </div>
-
-                                                    {(field.dataSource === 'api' || field.dataSource === 'db') ? (
-                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
-                                                            <div className="space-y-2">
-                                                                <Label className="text-xs uppercase text-muted-foreground">Options Endpoint (API)</Label>
-                                                                <Input
-                                                                    value={(field.optionsEndpoint as string) || ''}
-                                                                    onChange={(event) => updateField(index, { optionsEndpoint: event.target.value })}
-                                                                    placeholder="/options/models"
-                                                                    className="bg-black/20 border-white/10"
-                                                                />
-                                                            </div>
-                                                            <div className="space-y-2">
-                                                                <Label className="text-xs uppercase text-muted-foreground">Options Query (JSON)</Label>
-                                                                <Input
-                                                                    value={field.optionsQuery ? JSON.stringify(field.optionsQuery) : ''}
-                                                                    onChange={(event) => {
-                                                                        try {
-                                                                            const value = event.target.value.trim();
-                                                                            updateField(index, {
-                                                                                optionsQuery: value ? JSON.parse(value) : undefined,
-                                                                            });
-                                                                        } catch {
-                                                                            // keep current value if json is invalid during typing
-                                                                        }
-                                                                    }}
-                                                                    placeholder='{"type":"modelsByBrand"}'
-                                                                    className="bg-black/20 border-white/10"
-                                                                />
-                                                            </div>
-                                                        </div>
-                                                    ) : null}
-
-                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
-                                                        <div className="space-y-2">
-                                                            <Label className="text-xs uppercase text-muted-foreground">VisibleIf (JSON RuleTree)</Label>
-                                                            <textarea
-                                                                value={field.visibleIf ? JSON.stringify(field.visibleIf) : ''}
-                                                                onChange={(event) => {
-                                                                    try {
-                                                                        const value = event.target.value.trim();
-                                                                        updateField(index, {
-                                                                            visibleIf: value ? JSON.parse(value) : undefined,
-                                                                        });
-                                                                    } catch {
-                                                                        // noop for invalid json while typing
-                                                                    }
-                                                                }}
-                                                                rows={3}
-                                                                className="w-full rounded-md bg-black/20 border border-white/10 p-2 text-xs"
-                                                                placeholder='{} = always visible'
-                                                            />
-                                                        </div>
-                                                        <div className="space-y-2">
-                                                            <Label className="text-xs uppercase text-muted-foreground">RequiredIf (JSON RuleTree)</Label>
-                                                            <textarea
-                                                                value={field.requiredIf ? JSON.stringify(field.requiredIf) : ''}
-                                                                onChange={(event) => {
-                                                                    try {
-                                                                        const value = event.target.value.trim();
-                                                                        updateField(index, {
-                                                                            requiredIf: value ? JSON.parse(value) : undefined,
-                                                                        });
-                                                                    } catch {
-                                                                        // noop for invalid json while typing
-                                                                    }
-                                                                }}
-                                                                rows={3}
-                                                                className="w-full rounded-md bg-black/20 border border-white/10 p-2 text-xs"
-                                                                placeholder='{} = not conditionally required'
+                                                    <div className="rounded-lg border border-white/10 bg-black/20">
+                                                        <button
+                                                            type="button"
+                                                            onClick={() => toggleAdvancedField(index)}
+                                                            className="w-full flex items-center justify-between px-3 py-2 text-left"
+                                                        >
+                                                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
+                                                                Advanced Settings
+                                                            </span>
+                                                            <ChevronDown
+                                                                className={`h-4 w-4 text-muted-foreground transition-transform ${
+                                                                    isAdvancedCollapsed ? '-rotate-90' : 'rotate-0'
+                                                                }`}
                                                             />
+                                                        </button>
+                                                        <div
+                                                            className={`overflow-hidden transition-all duration-300 ease-out ${
+                                                                isAdvancedCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2200px] opacity-100'
+                                                            }`}
+                                                        >
+                                                            <div className="space-y-4 px-3 pb-3 border-t border-white/10 pt-3">
+                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
+                                                                    <div className="space-y-2">
+                                                                        <Label className="text-xs uppercase text-muted-foreground">Depends On</Label>
+                                                                        <div className="rounded-lg border border-white/10 p-2 max-h-28 overflow-y-auto">
+                                                                            {fields
+                                                                                .map((candidate, candidateIndex) => ({
+                                                                                    key: candidate.key,
+                                                                                    label: candidate.label,
+                                                                                    candidateIndex,
+                                                                                }))
+                                                                                .filter((candidate) => candidate.candidateIndex !== index && candidate.key)
+                                                                                .map((candidate) => {
+                                                                                    const dependsOn = (field.dependsOn as string[]) || [];
+                                                                                    const checked = dependsOn.includes(candidate.key as string);
+                                                                                    return (
+                                                                                        <label
+                                                                                            key={`${index}-${candidate.key}`}
+                                                                                            className="flex items-center gap-2 text-xs text-white/90 py-0.5"
+                                                                                        >
+                                                                                            <input
+                                                                                                type="checkbox"
+                                                                                                checked={checked}
+                                                                                                onChange={(event) => {
+                                                                                                    const next = new Set(dependsOn);
+                                                                                                    if (event.target.checked) next.add(candidate.key as string);
+                                                                                                    else next.delete(candidate.key as string);
+                                                                                                    updateField(index, { dependsOn: Array.from(next) });
+                                                                                                }}
+                                                                                            />
+                                                                                            <span>{candidate.label || candidate.key}</span>
+                                                                                        </label>
+                                                                                    );
+                                                                                })}
+                                                                        </div>
+                                                                    </div>
+                                                                    <div className="space-y-2">
+                                                                        <Label className="text-xs uppercase text-muted-foreground">Reset On Change</Label>
+                                                                        <div className="rounded-lg border border-white/10 p-2 max-h-28 overflow-y-auto">
+                                                                            {fields
+                                                                                .map((candidate, candidateIndex) => ({
+                                                                                    key: candidate.key,
+                                                                                    label: candidate.label,
+                                                                                    candidateIndex,
+                                                                                }))
+                                                                                .filter((candidate) => candidate.candidateIndex !== index && candidate.key)
+                                                                                .map((candidate) => {
+                                                                                    const resetOnChange = (field.resetOnChange as string[]) || [];
+                                                                                    const checked = resetOnChange.includes(candidate.key as string);
+                                                                                    return (
+                                                                                        <label
+                                                                                            key={`reset-${index}-${candidate.key}`}
+                                                                                            className="flex items-center gap-2 text-xs text-white/90 py-0.5"
+                                                                                        >
+                                                                                            <input
+                                                                                                type="checkbox"
+                                                                                                checked={checked}
+                                                                                                onChange={(event) => {
+                                                                                                    const next = new Set(resetOnChange);
+                                                                                                    if (event.target.checked) next.add(candidate.key as string);
+                                                                                                    else next.delete(candidate.key as string);
+                                                                                                    updateField(index, { resetOnChange: Array.from(next) });
+                                                                                                }}
+                                                                                            />
+                                                                                            <span>{candidate.label || candidate.key}</span>
+                                                                                        </label>
+                                                                                    );
+                                                                                })}
+                                                                        </div>
+                                                                    </div>
+                                                                </div>
+
+                                                                {(field.dataSource === 'api' || field.dataSource === 'db') ? (
+                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
+                                                                        <div className="space-y-2">
+                                                                            <Label className="text-xs uppercase text-muted-foreground">Options Endpoint (API)</Label>
+                                                                            <Input
+                                                                                value={(field.optionsEndpoint as string) || ''}
+                                                                                onChange={(event) => updateField(index, { optionsEndpoint: event.target.value })}
+                                                                                placeholder="/options/models"
+                                                                                className="bg-black/20 border-white/10"
+                                                                            />
+                                                                        </div>
+                                                                        <div className="space-y-2">
+                                                                            <Label className="text-xs uppercase text-muted-foreground">Options Query (JSON)</Label>
+                                                                            <Input
+                                                                                value={field.optionsQuery ? JSON.stringify(field.optionsQuery) : ''}
+                                                                                onChange={(event) => {
+                                                                                    try {
+                                                                                        const value = event.target.value.trim();
+                                                                                        updateField(index, {
+                                                                                            optionsQuery: value ? JSON.parse(value) : undefined,
+                                                                                        });
+                                                                                    } catch {
+                                                                                        // keep current value if json is invalid during typing
+                                                                                    }
+                                                                                }}
+                                                                                placeholder='{"type":"modelsByBrand"}'
+                                                                                className="bg-black/20 border-white/10"
+                                                                            />
+                                                                        </div>
+                                                                    </div>
+                                                                ) : null}
+
+                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
+                                                                    <div className="space-y-2">
+                                                                        <Label className="text-xs uppercase text-muted-foreground">VisibleIf (JSON RuleTree)</Label>
+                                                                        <textarea
+                                                                            value={field.visibleIf ? JSON.stringify(field.visibleIf) : ''}
+                                                                            onChange={(event) => {
+                                                                                try {
+                                                                                    const value = event.target.value.trim();
+                                                                                    updateField(index, {
+                                                                                        visibleIf: value ? JSON.parse(value) : undefined,
+                                                                                    });
+                                                                                } catch {
+                                                                                    // noop for invalid json while typing
+                                                                                }
+                                                                            }}
+                                                                            rows={3}
+                                                                            className="w-full rounded-md bg-black/20 border border-white/10 p-2 text-xs"
+                                                                            placeholder='{} = always visible'
+                                                                        />
+                                                                    </div>
+                                                                    <div className="space-y-2">
+                                                                        <Label className="text-xs uppercase text-muted-foreground">RequiredIf (JSON RuleTree)</Label>
+                                                                        <textarea
+                                                                            value={field.requiredIf ? JSON.stringify(field.requiredIf) : ''}
+                                                                            onChange={(event) => {
+                                                                                try {
+                                                                                    const value = event.target.value.trim();
+                                                                                    updateField(index, {
+                                                                                        requiredIf: value ? JSON.parse(value) : undefined,
+                                                                                    });
+                                                                                } catch {
+                                                                                    // noop for invalid json while typing
+                                                                                }
+                                                                            }}
+                                                                            rows={3}
+                                                                            className="w-full rounded-md bg-black/20 border border-white/10 p-2 text-xs"
+                                                                            placeholder='{} = not conditionally required'
+                                                                        />
+                                                                    </div>
+                                                                </div>
+                                                            </div>
                                                         </div>
                                                     </div>
 
@@ -921,7 +1077,7 @@ export default function AdminTemplatesPage() {
                                                         </div>
                                                     )}
 
-                                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
+                                                    <div className="flex items-center pt-2 border-t border-white/5">
                                                         <label className="flex items-center gap-2 text-sm cursor-pointer select-none text-muted-foreground hover:text-white transition-colors">
                                                             <input
                                                                 type="checkbox"
@@ -931,16 +1087,7 @@ export default function AdminTemplatesPage() {
                                                             />
                                                             Required Field
                                                         </label>
-
-                                                        <Button
-                                                            variant="ghost"
-                                                            size="sm"
-                                                            className="text-muted-foreground hover:text-red-400 hover:bg-red-950/20"
-                                                            onClick={() => removeField(index)}
-                                                        >
-                                                            <Trash className="w-4 h-4 mr-2" />
-                                                            Remove Field
-                                                        </Button>
+                                                    </div>
                                                     </div>
                                                 </div>
                                             </div>
@@ -957,7 +1104,8 @@ export default function AdminTemplatesPage() {
                                 </Button>
                             </div>
                         </div>
-                    ))}
+                    );
+                    })}
 
                     <div className="flex justify-center pt-8">
                         <div className="text-center">
diff --git a/web/src/components/listings/dynamic-form.tsx b/web/src/components/listings/dynamic-form.tsx
index 0e21ad7..8d222ce 100644
--- a/web/src/components/listings/dynamic-form.tsx
+++ b/web/src/components/listings/dynamic-form.tsx
@@ -15,7 +15,7 @@ import {
   getChildDependencyMap,
 } from '@/lib/dependencyEngine';
 import type { FieldOption } from '@/lib/schemaTypes';
-import { MapPin } from 'lucide-react';
+import { ChevronDown, MapPin } from 'lucide-react';
 
 const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
 
@@ -112,6 +112,7 @@ export function DynamicForm({ categoryId, template, values, onChange }: DynamicF
   const [customInputMap, setCustomInputMap] = useState<Record<string, string>>({});
   const [customOpenMap, setCustomOpenMap] = useState<Record<string, boolean>>({});
   const [customSubmitting, setCustomSubmitting] = useState<Record<string, boolean>>({});
+  const [openSection, setOpenSection] = useState<string | null>(null);
 
   useEffect(() => {
     setFormValues(values);
@@ -228,7 +229,6 @@ export function DynamicForm({ categoryId, template, values, onChange }: DynamicF
       for (const field of visibleFields) {
         if (normalizeComponent(field) !== 'select') continue;
         if (canceled) return;
-        // eslint-disable-next-line no-await-in-loop
         await fetchFieldOptions(field, formValues);
       }
     }
@@ -237,7 +237,6 @@ export function DynamicForm({ categoryId, template, values, onChange }: DynamicF
     return () => {
       canceled = true;
     };
-    // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [visibleFields, formValues]);
 
   const handleFieldChange = (key: string, value: string) => {
@@ -273,6 +272,15 @@ export function DynamicForm({ categoryId, template, values, onChange }: DynamicF
     return Array.from(grouped.entries());
   }, [visibleFields]);
 
+  useEffect(() => {
+    if (!sectionEntries.length) {
+      setOpenSection(null);
+      return;
+    }
+    const keys = sectionEntries.map(([name]) => name);
+    setOpenSection((prev) => (prev && keys.includes(prev) ? prev : keys[0]));
+  }, [sectionEntries]);
+
   if (!fields.length) {
     return (
       <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 px-4 py-3 text-sm text-[var(--text-secondary)]">
@@ -518,41 +526,63 @@ export function DynamicForm({ categoryId, template, values, onChange }: DynamicF
       {sectionEntries.map(([sectionName, sectionFields]) => (
         <section
           key={sectionName}
-          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/15 p-4 sm:p-5"
+          className={`rounded-xl border bg-[var(--bg-secondary)]/15 overflow-hidden transition-colors ${
+            openSection === sectionName
+              ? 'border-blue-bright/40'
+              : 'border-[var(--border-color)] hover:border-blue-bright/30'
+          }`}
         >
-          {sectionEntries.length > 1 && (
-            <div className="mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-3">
-              <h3 className="text-base font-semibold text-[var(--text-primary)]">{sectionName}</h3>
-              <span className="text-xs text-[var(--text-secondary)]">{sectionFields.length} fields</span>
+          <button
+            type="button"
+            onClick={() =>
+              setOpenSection((current) => (current === sectionName ? null : sectionName))
+            }
+            className="w-full px-5 py-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
+          >
+            <span className="text-center w-full text-sm sm:text-base font-semibold text-[var(--text-primary)]">
+              {sectionName}
+            </span>
+            <ChevronDown
+              className={`h-4 w-4 text-[var(--text-secondary)] shrink-0 transition-transform ${
+                openSection === sectionName ? 'rotate-180' : 'rotate-0'
+              }`}
+            />
+          </button>
+
+          <div
+            className={`overflow-hidden transition-all duration-300 ease-out ${
+              openSection === sectionName ? 'max-h-[3200px] opacity-100' : 'max-h-0 opacity-0'
+            }`}
+          >
+            <div className="p-4 sm:p-5 border-t border-[var(--border-color)]">
+              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
+                {sectionFields.map((field) => {
+                  const hint = formatFieldHint((field.validationRules ?? {}) as FieldValidation);
+                  const required = Boolean(
+                    field.required ||
+                      field.isRequired ||
+                      evaluateRuleTree(field.requiredIf, formValues, context),
+                  );
+                  return (
+                    <div key={field.key} className={`space-y-2 ${getFieldSpanClass(normalizeComponent(field))}`}>
+                      <div className="flex items-center justify-between gap-2">
+                        <label className="text-sm font-medium text-[var(--text-primary)]">
+                          {field.label}
+                          {required && <span className="text-red-400 ml-1">*</span>}
+                        </label>
+                        <span className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
+                          {normalizeComponent(field)}
+                        </span>
+                      </div>
+
+                      {renderFieldControl(field)}
+
+                      {hint && <p className="text-xs text-[var(--text-secondary)]">{hint}</p>}
+                    </div>
+                  );
+                })}
+              </div>
             </div>
-          )}
-
-          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
-            {sectionFields.map((field) => {
-              const hint = formatFieldHint((field.validationRules ?? {}) as FieldValidation);
-              const required = Boolean(
-                field.required ||
-                  field.isRequired ||
-                  evaluateRuleTree(field.requiredIf, formValues, context),
-              );
-              return (
-                <div key={field.key} className={`space-y-2 ${getFieldSpanClass(normalizeComponent(field))}`}>
-                  <div className="flex items-center justify-between gap-2">
-                    <label className="text-sm font-medium text-[var(--text-primary)]">
-                      {field.label}
-                      {required && <span className="text-red-400 ml-1">*</span>}
-                    </label>
-                    <span className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
-                      {normalizeComponent(field)}
-                    </span>
-                  </div>
-
-                  {renderFieldControl(field)}
-
-                  {hint && <p className="text-xs text-[var(--text-secondary)]">{hint}</p>}
-                </div>
-              );
-            })}
           </div>
         </section>
       ))}
diff --git a/web/src/components/listings/listing-detail.tsx b/web/src/components/listings/listing-detail.tsx
index 2dd9320..211ab6f 100644
--- a/web/src/components/listings/listing-detail.tsx
+++ b/web/src/components/listings/listing-detail.tsx
@@ -1,12 +1,26 @@
 'use client';
 
 import Link from 'next/link';
-import { useEffect } from 'react';
-import { MapPin, Calendar, Building2, ChevronLeft, ShieldCheck, Package, Clock, ExternalLink, MessageSquare } from 'lucide-react';
+import { useEffect, useMemo, useState } from 'react';
+import {
+  MapPin,
+  Calendar,
+  Building2,
+  ChevronDown,
+  ChevronLeft,
+  ShieldCheck,
+  Package,
+  Clock,
+  ExternalLink,
+  MessageSquare,
+  Phone,
+  Star,
+  Send,
+} from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 import { PriceDisplay } from '@/components/ui/price-display';
 import { StarRating } from '@/components/ui/star-rating';
-import { useListingDetail, useRecordView } from '@/lib/queries';
+import { useCategoryTemplate, useListingDetail, useRecordView } from '@/lib/queries';
 import { useAuthStore } from '@/stores/auth-store';
 import { Skeleton } from '@/components/ui/skeleton';
 import { FavoriteButton } from './favorite-button';
@@ -24,29 +38,185 @@ const listingTypeLabels: Record<string, string> = {
   FROM_MANUFACTURER: 'Від виробника',
 };
 
+const formatDate = (iso?: string | null) => {
+  if (!iso) return '-';
+  const parsed = new Date(iso);
+  if (Number.isNaN(parsed.getTime())) return '-';
+  return parsed.toLocaleDateString('uk-UA', {
+    day: '2-digit',
+    month: '2-digit',
+    year: 'numeric',
+  });
+};
+
+const normalizeDescription = (value?: string | null) => {
+  const clean = value?.trim();
+  if (!clean) return null;
+  const placeholderValues = new Set(['-', '—', 'n/a', 'na', 'none', 'null']);
+  if (placeholderValues.has(clean.toLowerCase())) return null;
+  return clean;
+};
+
 export function ListingDetail({ id }: { id: string }) {
   const { data: listing, isLoading, error } = useListingDetail(id);
+  const categoryId = listing?.categoryId ?? '';
+  const { data: template } = useCategoryTemplate(categoryId);
   const { isAuthenticated } = useAuthStore();
   const recordView = useRecordView();
 
+  const [openAttributeSection, setOpenAttributeSection] = useState<string | null>(null);
+  const [activeImageIndex, setActiveImageIndex] = useState(0);
+
   useEffect(() => {
     if (isAuthenticated && id) {
       recordView.mutate(id);
     }
   }, [id, isAuthenticated]);
 
+  useEffect(() => {
+    setActiveImageIndex(0);
+  }, [listing?.id]);
+
+  const templateFieldMap = useMemo(() => {
+    const map = new Map<string, any>();
+    for (const field of template?.fields ?? []) {
+      if (field?.key) map.set(String(field.key), field);
+    }
+    return map;
+  }, [template]);
+
+  const prettifyKey = (key: string) =>
+    key
+      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
+      .replace(/[_-]+/g, ' ')
+      .replace(/\s+/g, ' ')
+      .trim()
+      .replace(/^./, (s) => s.toUpperCase());
+
+  const resolveValueLabel = (field: any, rawValue: string) => {
+    const options = [...(field?.options ?? []), ...(field?.staticOptions ?? [])];
+    if (options.length === 0) return rawValue;
+
+    const optionMap = new Map(
+      options
+        .filter((opt: any) => opt?.value !== undefined)
+        .map((opt: any) => [String(opt.value), String(opt.label ?? opt.value)]),
+    );
+
+    const parts = String(rawValue)
+      .split(',')
+      .map((entry) => entry.trim())
+      .filter(Boolean);
+
+    if (parts.length <= 1) {
+      return optionMap.get(String(rawValue)) ?? rawValue;
+    }
+
+    return parts.map((entry) => optionMap.get(entry) ?? entry).join(', ');
+  };
+
+  const displayAttributes = useMemo(() => {
+    return (listing?.attributes ?? []).map((attr) => {
+      const field = templateFieldMap.get(attr.key);
+      return {
+        ...attr,
+        key: attr.key,
+        displayKey: field?.label || prettifyKey(attr.key),
+        displayValue: resolveValueLabel(field, String(attr.value ?? '')),
+      };
+    });
+  }, [listing?.attributes, templateFieldMap]);
+
+  const attributeSections = useMemo(() => {
+    if (displayAttributes.length === 0) return [];
+
+    const byKey = new Map(displayAttributes.map((attr) => [attr.key, attr]));
+    const grouped = new Map<string, typeof displayAttributes>();
+    const matchedKeys = new Set<string>();
+
+    for (const field of template?.fields ?? []) {
+      if (!field?.key) continue;
+      const attr = byKey.get(String(field.key));
+      if (!attr) continue;
+
+      const sectionName = field.group || field.section || 'Додаткові деталі';
+      const current = grouped.get(sectionName) ?? [];
+      current.push(attr);
+      grouped.set(sectionName, current);
+      matchedKeys.add(String(field.key));
+    }
+
+    const unmatched = displayAttributes.filter((attr) => !matchedKeys.has(attr.key));
+    if (unmatched.length > 0) {
+      const fallbackSection = grouped.get('Додаткові деталі') ?? [];
+      grouped.set('Додаткові деталі', [...fallbackSection, ...unmatched]);
+    }
+
+    if (grouped.size === 0) {
+      grouped.set('Додаткові деталі', displayAttributes);
+    }
+
+    return Array.from(grouped.entries());
+  }, [displayAttributes, template?.fields]);
+
+  useEffect(() => {
+    if (attributeSections.length === 0) {
+      setOpenAttributeSection(null);
+      return;
+    }
+    const names = attributeSections.map(([sectionName]) => sectionName);
+    setOpenAttributeSection((current) => (current && names.includes(current) ? current : names[0]));
+  }, [attributeSections]);
+
+  const mainImage = listing?.media?.[activeImageIndex]?.url || listing?.media?.[0]?.url;
+  const cleanedDescription = normalizeDescription(listing?.description);
+  const locationLabel = [listing?.city?.name, listing?.country?.name].filter(Boolean).join(', ');
+  const sellerPhone = listing?.sellerPhones?.[0] ?? listing?.company?.phones?.find((phone) => phone.isPrimary)?.phoneE164;
+
+  const summaryRows = useMemo(() => {
+    const baseRows = [
+      { label: 'Brand', value: listing?.brand?.name ?? null },
+      { label: 'Category', value: listing?.category?.name ?? null },
+      {
+        label: 'Condition',
+        value: listing?.condition ? conditionLabels[listing.condition] ?? listing.condition : null,
+      },
+      { label: 'Year', value: listing?.year ? String(listing.year) : null },
+      { label: 'Location', value: locationLabel || null },
+      { label: 'Published', value: formatDate(listing?.publishedAt || listing?.createdAt) },
+    ].filter((row) => row.value && row.value !== '-');
+
+    const takenLabels = new Set(baseRows.map((row) => row.label.toLowerCase()));
+    const topAttributes = displayAttributes
+      .filter((attr) => {
+        const value = String(attr.displayValue ?? '').trim();
+        if (!value || value === '-' || value === '—') return false;
+        return !takenLabels.has(String(attr.displayKey).toLowerCase());
+      })
+      .slice(0, 4)
+      .map((attr) => ({
+        label: attr.displayKey,
+        value: attr.displayValue,
+      }));
+
+    return [...baseRows, ...topAttributes];
+  }, [
+    displayAttributes,
+    listing?.brand?.name,
+    listing?.category?.name,
+    listing?.condition,
+    listing?.createdAt,
+    listing?.publishedAt,
+    listing?.year,
+    locationLabel,
+  ]);
+
   if (isLoading) {
     return (
       <div className="container-main py-10 space-y-6">
         <Skeleton className="h-8 w-48" />
+        <Skeleton className="h-[420px] w-full" />
         <Skeleton className="h-80 w-full" />
-        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
-          <div className="lg:col-span-2 space-y-4">
-            <Skeleton className="h-10 w-3/4" />
-            <Skeleton className="h-6 w-1/2" />
-          </div>
-          <Skeleton className="h-64" />
-        </div>
       </div>
     );
   }
@@ -56,196 +226,356 @@ export function ListingDetail({ id }: { id: string }) {
       <div className="container-main py-20 text-center">
         <Package size={48} className="mx-auto text-blue-bright/20 mb-4" />
         <h2 className="font-heading font-bold text-xl text-[var(--text-primary)]">Оголошення не знайдено</h2>
-        <Link href="/listings" className="text-blue-bright mt-4 inline-block">Назад до оголошень</Link>
+        <Link href="/listings" className="text-blue-bright mt-4 inline-block">
+          Назад до оголошень
+        </Link>
       </div>
     );
   }
 
-  const mainImage = listing.media?.[0]?.url;
-
   return (
-    <div className="container-main py-10">
-      {/* Back link */}
-      <Link href="/listings" className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-blue-bright transition-colors mb-6">
-        <ChevronLeft size={16} />
-        Назад до оголошень
-      </Link>
-
-      {/* Image Gallery */}
-      <div className="glass-card overflow-hidden mb-8">
-        {mainImage ? (
-          <div className="relative">
-            <img src={mainImage} alt={listing.title} className="w-full h-64 md:h-96 object-cover" />
-          </div>
-        ) : (
-          <div className="h-64 md:h-96 bg-gradient-to-br from-blue-accent/20 to-orange/10 flex items-center justify-center">
-            <Building2 size={64} className="text-blue-bright/20" />
-          </div>
-        )}
-        {listing.media && listing.media.length > 1 && (
-          <div className="flex gap-2 p-4 overflow-x-auto">
-            {listing.media.map((m) => (
-              <img key={m.id} src={m.url} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border-2 border-transparent hover:border-blue-bright transition-colors cursor-pointer" />
-            ))}
-          </div>
-        )}
-      </div>
+    <div className="container-main py-8 md:py-10">
+      <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-gradient-to-b from-[#0c1a33] via-[#071426] to-[#050b14] p-4 md:p-6">
+        <div className="pointer-events-none absolute -left-24 -top-24 h-60 w-60 rounded-full bg-blue-500/15 blur-3xl" />
+        <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
+
+        <div className="relative z-10">
+          <Link
+            href="/listings"
+            className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-blue-bright transition-colors mb-4"
+          >
+            <ChevronLeft size={16} />
+            Назад до оголошень
+          </Link>
 
-      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
-        {/* Main Content */}
-        <div className="lg:col-span-2 space-y-6">
-          {/* Title & Badges */}
-          <div>
-            <div className="flex flex-wrap gap-2 mb-3">
+          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
+            <div className="flex flex-wrap gap-2">
               {listing.condition && (
                 <Badge variant={listing.condition === 'NEW' ? 'success' : 'warning'}>
                   {conditionLabels[listing.condition] ?? listing.condition}
                 </Badge>
               )}
-              {listing.listingType && (
-                <Badge variant="default">
-                  {listingTypeLabels[listing.listingType] ?? listing.listingType}
-                </Badge>
-              )}
+              {listing.listingType && <Badge>{listingTypeLabels[listing.listingType] ?? listing.listingType}</Badge>}
               {listing.brand && <Badge variant="outline">{listing.brand.name}</Badge>}
-              {listing.category && <Badge>{listing.category.name}</Badge>}
-              {listing.euroClass && <Badge variant="outline">{listing.euroClass}</Badge>}
+              {listing.category && <Badge variant="outline">{listing.category.name}</Badge>}
             </div>
-            <div className="flex items-start justify-between gap-3">
-              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[var(--text-primary)]">
-                {listing.title}
-              </h1>
+            <div className="flex items-center gap-2">
+              {listing.externalUrl && (
+                <a
+                  href={listing.externalUrl}
+                  target="_blank"
+                  rel="noopener noreferrer"
+                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-white/8"
+                >
+                  <ExternalLink size={14} />
+                  Джерело
+                </a>
+              )}
               <FavoriteButton listingId={id} />
             </div>
           </div>
 
-          {/* Price */}
-          <div className="glass-card p-6">
-            <PriceDisplay
-              amount={listing.priceAmount}
-              currency={listing.priceCurrency}
-              priceType={listing.priceType}
-              className="text-2xl"
-            />
-          </div>
+          <h1 className="mb-5 text-2xl font-extrabold leading-tight text-white md:text-3xl">{listing.title}</h1>
 
-          {/* Details */}
-          <div className="glass-card p-6">
-            <h3 className="font-heading font-bold text-base text-[var(--text-primary)] mb-4">Деталі</h3>
-            <div className="grid grid-cols-2 gap-4">
-              {listing.year && (
-                <div className="flex items-center gap-2 text-sm">
-                  <Calendar size={14} className="text-blue-bright" />
-                  <span className="text-[var(--text-secondary)]">Рік:</span>
-                  <span className="text-[var(--text-primary)] font-medium">{listing.year}</span>
-                </div>
-              )}
-              {(listing.country || listing.city) && (
-                <div className="flex items-center gap-2 text-sm">
-                  <MapPin size={14} className="text-blue-bright" />
-                  <span className="text-[var(--text-secondary)]">Розташування:</span>
-                  <span className="text-[var(--text-primary)] font-medium">
-                    {[listing.city?.name, listing.country?.name].filter(Boolean).join(', ')}
-                  </span>
+          <div className="grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)_320px]">
+            <section className="rounded-2xl border border-white/12 bg-[rgba(6,16,32,0.88)] p-4 backdrop-blur-sm animate-[fade-up_0.5s_ease-out_forwards]">
+              <PriceDisplay
+                amount={listing.priceAmount}
+                currency={listing.priceCurrency}
+                priceType={listing.priceType}
+                className="text-[28px] font-extrabold"
+              />
+
+              <button
+                type="button"
+                className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(249,115,22,0.3)] hover:translate-y-[-1px]"
+              >
+                Contact the seller
+              </button>
+
+              <dl className="mt-4 divide-y divide-white/10 text-sm">
+                {summaryRows.map((row) => (
+                  <div key={row.label} className="flex items-start justify-between gap-3 py-2.5">
+                    <dt className="text-[var(--text-secondary)]">{row.label}</dt>
+                    <dd className="max-w-[58%] text-right font-medium text-white">{row.value}</dd>
+                  </div>
+                ))}
+              </dl>
+            </section>
+
+            <section className="rounded-2xl border border-white/12 bg-[rgba(8,20,38,0.8)] p-3 backdrop-blur-sm animate-[fade-up_0.65s_ease-out_forwards]">
+              {mainImage ? (
+                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
+                  <img
+                    key={mainImage}
+                    src={mainImage}
+                    alt={listing.title}
+                    className="h-[420px] w-full object-cover transition-all duration-500"
+                  />
                 </div>
-              )}
-              {listing.hoursValue != null && (
-                <div className="flex items-center gap-2 text-sm">
-                  <Clock size={14} className="text-blue-bright" />
-                  <span className="text-[var(--text-secondary)]">Напрацювання:</span>
-                  <span className="text-[var(--text-primary)] font-medium">
-                    {listing.hoursValue} {listing.hoursUnit ?? 'м/г'}
-                  </span>
+              ) : (
+                <div className="flex h-[420px] items-center justify-center rounded-xl border border-white/10 bg-black/20">
+                  <Building2 size={64} className="text-blue-bright/30" />
                 </div>
               )}
-              {listing.euroClass && (
-                <div className="flex items-center gap-2 text-sm">
-                  <Package size={14} className="text-blue-bright" />
-                  <span className="text-[var(--text-secondary)]">Євро клас:</span>
-                  <span className="text-[var(--text-primary)] font-medium">{listing.euroClass}</span>
+
+              {listing.media && listing.media.length > 1 && (
+                <div className="mt-3 grid grid-cols-5 gap-2">
+                  {listing.media.slice(0, 10).map((m, index) => (
+                    <button
+                      key={m.id}
+                      type="button"
+                      onClick={() => setActiveImageIndex(index)}
+                      className={`group overflow-hidden rounded-lg border transition-all duration-300 ${
+                        activeImageIndex === index
+                          ? 'border-orange-400 shadow-[0_8px_24px_rgba(249,115,22,0.35)]'
+                          : 'border-white/15 hover:border-blue-300/60'
+                      }`}
+                    >
+                      <img
+                        src={m.url}
+                        alt=""
+                        className="h-16 w-full object-cover transition-transform duration-300 group-hover:scale-110"
+                      />
+                    </button>
+                  ))}
                 </div>
               )}
-            </div>
-            {listing.externalUrl && (
-              <a
-                href={listing.externalUrl}
-                target="_blank"
-                rel="noopener noreferrer"
-                className="inline-flex items-center gap-1.5 mt-4 text-sm text-blue-bright hover:text-blue-light transition-colors"
-              >
-                <ExternalLink size={14} />
-                Переглянути на джерелі
-              </a>
-            )}
-          </div>
+            </section>
 
-          {/* Attributes */}
-          {listing.attributes && listing.attributes.length > 0 && (
-            <div className="glass-card p-6">
-              <h3 className="font-heading font-bold text-base text-[var(--text-primary)] mb-4">Характеристики</h3>
-              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
-                {listing.attributes.map((attr) => (
-                  <div key={attr.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-primary)]">
-                    <span className="text-sm text-[var(--text-secondary)]">{attr.key}</span>
-                    <span className="text-sm font-medium text-[var(--text-primary)]">{attr.value}</span>
-                  </div>
-                ))}
-              </div>
-            </div>
-          )}
-        </div>
+            <aside className="rounded-2xl border border-white/12 bg-[rgba(6,16,32,0.9)] p-4 backdrop-blur-sm animate-[fade-up_0.8s_ease-out_forwards]">
+              <h3 className="text-base font-bold text-white">Seller&apos;s contacts</h3>
 
-        {/* Sidebar - Company Card */}
-        <aside>
-          <div className="sticky top-20 glass-card p-6">
-            <h3 className="font-heading font-bold text-base text-[var(--text-primary)] mb-4">Продавець</h3>
-            {listing.company ? (
-              <div>
-                <div className="flex items-center gap-3 mb-4">
-                  <div className="w-12 h-12 rounded-full gradient-cta flex items-center justify-center text-white font-bold text-lg">
-                    {listing.company.name.charAt(0)}
-                  </div>
-                  <div>
-                    <p className="font-heading font-bold text-sm text-[var(--text-primary)]">{listing.company.name}</p>
-                    {(listing.company.country || listing.company.city) && (
+              {listing.company ? (
+                <>
+                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
+                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-400 text-sm font-extrabold text-white">
+                      {listing.company.name.charAt(0)}
+                    </div>
+                    <div>
+                      <p className="text-sm font-semibold text-white">{listing.company.name}</p>
                       <p className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
-                        <MapPin size={10} />
-                        {[listing.company.city?.name, listing.company.country?.name].filter(Boolean).join(', ')}
+                        <MapPin size={11} />
+                        {[listing.company.city?.name, listing.company.country?.name].filter(Boolean).join(', ') || '—'}
                       </p>
+                    </div>
+                  </div>
+
+                  <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
+                    {listing.company.isVerified && (
+                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-1 text-green-300">
+                        <ShieldCheck size={12} /> Verified
+                      </span>
                     )}
+                    <span className="inline-flex items-center gap-1 text-amber-300">
+                      <Star size={12} className="fill-current" />
+                      {Number(listing.company.ratingAvg || 0).toFixed(1)}
+                    </span>
+                    <span>({listing.company.reviewsCount} reviews)</span>
                   </div>
+
+                  {sellerPhone && (
+                    <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white">
+                      <Phone size={14} className="text-blue-300" />
+                      {sellerPhone}
+                    </p>
+                  )}
+
+                  <Link
+                    href={`/companies/${listing.company.slug}`}
+                    className="mt-3 block w-full rounded-xl border border-blue-300/30 bg-blue-500/15 px-3 py-2 text-center text-sm font-semibold text-blue-100 hover:bg-blue-500/25"
+                  >
+                    View company profile
+                  </Link>
+                </>
+              ) : (
+                <p className="mt-2 text-sm text-[var(--text-secondary)]">Інформація про продавця недоступна.</p>
+              )}
+
+              <ContactSellerButton listingId={listing.id} sellerId={listing.ownerUserId ?? ''} />
+
+              <div className="mt-3 rounded-xl border border-white/10 bg-[rgba(17,35,60,0.45)] p-3">
+                <p className="mb-2 text-sm font-semibold text-white">Send message</p>
+                <div className="space-y-2">
+                  <input
+                    placeholder="Your name"
+                    className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400"
+                  />
+                  <input
+                    placeholder="Email"
+                    className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400"
+                  />
+                  <textarea
+                    placeholder="I am interested in your ad"
+                    rows={3}
+                    className="w-full resize-none rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400"
+                  />
+                  <button
+                    type="button"
+                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
+                  >
+                    <Send size={14} />
+                    Send
+                  </button>
                 </div>
+              </div>
+            </aside>
+          </div>
 
-                {listing.company.isVerified && (
-                  <Badge variant="success" className="mb-3">
-                    <ShieldCheck size={12} className="mr-1" /> Верифікований
-                  </Badge>
-                )}
-
-                <div className="flex items-center gap-2 mb-4">
-                  <StarRating rating={listing.company.ratingAvg} size={14} />
-                  <span className="text-xs text-[var(--text-secondary)]">
-                    ({listing.company.reviewsCount} відгуків)
-                  </span>
+          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
+            <div className="space-y-6">
+              <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-5 backdrop-blur-sm animate-[fade-up_0.9s_ease-out_forwards]">
+                <h3 className="mb-3 text-base font-bold text-white">Details</h3>
+                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
+                  {(listing.country || listing.city) && (
+                    <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm">
+                      <MapPin size={14} className="text-blue-300" />
+                      <span className="text-[var(--text-secondary)]">Location:</span>
+                      <span className="font-medium text-white">{locationLabel}</span>
+                    </div>
+                  )}
+                  {listing.year && (
+                    <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm">
+                      <Calendar size={14} className="text-blue-300" />
+                      <span className="text-[var(--text-secondary)]">Year:</span>
+                      <span className="font-medium text-white">{listing.year}</span>
+                    </div>
+                  )}
+                  {listing.hoursValue != null && (
+                    <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm">
+                      <Clock size={14} className="text-blue-300" />
+                      <span className="text-[var(--text-secondary)]">Hours:</span>
+                      <span className="font-medium text-white">
+                        {listing.hoursValue} {listing.hoursUnit ?? 'м/г'}
+                      </span>
+                    </div>
+                  )}
+                  {listing.euroClass && (
+                    <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm">
+                      <Package size={14} className="text-blue-300" />
+                      <span className="text-[var(--text-secondary)]">Євро клас:</span>
+                      <span className="font-medium text-white">{listing.euroClass}</span>
+                    </div>
+                  )}
                 </div>
+              </section>
 
-                <Link
-                  href={`/companies/${listing.company.slug}`}
-                  className="block w-full text-center gradient-cta text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
-                >
-                  Переглянути профіль компанії
-                </Link>
+              {attributeSections.length > 0 && (
+                <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-4 md:p-5 backdrop-blur-sm animate-[fade-up_1.05s_ease-out_forwards]">
+                  <h3 className="mb-3 text-base font-bold text-white">Characteristics</h3>
+                  <div className="space-y-2.5">
+                    {attributeSections.map(([sectionName, items], sectionIndex) => {
+                      const isOpen = openAttributeSection === sectionName;
 
-                <ContactSellerButton
-                  listingId={listing.id}
-                  sellerId={listing.ownerUserId ?? ''}
-                />
-              </div>
-            ) : (
-              <p className="text-sm text-[var(--text-secondary)]">Інформація про продавця недоступна.</p>
-            )}
+                      return (
+                        <section
+                          key={sectionName}
+                          className={`overflow-hidden rounded-xl border transition-all duration-400 ${
+                            isOpen
+                              ? 'border-blue-300/40 bg-[rgba(14,30,52,0.92)] shadow-[0_10px_36px_rgba(59,130,246,0.2)]'
+                              : 'border-white/12 bg-[rgba(6,14,28,0.88)] hover:border-orange-300/35 hover:bg-[rgba(11,22,40,0.95)]'
+                          }`}
+                          style={{ transitionDelay: `${sectionIndex * 45}ms` }}
+                        >
+                          <button
+                            type="button"
+                            onClick={() =>
+                              setOpenAttributeSection((current) => (current === sectionName ? null : sectionName))
+                            }
+                            className="flex w-full items-center justify-between px-4 py-3"
+                          >
+                            <span className="text-sm font-semibold text-white">{sectionName}</span>
+                            <ChevronDown
+                              className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${
+                                isOpen ? 'rotate-180 text-orange-300' : 'rotate-0'
+                              }`}
+                            />
+                          </button>
+
+                          <div
+                            className={`grid transition-all duration-500 ease-out ${
+                              isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
+                            }`}
+                          >
+                            <div className="overflow-hidden">
+                              <div className="grid gap-2 border-t border-white/10 p-3 sm:grid-cols-2">
+                                {items.map((attr) => (
+                                  <div
+                                    key={attr.id}
+                                    className="group flex items-center justify-between gap-2 rounded-lg border border-white/6 bg-black/15 px-3 py-2 text-sm transition-all hover:border-orange-300/40 hover:bg-black/25"
+                                  >
+                                    <span className="text-[var(--text-secondary)] group-hover:text-slate-100">
+                                      {attr.displayKey}
+                                    </span>
+                                    <span className="text-right font-medium text-white">{attr.displayValue}</span>
+                                  </div>
+                                ))}
+                              </div>
+                            </div>
+                          </div>
+                        </section>
+                      );
+                    })}
+                  </div>
+                </section>
+              )}
+
+              {(cleanedDescription || listing.externalUrl) && (
+                <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-5 backdrop-blur-sm animate-[fade-up_1.18s_ease-out_forwards]">
+                  <h3 className="mb-3 text-base font-bold text-white">More details</h3>
+                  {cleanedDescription && (
+                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">{cleanedDescription}</p>
+                  )}
+                  {listing.externalUrl && (
+                    <a
+                      href={listing.externalUrl}
+                      target="_blank"
+                      rel="noopener noreferrer"
+                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-300 hover:text-orange-300"
+                    >
+                      <ExternalLink size={14} />
+                      View original source
+                    </a>
+                  )}
+                </section>
+              )}
+            </div>
+
+            <aside className="space-y-4">
+              <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-5 backdrop-blur-sm animate-[fade-up_1.25s_ease-out_forwards]">
+                <h3 className="text-base font-bold text-white">Purchase tips</h3>
+                <p className="mt-2 text-sm text-[var(--text-secondary)]">
+                  Перед купівлею перевірте серійний номер, історію сервісу та відповідність технічних параметрів документам.
+                </p>
+              </section>
+
+              <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-5 backdrop-blur-sm animate-[fade-up_1.32s_ease-out_forwards]">
+                <h3 className="text-base font-bold text-white">Safety tips</h3>
+                <p className="mt-2 text-sm text-[var(--text-secondary)]">
+                  Використовуйте захищені способи оплати та погоджуйте огляд техніки в присутності відповідального представника.
+                </p>
+              </section>
+
+              {listing.company && (
+                <section className="rounded-2xl border border-white/12 bg-[rgba(7,18,34,0.84)] p-5 backdrop-blur-sm animate-[fade-up_1.4s_ease-out_forwards]">
+                  <h3 className="mb-2 text-base font-bold text-white">Seller snapshot</h3>
+                  <p className="text-sm font-semibold text-white">{listing.company.name}</p>
+                  <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
+                    <StarRating rating={listing.company.ratingAvg} size={14} />
+                    <span>{listing.company.reviewsCount} відгуків</span>
+                  </div>
+                  <Link
+                    href={`/companies/${listing.company.slug}`}
+                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-300 hover:text-orange-300"
+                  >
+                    <MessageSquare size={14} />
+                    Перейти в профіль
+                  </Link>
+                </section>
+              )}
+            </aside>
           </div>
-        </aside>
+        </div>
       </div>
     </div>
   );
diff --git a/web/src/components/listings/media-uploader.tsx b/web/src/components/listings/media-uploader.tsx
index 2964ca0..9c00274 100644
--- a/web/src/components/listings/media-uploader.tsx
+++ b/web/src/components/listings/media-uploader.tsx
@@ -23,6 +23,8 @@ export function MediaUploader({ media, onChange, maxFiles = 10 }: MediaUploaderP
     const [uploading, setUploading] = useState(false);
     // Switch to server-side upload to avoid CORS/S3 configuration issues on client
     const { mutateAsync: uploadImages } = useUploadImages();
+    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
+    const maxFileBytes = 10 * 1024 * 1024;
 
     const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
         const files = Array.from(e.target.files || []);
@@ -30,10 +32,25 @@ export function MediaUploader({ media, onChange, maxFiles = 10 }: MediaUploaderP
 
         const remaining = maxFiles - media.length;
         const filesToUpload = files.slice(0, remaining);
+        const invalidType = filesToUpload.find((file) => !allowedMimeTypes.has(file.type));
+        if (invalidType) {
+            alert('Підтримуються лише JPG, PNG, WEBP, GIF.');
+            e.target.value = '';
+            return;
+        }
+        const oversized = filesToUpload.find((file) => file.size > maxFileBytes);
+        if (oversized) {
+            alert('Максимальний розмір одного файлу — 10MB.');
+            e.target.value = '';
+            return;
+        }
 
         setUploading(true);
         try {
             const { urls } = await uploadImages(filesToUpload);
+            if (!Array.isArray(urls) || urls.length === 0) {
+                throw new Error('Сервер не повернув URL завантажених зображень.');
+            }
 
             const newMediaItems: MediaItem[] = urls.map((url, index) => ({
                 url,
@@ -79,7 +96,7 @@ export function MediaUploader({ media, onChange, maxFiles = 10 }: MediaUploaderP
                     <label className="aspect-square rounded-lg border-2 border-dashed border-[var(--border-color)] hover:border-blue-bright cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-[var(--bg-secondary)]/30">
                         <input
                             type="file"
-                            accept="image/*"
+                            accept="image/jpeg,image/png,image/webp,image/gif"
                             multiple
                             onChange={handleFileSelect}
                             disabled={uploading}
diff --git a/web/src/components/listings/wizard/contact-step.tsx b/web/src/components/listings/wizard/contact-step.tsx
index ebfa2fa..e70d6ac 100644
--- a/web/src/components/listings/wizard/contact-step.tsx
+++ b/web/src/components/listings/wizard/contact-step.tsx
@@ -118,8 +118,8 @@ export function ContactStep() {
             }));
 
             const attributesArray = Object.entries(form.dynamicAttributes)
-                .filter(([key, value]) => key && value)
-                .map(([key, value]) => ({ key, value }));
+                .filter(([key, value]) => key && value !== undefined && value !== null && String(value) !== '')
+                .map(([key, value]) => ({ key, value: String(value) }));
 
             if (form.categoryId) {
                 const validation = await validateListingDraft({
diff --git a/web/src/components/ui/price-display.tsx b/web/src/components/ui/price-display.tsx
index 10b4feb..d1b586f 100644
--- a/web/src/components/ui/price-display.tsx
+++ b/web/src/components/ui/price-display.tsx
@@ -14,6 +14,10 @@ export function PriceDisplay({ amount, currency, priceType, className }: PriceDi
     return <span className={`text-orange font-semibold ${className ?? ''}`}>Ціна за запитом</span>;
   }
 
+  if (amount == null) {
+    return <span className={`text-orange font-semibold ${className ?? ''}`}>Ціна за запитом</span>;
+  }
+
   return (
     <span className={`flex items-center gap-2 ${className ?? ''}`}>
       <span className="font-heading font-bold text-lg text-[var(--text-primary)]">
diff --git a/web/src/lib/api.ts b/web/src/lib/api.ts
index 47aa12b..2e5bb21 100644
--- a/web/src/lib/api.ts
+++ b/web/src/lib/api.ts
@@ -118,15 +118,88 @@ async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
   return res.json();
 }
 
+function normalizeListingAttributes(rawListing: any) {
+  const existing = Array.isArray(rawListing?.attributes) ? rawListing.attributes : [];
+  if (existing.length > 0) {
+    return existing.map((item: any, index: number) => ({
+      id: String(item?.id ?? `${rawListing?.id ?? 'listing'}:${index}`),
+      key: String(item?.key ?? ''),
+      value: String(item?.value ?? ''),
+    }));
+  }
+
+  const data = rawListing?.attribute?.data;
+  if (!data || typeof data !== 'object' || Array.isArray(data)) {
+    return [];
+  }
+
+  return Object.entries(data)
+    .filter(([key, value]) => key && value !== undefined && value !== null && value !== '')
+    .map(([key, value], index) => ({
+      id: `${String(rawListing?.id ?? 'listing')}:${index}:${key}`,
+      key: String(key),
+      value: String(value),
+    }));
+}
+
+function normalizeMediaUrl(input: unknown): string {
+  const raw = typeof input === 'string' ? input.trim() : '';
+  if (!raw) return '';
+
+  if (raw.includes('/upload/files/')) {
+    return raw;
+  }
+
+  try {
+    const parsed = new URL(raw);
+    const match = parsed.pathname.match(
+      /^\/[^/]+\/(images|listings|companies)\/([A-Za-z0-9._-]+)$/,
+    );
+    if (match) {
+      const folder = match[1];
+      const filename = match[2];
+      return `${API_BASE}/upload/files/${folder}/${filename}`;
+    }
+  } catch {
+    return raw;
+  }
+
+  return raw;
+}
+
+function normalizeListingMedia(rawListing: any) {
+  const media = Array.isArray(rawListing?.media) ? rawListing.media : [];
+  return media.map((item: any, index: number) => ({
+    ...item,
+    id: String(item?.id ?? `${rawListing?.id ?? 'listing-media'}:${index}`),
+    url: normalizeMediaUrl(item?.url),
+  }));
+}
+
+function normalizeListing(rawListing: any) {
+  if (!rawListing || typeof rawListing !== 'object') return rawListing;
+  return {
+    ...rawListing,
+    media: normalizeListingMedia(rawListing),
+    attributes: normalizeListingAttributes(rawListing),
+  };
+}
+
 // Listings
 export const getListings = (params?: URLSearchParams) =>
-  fetchApi<PaginatedResponse<Listing>>(`/listings?${params?.toString() ?? ''}`);
+  fetchApi<PaginatedResponse<Listing>>(`/listings?${params?.toString() ?? ''}`).then((payload: any) => ({
+    ...payload,
+    data: Array.isArray(payload?.data) ? payload.data.map((item: any) => normalizeListing(item)) : [],
+  }));
 
 export const getListingById = (id: string) =>
-  fetchApi<Listing>(`/listings/${id}`);
+  fetchApi<Listing>(`/listings/${id}`).then((payload: any) => normalizeListing(payload));
 
 export const getCompanyListings = (companyId: string, params?: URLSearchParams) =>
-  fetchApi<PaginatedResponse<Listing>>(`/companies/${companyId}/listings?${params?.toString() ?? ''}`);
+  fetchApi<PaginatedResponse<Listing>>(`/companies/${companyId}/listings?${params?.toString() ?? ''}`).then((payload: any) => ({
+    ...payload,
+    data: Array.isArray(payload?.data) ? payload.data.map((item: any) => normalizeListing(item)) : [],
+  }));
 
 // Companies
 export const getCompanies = (params?: URLSearchParams) =>
@@ -196,13 +269,13 @@ export const createListing = (data: CreateListingPayload) =>
   fetchApi<Listing>('/listings', {
     method: 'POST',
     body: JSON.stringify(data),
-  });
+  }).then((payload: any) => normalizeListing(payload));
 
 export const updateListing = (id: string, data: UpdateListingPayload) =>
   fetchApi<Listing>(`/listings/${id}`, {
     method: 'PATCH',
     body: JSON.stringify(data),
-  });
+  }).then((payload: any) => normalizeListing(payload));
 
 // File Upload
 export async function uploadImages(files: File[]): Promise<{ urls: string[] }> {
@@ -474,6 +547,7 @@ export interface FormTemplate {
   blocks?: TemplateBlockSchema[];
   category?: { id: string; slug: string; hasEngine?: boolean };
   fields: FormField[];
+  resolvedFields?: FormField[];
 }
 
 export type FormField = TemplateFieldSchema;
```
