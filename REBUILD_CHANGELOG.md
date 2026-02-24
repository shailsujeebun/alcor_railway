# Rebuild Changelog

This document captures the implementation differences between:

- Base: `db4cd77` (`feat: add schema types, utility functions, and auth store`)
- Updated: `b4cd3db` (`Merge pull request #1 from Rosee1001/fix_Admin2`)

Use this as a rebuild guide if you need to recreate the same functionality from scratch.

## 1. Database Changes

### 1.1 Added category engine support and backfill
File:
- `api/prisma/migrations/20260223143000_backfill_motorized_categories/migration.sql`

What changed:
- Added `category.has_engine BOOLEAN NOT NULL DEFAULT FALSE`.
- Backfilled `has_engine = TRUE` for motorized categories via regex over slug/name.
- Propagated to descendants using a recursive CTE.

Why:
- Needed a durable signal for “motorized categories” to drive template fallback logic and engine-field behavior.

### 1.2 Added block assignment support to templates
File:
- `api/prisma/migrations/20260223150000_add_form_template_block_ids/migration.sql`

What changed:
- Added `form_template.block_ids JSONB NOT NULL DEFAULT []`.

Why:
- Enables attaching reusable field blocks (for example, `engine_block`) to templates.

### 1.3 Created reusable form block table
File:
- `api/prisma/migrations/20260224094000_create_form_block/migration.sql`

What changed:
- Created `form_block` table with:
- `id`
- `name` unique
- `is_system`
- `fields JSONB`
- timestamps

Why:
- Introduced reusable template blocks managed independently of form templates.

### 1.4 Switched `form_block.id` from UUID to string key
File:
- `api/prisma/migrations/20260224094500_form_block_id_text/migration.sql`

What changed:
- Dropped UUID default.
- Converted `form_block.id` to `TEXT`.

Why:
- Supports stable semantic IDs like `engine_block`.

### 1.5 Synced form-field/model drift
File:
- `api/prisma/migrations/20260224095500_sync_formfield_and_model/migration.sql`

What changed:
- Added `form_field.config JSONB`.
- Added `form_field.required_if JSONB`.
- Added `form_field.section TEXT`.
- Created `model` table with:
- `id`, `name`
- optional `brand_id`
- optional `category_id`
- indexes and unique constraint
- foreign keys to `Brand` and `category`

Why:
- Aligns DB schema with runtime/API expectations and options/model endpoints.

### 1.6 Prisma schema update
File:
- `api/prisma/schema.prisma`

What changed:
- `FormBlock.id` changed from UUID default to plain string primary key.

Why:
- Matches the migration and usage of string block IDs.

### 1.7 Seed pipeline changes
Files:
- `api/prisma/seed-all/core.ts`
- `api/prisma/seed.ts`

What changed:
- Added motorized category detection helper.
- Ensured system `engine_block` upsert during seed.
- Assigned `blockIds: ['engine_block']` for motorized templates.
- Kept local fields for non-motorized templates.
- Backfilled `category.hasEngine` during seed run.

Why:
- Ensures deterministic seeded runtime behavior for template/block composition.

## 2. Backend Changes

### 2.1 Admin template system and propagation
Files:
- `api/src/admin/admin.controller.ts`
- `api/src/admin/admin.service.ts`

What changed:
- Added/expanded block CRUD endpoints (`/admin/blocks`).
- Added `ensureSystemEngineBlock()` bootstrap behavior.
- Templates now expose:
- local `fields`
- merged `resolvedFields`
- Added descendant propagation behavior:
- creating/updating a template can create a new active template version for target categories.
- target set:
- descendants for normal categories
- all motorized categories for `hasEngine` roots
- Category create/update supports `hasEngine`.

Why:
- Keeps templates synchronized at scale and enables reusable engine block behavior.

### 2.2 Category template resolution and motorized fallback
Files:
- `api/src/categories/categories.service.ts`
- `api/src/categories/categories.service.spec.ts` (new)

What changed:
- Template selection precedence became explicit:
- own category active template first
- nearest ancestor active template
- sibling fallback
- motorized fallback scoring
- For `hasEngine` categories, `engine_block` is force-included in effective block IDs.
- If `engine_block` isn’t present in DB, service injects built-in engine block definition.
- Added tests covering:
- explicit template precedence
- motorized fallback behavior
- non-motorized null fallback

Why:
- Guarantees consistent engine field availability and prevents empty/misaligned forms.

### 2.3 Template schema processing overhaul
File:
- `api/src/templates/template-schema.ts`

What changed:
- Added large `DEFAULT_MOTORIZED_BLOCK_FIELDS`.
- Added/normalized support for:
- `dependsOn`
- `visibleIf`
- `requiredIf`
- `resetOnChange`
- `dataSource` and option mappings
- Added `getBuiltInEngineBlock()`.
- Added `mergeTemplateFieldsWithBlocks()` with key-based dedupe and ordering.

Why:
- Centralizes field composition logic and advanced conditional behavior.

### 2.4 Listing draft validation updates
File:
- `api/src/listings/listings.service.ts`

What changed:
- Improved checkbox validation:
- boolean checkbox still strict
- checkbox-group accepts array/comma-list semantics

Why:
- Supports richer dynamic attribute payloads from frontend.

### 2.5 Upload pipeline changes
Files:
- `api/src/upload/upload.controller.ts`
- `api/src/upload/upload.service.ts`
- `api/src/upload/upload.security.spec.ts`

What changed:
- `/upload/images` now returns app-served URLs via `/upload/files/:folder/:filename`.
- Added `GET /upload/files/:folder/:filename` stream endpoint with cache headers.
- `uploadFile()` now returns `{ key, url }` instead of only URL.
- Added file stream retrieval from S3/MinIO.
- Kept stricter content-type/signature checks and quota enforcement.

Why:
- Avoids direct storage URL/CORS issues and standardizes media URL handling.

### 2.6 Options and model behavior
Files:
- `api/src/options/options.controller.ts`
- `api/src/options/options.service.ts`
- `api/src/options/options.module.ts`

What changed:
- Uses `model` table for model option creation/query.
- Template selection in option generation prefers engine-block capable templates when applicable.

Why:
- Keeps model options and motorized category behavior aligned with new schema/template strategy.

### 2.7 Rule evaluation/util cleanup
Files:
- `api/src/common/rule-tree.ts`
- `api/src/common/rule-tree.spec.ts`

What changed:
- Minor cleanup/typing adjustment for rule tree leaf evaluation.

Why:
- Stability and readability around conditional field logic.

## 3. Frontend Changes

### 3.1 Admin categories page
File:
- `web/src/app/admin/categories/page.tsx`

What changed:
- Added `hasEngine` checkbox in create/edit dialog.
- Inherits `hasEngine` from parent when creating child category.
- Sends `hasEngine` in API payload.

Why:
- Admins can explicitly control motorized category behavior.

### 3.2 Admin template builder page
File:
- `web/src/app/admin/templates/builder/page.tsx`

What changed:
- Added collapsible sections.
- Added collapsible field cards.
- Added collapsible advanced settings.
- Uses `resolvedFields` fallback when template local fields are empty.
- Tracks and submits `blockIds`.
- Better editing support for:
- dependencies
- reset rules
- `visibleIf` and `requiredIf` JSON rule trees
- Defaults new fields with object rule values.

Why:
- Makes complex template authoring manageable and block-aware.

### 3.3 Dynamic listing form
File:
- `web/src/components/listings/dynamic-form.tsx`

What changed:
- Section accordion behavior (`openSection`).
- Preserved dependency engine usage for cascading resets/visibility.
- Updated section rendering/interaction model.

Why:
- Better UX for large multi-section templates.

### 3.4 Listing detail page (major redesign + data mapping)
File:
- `web/src/components/listings/listing-detail.tsx`

What changed:
- Full layout redesign (media, summary panel, seller panel, details panes).
- Fetches category template for label/option mapping.
- Converts raw attributes into display-friendly labels and grouped sections.
- Adds collapsible characteristic sections.
- Better image gallery behavior with active thumbnail.
- Adds cleaner date/location/description normalization.
- Expanded seller/contact visuals and utility sections.

Why:
- Makes listing details readable and semantically tied to template definitions.

### 3.5 Media uploader hardening
File:
- `web/src/components/listings/media-uploader.tsx`

What changed:
- Strict allowed MIME list (`jpeg/png/webp/gif`).
- 10MB per-file client-side size limit.
- Better upload response validation.
- File input accept restricted to explicit image MIME list.

Why:
- Reduces bad uploads and improves client feedback.

### 3.6 Wizard contact step attribute payload fix
File:
- `web/src/components/listings/wizard/contact-step.tsx`

What changed:
- Filters empty/null/undefined attributes more safely.
- Converts attribute values to strings before submit.

Why:
- Prevents backend validation mismatches for dynamic attributes.

### 3.7 Price display fallback
File:
- `web/src/components/ui/price-display.tsx`

What changed:
- Shows “price on request” if amount is null/undefined.

Why:
- Prevents broken price display when amount is absent.

### 3.8 API client normalization layer
File:
- `web/src/lib/api.ts`

What changed:
- Added `normalizeListing()` pipeline.
- Normalizes attributes from:
- array format
- legacy object format (`attribute.data`)
- Normalizes media URLs to app proxy route (`/upload/files/...`) when possible.
- Applies normalization to list/get/create/update listing calls.
- Extended types to include:
- `resolvedFields`
- `hasEngine`
- block metadata

Why:
- Makes frontend resilient to mixed backend payload shapes.

### 3.9 Query fetch behavior updates
File:
- `web/src/lib/queries.ts`

What changed:
- Category template query now:
- `staleTime: 0`
- refetch on mount
- refetch on window focus

Why:
- Ensures form/template UI reflects newest admin changes quickly.

### 3.10 Shared frontend schema and dependency utilities
Files:
- `web/src/lib/schemaTypes.ts`
- `web/src/lib/dependencyEngine.ts`

What changed:
- Formalized frontend types for field/block/rule metadata.
- Added rule tree evaluation + dependency graph helpers.

Why:
- Supports dynamic form logic and block-aware template rendering.

## 4. Docs and Ops Notes

Docs updated:
- `docs/AD.MD`
- `docs/ADMIN.MD`
- `docs/CLAUDE.md`
- `docs/DB_ER_DIAGRAM.MD`
- `docs/README.md`
- `docs/plan.md`
- `docs/production-test.md`
- `docs/project_status.md`
- `docs/secret-rotation-runbook.md`
- `docs/security-hardening.md`
- `docs/security-signoff-evidence.md`
- `docs/task.md`
- `docs/translation-privacy-policy.md`

Additional repo hygiene:
- `.gitignore` updated to ignore `.claude/`.

## 5. Rebuild Order (Recommended)

1. Apply all new migrations in order.
2. Update Prisma schema to string `FormBlock.id`.
3. Implement template schema/block system (`engine_block`, merge logic, rule/dependency support).
4. Implement backend template resolution and propagation logic.
5. Implement upload proxy serving (`/upload/files/...`) and service stream retrieval.
6. Update options/model backend behavior.
7. Update frontend API normalization layer and template query strategy.
8. Rebuild admin categories and template builder UIs (`hasEngine`, `blockIds`, advanced field controls).
9. Rebuild dynamic form and listing detail pages with template-aware rendering.
10. Run seed and verify:
- `engine_block` exists
- motorized categories have `hasEngine=true`
- templates with `blockIds` resolve correctly
- listing attributes/media normalize correctly in UI

## 6. Verification Checklist

1. DB
- `form_block` table exists.
- `form_template.block_ids` exists.
- `form_field.required_if/config/section` exist.
- `model` table exists with indexes/FKs.

2. Seed
- `engine_block` inserted/upserted.
- motorized categories marked with `hasEngine=true`.

3. Backend API
- `/admin/blocks` CRUD works.
- `/categories/:slug/template` returns block-merged fields.
- `/upload/images` returns app URLs.
- `/upload/files/:folder/:filename` streams media.

4. Frontend
- Admin template builder supports collapsible section/field/advanced panels.
- Listing form shows proper dynamic fields for motorized categories.
- Listing detail displays grouped mapped attributes with readable labels.
- Media upload validates mime/size and succeeds end-to-end.

